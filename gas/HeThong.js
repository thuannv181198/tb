/**
 * Chức năng hệ thống: cấu hình (Admin) và dữ liệu khởi động của khu vực quản lý.
 */
var HeThong = (function () {
  var FREE_TEXT_MAX = 200;

  function statusList() {
    var names = Repo.statusNames();
    return Config.STATUSES.map(function (s) {
      return { code: s.code, name: names[s.code], color: s.color, lendable: s.lendable, confirm: s.confirm };
    });
  }

  function activeRooms() {
    var t = Repo.table('DanhMucPhong');
    var rooms = [];
    for (var i = 0; i < t.size(); i++) {
      var code = Util.str(t.get(i, 'Mã phòng')).trim();
      if (!code) continue;
      rooms.push({ ma: code, ten: t.get(i, 'Tên phòng'), trangThai: t.get(i, 'Trạng thái') });
    }
    return rooms;
  }

  /** config.get → { values, statuses }. */
  function getConfig() {
    var c = Repo.config();
    var values = {};
    Config.CONFIG_DEFAULTS.forEach(function (row) { values[row[0]] = row[0] in c ? c[row[0]] : row[1]; });
    var descriptions = {};
    Config.CONFIG_DEFAULTS.forEach(function (row) { descriptions[row[0]] = row[2]; });
    return { values: values, descriptions: descriptions, statuses: statusList() };
  }

  /** Kiểm tra một giá trị theo Config.CONFIG_RULES. Trả giá trị đã chuẩn hóa hoặc ném VALIDATION. */
  function checkValue(key, raw, context) {
    var rule = Config.CONFIG_RULES[key] || {};
    var v = Util.cleanText(raw, FREE_TEXT_MAX, key);
    function bad(msg) { return Util.err('VALIDATION', msg, { fields: [key] }); }
    if (rule.int) {
      if (!/^\d+$/.test(v)) throw bad(key + ' phải là số nguyên.');
      var n = Number(v);
      if (n < rule.int[0] || n > rule.int[1]) throw bad(key + ' phải từ ' + rule.int[0] + ' đến ' + rule.int[1] + '.');
      return String(n);
    }
    if (rule.oneOf && rule.oneOf.indexOf(v) < 0) throw bad(key + ' chỉ nhận: ' + rule.oneOf.join(', ') + '.');
    if (rule.pattern) {
      if (key === 'TEN_MIEN_WORKSPACE') v = v.toLowerCase();
      if (!rule.pattern.test(v)) throw bad(rule.message || (key + ' không hợp lệ.'));
    }
    if (rule.statusCodes) {
      var codes = v.split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
      var known = Config.STATUSES.map(function (s) { return s.code; });
      codes.forEach(function (c) { if (known.indexOf(c) < 0) throw bad('Mã tình trạng không có: ' + c + '.'); });
      return codes.join(',');
    }
    if (rule.emails) {
      var list = v.split(',').map(function (s) { return Util.normEmail(s); }).filter(Boolean);
      list.forEach(function (e) { if (!Util.isEmail(e)) throw bad('Email không hợp lệ: ' + e + '.'); });
      return list.join(',');
    }
    if (rule.statusName) {
      if (!v) throw bad('Tên tình trạng không được để trống.');
      if (v.length > 40) throw bad('Tên tình trạng tối đa 40 ký tự.');
    }
    if (rule.room && context.rooms.indexOf(Util.normCode(v)) < 0) throw bad('Phòng ' + v + ' chưa có trong danh mục phòng.');
    return rule.room ? Util.normCode(v) : v;
  }

  /**
   * config.save: { values: {khóa: giá trị} } → giống config.get.
   * Đổi tên tình trạng thì ghi lại cột Tình trạng của ThietBi và danh sách thả xuống (C4).
   */
  function saveConfig(ctx) {
    var input = (ctx.data && ctx.data.values) || {};
    var keys = Object.keys(input);
    if (!keys.length) throw Util.err('VALIDATION', 'Không có thay đổi nào.');
    var known = {};
    Config.CONFIG_DEFAULTS.forEach(function (row) { known[row[0]] = row; });
    var current = getConfig().values;
    var context = { rooms: activeRooms().map(function (r) { return Util.normCode(r.ma); }) };

    var next = {};
    keys.forEach(function (k) {
      if (!known[k]) throw Util.err('VALIDATION', 'Khóa cấu hình không được sửa: ' + k + '.', { fields: [k] });
      next[k] = checkValue(k, input[k], context);
    });
    var merged = {};
    Object.keys(current).forEach(function (k) { merged[k] = k in next ? next[k] : current[k]; });

    if (merged.MA_TRUY_CAP_BAT === Config.YES && !/^\d{4,6}$/.test(merged.MA_TRUY_CAP)) {
      throw Util.err('VALIDATION', 'Bật mã truy cập thì phải đặt mã 4–6 chữ số.', { fields: ['MA_TRUY_CAP'] });
    }
    var oldNames = {};
    var newNames = {};
    var seen = {};
    Config.STATUSES.forEach(function (s) {
      var k = 'TEN_TT_' + s.code;
      oldNames[s.code] = current[k];
      newNames[s.code] = merged[k];
      var norm = Util.collapseSpaces(merged[k]).toLowerCase();
      if (seen[norm]) throw Util.err('VALIDATION', 'Hai tình trạng không được trùng tên: ' + merged[k] + '.', { fields: [k] });
      seen[norm] = true;
    });

    var changed = keys.filter(function (k) { return next[k] !== current[k]; });
    if (!changed.length) return getConfig();

    // Ghi ThietBi trước CauHinh: nếu bị ngắt giữa chừng, gửi lại cùng requestId vẫn thấy tên cũ trong
    // CauHinh nên chạy lại phần đổi tên (dòng đã đổi thì bỏ qua) rồi mới ghi CauHinh (đặc tả mục 2.2)
    var renamed = Config.STATUSES.filter(function (s) { return oldNames[s.code] !== newNames[s.code]; });
    if (renamed.length) renameStatuses(oldNames, newNames);

    var t = Repo.table('CauHinh');
    changed.forEach(function (k) {
      var i = t.find('Khóa', k, function (v) { return Util.str(v).trim(); });
      if (i < 0) t.append({ 'Khóa': k, 'Giá trị': next[k], 'Mô tả': known[k][2] });
      else t.set(i, 'Giá trị', next[k]);
    });
    t.flush();
    Repo.clearConfig();

    ctx.log = {
      target: 'CauHinh',
      detail: 'Sửa: ' + changed.join(', ') + (renamed.length ? '; đổi tên tình trạng, ghi lại cột Tình trạng' : '')
    };
    return getConfig();
  }

  /** Ghi lại cột Tình trạng của ThietBi theo tên mới, đặt lại danh sách thả xuống. Chạy lại được. */
  function renameStatuses(oldNames, newNames) {
    var map = {};
    Config.STATUSES.forEach(function (s) {
      map[Util.collapseSpaces(oldNames[s.code]).toLowerCase()] = newNames[s.code];
    });
    var t = Repo.table('ThietBi');
    var touched = 0;
    for (var i = 0; i < t.size(); i++) {
      var cur = Util.collapseSpaces(t.get(i, 'Tình trạng')).toLowerCase();
      if (cur in map && t.get(i, 'Tình trạng') !== map[cur]) {
        t.set(i, 'Tình trạng', map[cur]);
        touched++;
      }
    }
    t.flush();
    if (touched) Repo.bumpDataVersion();
    Setup.applyStatusValidation(Repo.spreadsheet(), Config.STATUSES.map(function (s) { return newNames[s.code]; }));
    return touched;
  }

  /** app.bootstrap: dữ liệu khởi động khu vực quản lý. Danh sách thiết bị thêm ở M2. */
  function bootstrap(ctx) {
    var c = Repo.config();
    return {
      user: { email: ctx.user.email, name: ctx.user.name || '', role: ctx.user.role, isOwner: !!ctx.user.isOwner },
      expiresAt: Util.iso(new Date(ctx.user.expiresMs)),
      unitName: c.TEN_DON_VI || 'KHOA CÔNG NGHỆ NĂNG LƯỢNG',
      statuses: statusList(),
      rooms: activeRooms(),
      dataVersion: Repo.dataVersion(),
      limits: {
        hanMuonNgay: Util.toInt(c.HAN_MUON_NGAY, 2),
        hanDeXuatToiDaNgay: Util.toInt(c.HAN_DE_XUAT_TOI_DA_NGAY, 2),
        phienGio: Util.toInt(c.PHIEN_GIO, 12)
      },
      serverVersion: Api.VERSION
    };
  }

  return {
    getConfig: getConfig,
    saveConfig: saveConfig,
    bootstrap: bootstrap,
    statusList: statusList
  };
})();
