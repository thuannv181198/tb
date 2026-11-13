/**
 * Nâng cấp cấu trúc dữ liệu theo SCHEMA_VERSION (lưu trong CauHinh).
 * Mỗi lần đổi cấu trúc (thêm sheet, thêm cột) thêm một bước có số version tăng dần vào STEPS.
 * Mọi bước phải chạy lại được nhiều lần mà không hỏng dữ liệu (idempotent).
 * Không đổi tên, không xóa sheet hay cột đã có trong hợp đồng dữ liệu.
 */
var Migrations = (function () {
  var STEPS = [
    {
      version: 1,
      description: 'Tạo 25 sheet và hàng tiêu đề ban đầu',
      run: function (ss) {
        Config.SHEETS.forEach(function (def) { ensureSheet(ss, def); });
      }
    }
  ];

  /**
   * Bảo đảm sheet tồn tại và có đủ cột của định nghĩa. Cột thiếu được thêm vào cuối.
   * Cột 1–9 của ThietBi phải đúng thứ tự; sai thì dừng để người dùng sửa tay.
   * Trả { sheet, created, added: [tên cột đã thêm] }.
   */
  function ensureSheet(ss, def) {
    var sheet = ss.getSheetByName(def.name);
    var created = false;
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      created = true;
    }
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(Util.str) : [];
    while (headers.length && headers[headers.length - 1] === '') headers.pop();

    if (def.fixedColumns && headers.length) {
      for (var i = 0; i < def.fixedColumns; i++) {
        if (headers[i] !== def.cols[i].name) {
          throw new Error('Sheet ' + def.name + ': cột ' + (i + 1) + ' phải là "' + def.cols[i].name +
            '" nhưng đang là "' + (headers[i] || '') + '". Hãy sửa lại thứ tự cột 1–' + def.fixedColumns + ' rồi chạy lại setup().');
        }
      }
    }

    var missing = def.cols
      .map(function (c) { return c.name; })
      .filter(function (name) { return headers.indexOf(name) < 0; });
    if (missing.length) {
      var start = headers.length + 1;
      var need = start + missing.length - 1;
      var maxCols = sheet.getMaxColumns();
      if (need > maxCols) sheet.insertColumnsAfter(maxCols, need - maxCols);
      sheet.getRange(1, start, 1, missing.length).setValues([missing]);
    }
    return { sheet: sheet, created: created, added: missing };
  }

  /** SCHEMA_VERSION hiện tại; chưa có sheet CauHinh hoặc khóa thì là 0. */
  function currentVersion(ss) {
    var sheet = ss.getSheetByName('CauHinh');
    if (!sheet || sheet.getLastRow() < 2) return 0;
    var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
    var keyCol = values[0].map(Util.str).indexOf('Khóa');
    var valCol = values[0].map(Util.str).indexOf('Giá trị');
    if (keyCol < 0 || valCol < 0) return 0;
    for (var r = 1; r < values.length; r++) {
      if (Util.str(values[r][keyCol]).trim() === 'SCHEMA_VERSION') return Util.toInt(values[r][valCol], 0);
    }
    return 0;
  }

  function setVersion(ss, version) {
    ensureSheet(ss, Config.sheet('CauHinh'));
    Repo.useSpreadsheet(ss);
    var t = Repo.table('CauHinh');
    var i = t.find('Khóa', 'SCHEMA_VERSION', function (v) { return Util.str(v).trim(); });
    if (i < 0) {
      t.append({ 'Khóa': 'SCHEMA_VERSION', 'Giá trị': String(version), 'Mô tả': 'Phiên bản cấu trúc dữ liệu, setup() tự cập nhật. Không sửa tay.' });
    } else {
      t.set(i, 'Giá trị', String(version));
    }
    t.flush();
  }

  /**
   * Chạy các bước có version lớn hơn version hiện tại, theo thứ tự tăng dần; ghi version sau
   * từng bước để lần chạy sau tiếp tục đúng chỗ nếu bị dừng giữa chừng.
   * steps: để kiểm thử truyền danh sách riêng; mặc định STEPS.
   */
  function run(ss, steps) {
    var list = (steps || STEPS).slice().sort(function (a, b) { return a.version - b.version; });
    for (var i = 1; i < list.length; i++) {
      if (list[i].version === list[i - 1].version) throw new Error('Trùng số bước nâng cấp: ' + list[i].version);
    }
    var from = currentVersion(ss);
    var ran = [];
    list.forEach(function (step) {
      if (step.version > from) {
        step.run(ss);
        setVersion(ss, step.version);
        ran.push(step.version);
      }
    });
    return { from: from, to: currentVersion(ss), ran: ran };
  }

  function latest() {
    return STEPS[STEPS.length - 1].version;
  }

  return {
    STEPS: STEPS,
    ensureSheet: ensureSheet,
    currentVersion: currentVersion,
    run: run,
    latest: latest
  };
})();
