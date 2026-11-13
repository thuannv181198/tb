/**
 * Lớp truy cập dữ liệu: Script Properties, Spreadsheet, đọc theo tên cột, ghi theo khối,
 * khóa ghi, bộ đếm mã BoDem, cấu hình CauHinh.
 * Mỗi lần chạy (một request) mở Spreadsheet một lần, đọc Properties một lần.
 */
var Repo = (function () {
  var state = { props: null, ss: null, locked: false, config: null };

  // ---------- Script Properties ----------

  /** Toàn bộ Script Properties, đọc một lần mỗi lần chạy. */
  function props() {
    if (!state.props) state.props = PropertiesService.getScriptProperties().getProperties();
    return state.props;
  }

  function setProps(values) {
    PropertiesService.getScriptProperties().setProperties(values, false);
    var p = props();
    Object.keys(values).forEach(function (k) { p[k] = String(values[k]); });
  }

  // ---------- Spreadsheet ----------

  function spreadsheet() {
    if (!state.ss) {
      var id = props()[Config.PROP.SHEET_ID];
      if (!id) throw Util.err('SERVER_ERROR', 'Hệ thống chưa được cài đặt (thiếu SHEET_ID). Hãy chạy setup().');
      state.ss = SpreadsheetApp.openById(id);
    }
    return state.ss;
  }

  function useSpreadsheet(ss) {
    state.ss = ss;
    state.config = null;
  }

  function getSheet(name) {
    var sh = spreadsheet().getSheetByName(name);
    if (!sh) throw Util.err('SERVER_ERROR', 'Thiếu sheet "' + name + '". Hãy chạy setup().');
    return sh;
  }

  // ---------- Chuyển giá trị ô ----------

  /** Giá trị đọc từ ô → giá trị theo kiểu cột. */
  function fromCell(v, type) {
    switch (type) {
      case 'N':
        if (v === '' || v === null || v === undefined) return null;
        return typeof v === 'number' ? v : Number(v);
      case 'D':
      case 'DT':
        return Util.isDate(v) ? v : null;
      default:
        if (Util.isDate(v)) return Util.formatDate(v, 'dd/MM/yyyy');
        return Util.str(v);
    }
  }

  /**
   * Giá trị cần ghi → giá trị ô. Kiểm tra kiểu, độ dài; chuỗi đi qua Util.toSheetText.
   * lenient: dùng khi ghi lại ô không đổi đọc từ Sheet (có thể do người dùng sửa tay sai kiểu):
   * giữ nguyên giá trị thay vì báo lỗi.
   */
  function toCell(v, type, label, lenient) {
    if (v === null || v === undefined || v === '') return '';
    switch (type) {
      case 'N':
        var n = typeof v === 'number' ? v : Number(v);
        if (isNaN(n)) {
          if (lenient) return typeof v === 'string' ? Util.toSheetText(v) : v;
          throw Util.err('VALIDATION', 'Cột "' + label + '" phải là số.');
        }
        return n;
      case 'D':
      case 'DT':
        if (!Util.isDate(v)) {
          if (lenient) return typeof v === 'string' ? Util.toSheetText(v) : v;
          throw Util.err('VALIDATION', 'Cột "' + label + '" phải là ngày giờ.');
        }
        return v;
      case 'B':
        if (v === true) return Config.YES;
        if (v === false) return Config.NO;
        return checkLength(Util.toSheetText(String(v)), label);
      case 'J':
        return checkLength(Util.toSheetText(typeof v === 'string' ? v : JSON.stringify(v)), label);
      case 'T':
        if (Util.isDate(v) || typeof v === 'number' || typeof v === 'boolean') {
          if (lenient) return v;
          if (Util.isDate(v)) throw Util.err('VALIDATION', 'Cột "' + label + '" phải là chuỗi.');
        }
        return checkLength(Util.toSheetText(String(v)), label);
      default: // cột không có trong định nghĩa (do người dùng tự thêm): ghi lại nguyên giá trị
        return typeof v === 'string' ? Util.toSheetText(v) : v;
    }
  }

  function checkLength(s, label) {
    if (s.length > Config.MAX_CELL_CHARS) {
      throw Util.err('VALIDATION', 'Nội dung cột "' + label + '" vượt ' + Config.MAX_CELL_CHARS + ' ký tự.');
    }
    return s;
  }

  // ---------- Table: đọc một lần, sửa trong bộ nhớ, ghi theo khối ----------

  /**
   * Đọc toàn bộ một sheet theo tên cột. Chỉ số dòng i tính từ 0 (dòng dữ liệu đầu tiên).
   * Thiếu cột của định nghĩa thì báo lỗi, yêu cầu chạy setup().
   */
  function Table(sheet, def) {
    this.sheet = sheet;
    this.def = def;
    this.types = {};
    var self = this;
    def.cols.forEach(function (c) { self.types[c.name] = c.type; });
    var lastCol = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();
    this.headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(Util.str) : [];
    this.index = {};
    this.headers.forEach(function (h, i) { if (h && !(h in self.index)) self.index[h] = i; });
    def.cols.forEach(function (c) {
      if (!(c.name in self.index)) {
        throw Util.err('SERVER_ERROR', 'Sheet "' + def.name + '" thiếu cột "' + c.name + '". Hãy chạy setup().');
      }
    });
    this.width = this.headers.length;
    this.rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, this.width).getValues() : [];
    this.dirty = {};
    this.added = [];
    this.notes = {}; // tên cột → mảng note của cả cột (đọc khi cần)
    this.dirtyNotes = {}; // tên cột → { chỉ số dòng: true }
  }

  Table.prototype.size = function () {
    return this.rows.length;
  };

  Table.prototype.col = function (name) {
    if (!(name in this.index)) throw Util.err('SERVER_ERROR', 'Sheet "' + this.def.name + '" không có cột "' + name + '".');
    return this.index[name];
  };

  Table.prototype.get = function (i, name) {
    return fromCell(this.rows[i][this.col(name)], this.types[name]);
  };

  Table.prototype.set = function (i, name, value) {
    toCell(value, this.types[name], name); // kiểm tra sớm
    var c = this.col(name);
    this.rows[i][c] = value;
    if (!this.dirty[i] || this.dirty[i] === true) this.dirty[i] = {};
    this.dirty[i][c] = true;
  };

  /** Một dòng dạng đối tượng {tên cột: giá trị}, chỉ gồm các cột của định nghĩa. */
  Table.prototype.object = function (i) {
    var self = this;
    var o = { _row: i };
    this.def.cols.forEach(function (c) { o[c.name] = self.get(i, c.name); });
    return o;
  };

  Table.prototype.objects = function () {
    var out = [];
    for (var i = 0; i < this.rows.length; i++) out.push(this.object(i));
    return out;
  };

  /** Chỉ số dòng đầu tiên có cột name bằng value sau khi chuẩn hóa (mặc định Util.normCode). -1 nếu không có. */
  Table.prototype.find = function (name, value, normalize) {
    var norm = normalize || Util.normCode;
    var target = norm(value);
    var c = this.col(name);
    for (var i = 0; i < this.rows.length; i++) {
      if (norm(fromCell(this.rows[i][c], this.types[name])) === target) return i;
    }
    return -1;
  };

  Table.prototype.findAll = function (name, value, normalize) {
    var norm = normalize || Util.normCode;
    var target = norm(value);
    var c = this.col(name);
    var out = [];
    for (var i = 0; i < this.rows.length; i++) {
      if (norm(fromCell(this.rows[i][c], this.types[name])) === target) out.push(i);
    }
    return out;
  };

  /** Thêm dòng mới (ghi khi flush). Trả chỉ số dòng trong bảng. */
  Table.prototype.append = function (obj) {
    var self = this;
    var row = [];
    for (var k = 0; k < this.width; k++) row.push('');
    Object.keys(obj).forEach(function (name) {
      if (name === '_row') return;
      toCell(obj[name], self.types[name], name);
      row[self.col(name)] = obj[name];
    });
    this.rows.push(row);
    this.added.push(this.rows.length - 1);
    return this.rows.length - 1;
  };

  Table.prototype.getNote = function (i, name) {
    this.loadNotes(name);
    return this.notes[name][i] || '';
  };

  Table.prototype.setNote = function (i, name, text) {
    this.loadNotes(name);
    this.notes[name][i] = Util.str(text);
    this.dirtyNotes[name] = this.dirtyNotes[name] || {};
    this.dirtyNotes[name][i] = true;
  };

  Table.prototype.loadNotes = function (name) {
    if (this.notes[name]) return;
    var existing = this.rows.length - this.added.length;
    var list = existing > 0
      ? this.sheet.getRange(2, this.col(name) + 1, existing, 1).getNotes().map(function (r) { return r[0]; })
      : [];
    while (list.length < this.rows.length) list.push('');
    this.notes[name] = list;
  };

  /** Ghi mọi thay đổi: dòng sửa theo khối liên tiếp, dòng mới một lần, rồi note. */
  Table.prototype.flush = function () {
    var self = this;
    var addedSet = {};
    this.added.forEach(function (i) { addedSet[i] = true; });
    var changed = Object.keys(this.dirty).map(Number)
      .filter(function (i) { return !addedSet[i]; })
      .sort(function (a, b) { return a - b; });
    blocks(changed).forEach(function (b) {
      var values = [];
      for (var i = b[0]; i <= b[1]; i++) values.push(self.rowToCells(i));
      self.sheet.getRange(b[0] + 2, 1, values.length, self.width).setValues(values);
    });
    if (this.added.length) {
      var first = this.added[0];
      var values2 = this.added.map(function (i) { return self.rowToCells(i); });
      writeNewRows(this.sheet, this.def, this.headers, first + 2, values2);
    }
    Object.keys(this.dirtyNotes).forEach(function (name) {
      var idx = Object.keys(self.dirtyNotes[name]).map(Number).sort(function (a, b) { return a - b; });
      blocks(idx).forEach(function (b) {
        var notes = [];
        for (var i = b[0]; i <= b[1]; i++) notes.push([self.notes[name][i] || '']);
        self.sheet.getRange(b[0] + 2, self.col(name) + 1, notes.length, 1).setNotes(notes);
      });
    });
    this.dirty = {};
    this.added = [];
    this.dirtyNotes = {};
  };

  /** Ô do code đặt (set/append) kiểm tra chặt; ô giữ nguyên từ Sheet ghi lại nguyên trạng. */
  Table.prototype.rowToCells = function (i) {
    var self = this;
    var touched = this.dirty[i] === true ? {} : (this.dirty[i] || {});
    var isNew = this.added.indexOf(i) >= 0;
    return this.rows[i].map(function (v, c) {
      var name = self.headers[c];
      return toCell(v, self.types[name], name, !(isNew || touched[c]));
    });
  };

  /** Gom các chỉ số đã sắp xếp thành khối liên tiếp [đầu, cuối]. */
  function blocks(sorted) {
    var out = [];
    sorted.forEach(function (i) {
      var last = out[out.length - 1];
      if (last && last[1] === i - 1) last[1] = i;
      else out.push([i, i]);
    });
    return out;
  }

  /**
   * Ghi các dòng mới bắt đầu từ startRow: thêm dòng nếu sheet không đủ, đặt định dạng
   * số cho khối (dòng mới không phụ thuộc định dạng kế thừa), rồi ghi giá trị một lần.
   * Định dạng đặt theo từng nhóm cột liền nhau cùng định dạng; cột không có định dạng để nguyên.
   */
  function writeNewRows(sheet, def, headers, startRow, values) {
    if (!values.length) return;
    var need = startRow + values.length - 1;
    var maxRows = sheet.getMaxRows();
    if (need > maxRows) sheet.insertRowsAfter(maxRows, need - maxRows);
    var types = {};
    def.cols.forEach(function (c) { types[c.name] = c.type; });
    var formats = headers.map(function (h) { return types[h] ? Config.FORMAT[types[h]] : null; });
    var start = 0;
    for (var c = 1; c <= formats.length; c++) {
      if (c === formats.length || formats[c] !== formats[start]) {
        if (formats[start]) sheet.getRange(startRow, start + 1, values.length, c - start).setNumberFormat(formats[start]);
        start = c;
      }
    }
    sheet.getRange(startRow, 1, values.length, headers.length).setValues(values);
  }

  function table(name) {
    return new Table(getSheet(name), Config.sheet(name));
  }

  /**
   * Thêm dòng vào cuối sheet mà không đọc dữ liệu cũ (dùng cho NhatKy, LichSu, KetQuaRequest).
   * objs: mảng {tên cột: giá trị}. Bắt buộc chạy trong vùng khóa: hai lần chạy song song tính
   * cùng một "dòng cuối + 1" sẽ ghi đè nhau. Ghi NhatKy cho action chỉ đọc thì bọc withLock riêng.
   */
  function append(name, objs) {
    requireLock();
    if (!objs.length) return;
    var def = Config.sheet(name);
    var sheet = getSheet(name);
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(Util.str);
    var types = {};
    def.cols.forEach(function (c) {
      types[c.name] = c.type;
      if (headers.indexOf(c.name) < 0) {
        throw Util.err('SERVER_ERROR', 'Sheet "' + name + '" thiếu cột "' + c.name + '". Hãy chạy setup().');
      }
    });
    var values = objs.map(function (o) {
      Object.keys(o).forEach(function (k) {
        if (headers.indexOf(k) < 0) throw Util.err('SERVER_ERROR', 'Sheet "' + name + '" không có cột "' + k + '".');
      });
      return headers.map(function (h) { return toCell(o[h], types[h], h); });
    });
    writeNewRows(sheet, def, headers, sheet.getLastRow() + 1, values);
  }

  // ---------- Khóa ghi (mục 2.2) ----------

  /**
   * Chạy fn trong vùng khóa: không lấy được khóa sau timeoutMs thì báo BUSY, không ghi gì.
   * SpreadsheetApp.flush() rồi nhả khóa trong finally, kể cả khi fn lỗi: phần đã ghi
   * (ví dụ số đã cấp ở BoDem) phải lên Sheet trước khi request khác lấy được khóa.
   * Lồng nhau thì dùng chung khóa.
   */
  function withLock(fn, timeoutMs) {
    if (state.locked) return fn();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(timeoutMs || 10000)) {
      throw Util.err('BUSY', 'Hệ thống đang bận, vui lòng bấm lại sau vài giây.');
    }
    state.locked = true;
    try {
      return fn();
    } finally {
      try {
        SpreadsheetApp.flush();
      } finally {
        state.locked = false;
        lock.releaseLock();
      }
    }
  }

  function isLocked() {
    return state.locked;
  }

  function requireLock() {
    if (!state.locked) throw new Error('Lỗi lập trình: thao tác ghi phải chạy trong Repo.withLock().');
  }

  // ---------- Bộ đếm mã BoDem ----------

  /**
   * Cấp count mã liên tiếp cho loại mã type (Config.CODE_TYPES). Chạy trong vùng khóa.
   * Ghi BoDem ngay để số đã cấp không bao giờ bị cấp lại, kể cả khi bước sau lỗi.
   */
  function nextCodes(type, count) {
    requireLock();
    var def = Config.CODE_TYPES[type];
    if (!def) throw new Error('Không có loại mã: ' + type);
    var n = count || 1;
    var period = Util.periodKey(def.period, Util.now());
    var t = table('BoDem');
    var idx = -1;
    for (var i = 0; i < t.size(); i++) {
      if (Util.normCode(t.get(i, 'Loại mã')) === type && Util.str(t.get(i, 'Kỳ')).trim() === period) { idx = i; break; }
    }
    var last = 0;
    if (idx < 0) idx = t.append({ 'Loại mã': type, 'Kỳ': period, 'Số cuối đã cấp': 0 });
    else last = t.get(idx, 'Số cuối đã cấp') || 0;
    t.set(idx, 'Số cuối đã cấp', last + n);
    t.flush();
    var codes = [];
    for (var k = 1; k <= n; k++) codes.push(Util.formatSeqCode(def, period, last + k));
    return codes;
  }

  /**
   * Cấp count Mã TB liên tiếp cho nhóm groupCode (đặc tả mục 5). Chạy trong vùng khóa.
   * Số tiếp theo = số lớn nhất trong NhomTB."Số thứ tự cuối đã cấp" và các Mã TB đang có của
   * nhóm, cộng 1; số của thiết bị đã thanh lý, mất hay dòng đã xóa không bao giờ được cấp lại.
   * Ghi NhomTB ngay. Nhóm chưa có trong NhomTB thì báo NOT_FOUND (tạo nhóm thuộc M2).
   */
  function nextDeviceCodes(groupCode, count) {
    requireLock();
    var code = Util.normCode(groupCode);
    var n = count || 1;
    var groups = table('NhomTB');
    var gi = groups.find('Mã nhóm', code);
    if (gi < 0) throw Util.err('NOT_FOUND', 'Chưa có nhóm thiết bị mã ' + code + '.');
    var last = groups.get(gi, 'Số thứ tự cuối đã cấp') || 0;
    var devices = table('ThietBi');
    var prefix = code + '-';
    for (var i = 0; i < devices.size(); i++) {
      var tb = Util.normCode(devices.get(i, 'Mã TB'));
      if (tb.indexOf(prefix) === 0 && /^\d+$/.test(tb.slice(prefix.length))) {
        last = Math.max(last, Util.deviceNumber(tb));
      }
    }
    groups.set(gi, 'Số thứ tự cuối đã cấp', last + n);
    groups.flush();
    var codes = [];
    for (var k = 1; k <= n; k++) codes.push(Util.deviceCode(code, last + k));
    return codes;
  }

  // ---------- CauHinh ----------

  /** Bảng khóa → giá trị (chuỗi) của CauHinh, đọc một lần mỗi lần chạy. */
  function config() {
    if (!state.config) {
      var t = table('CauHinh');
      var map = {};
      for (var i = 0; i < t.size(); i++) {
        var k = Util.str(t.get(i, 'Khóa')).trim();
        if (k && !(k in map)) map[k] = Util.str(t.get(i, 'Giá trị'));
      }
      state.config = map;
    }
    return state.config;
  }

  function configInt(key, fallback) {
    return Util.toInt(config()[key], fallback);
  }

  /** Tên hiển thị hiện tại của các tình trạng: mã nội bộ → tên. */
  function statusNames() {
    var c = config();
    var out = {};
    Config.STATUSES.forEach(function (s) { out[s.code] = c['TEN_TT_' + s.code] || s.name; });
    return out;
  }

  /** Tên hiển thị → mã nội bộ (so sánh không phân biệt hoa thường). Không khớp thì ''. */
  function statusCode(name) {
    var names = statusNames();
    var target = Util.collapseSpaces(name).toLowerCase();
    var codes = Object.keys(names);
    for (var i = 0; i < codes.length; i++) {
      if (Util.collapseSpaces(names[codes[i]]).toLowerCase() === target) return codes[i];
    }
    return '';
  }

  return {
    props: props,
    setProps: setProps,
    spreadsheet: spreadsheet,
    useSpreadsheet: useSpreadsheet,
    getSheet: getSheet,
    fromCell: fromCell,
    toCell: toCell,
    table: table,
    append: append,
    withLock: withLock,
    isLocked: isLocked,
    nextCodes: nextCodes,
    nextDeviceCodes: nextDeviceCodes,
    config: config,
    configInt: configInt,
    statusNames: statusNames,
    statusCode: statusCode
  };
})();
