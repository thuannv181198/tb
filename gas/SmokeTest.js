/**
 * smokeTest(): kiểm chứng trên Google thật những điều bộ giả lập trong tests/ chỉ phỏng đoán.
 * Chỉ chạy khi Script Property MOI_TRUONG = DEV. Ghi vào một sheet tạm rồi xóa sheet đó.
 * Người dùng chạy trong trình soạn thảo Apps Script và gửi lại nội dung Nhật ký thực thi.
 */
function smokeTest() {
  var report = SmokeTest.run();
  Logger.log(report.text);
  return report;
}

var SmokeTest = (function () {
  function run() {
    var env = Repo.props()[Config.PROP.ENV];
    if (env !== 'DEV') {
      throw new Error('smokeTest() chỉ chạy trên project DEV (Script Property MOI_TRUONG = DEV). Hiện tại: "' + (env || 'chưa đặt') + '".');
    }
    var ss = Repo.spreadsheet();
    var name = '_SmokeTest_' + Util.formatDate(Util.now(), 'yyyyMMddHHmmss');
    var sheet = ss.insertSheet(name);
    var results = [];

    function check(label, fn) {
      try {
        var detail = fn();
        results.push({ ok: detail === true || detail === undefined, label: label, detail: detail === true || detail === undefined ? '' : String(detail) });
      } catch (e) {
        results.push({ ok: false, label: label, detail: 'Lỗi: ' + e.message });
      }
    }

    // format null: dùng cột chưa từng đặt định dạng (định dạng tự động của Sheet)
    function roundTrip(values, format, transform, column) {
      var range = sheet.getRange(1, column || 1, values.length, 1);
      range.clearContent();
      if (format) range.setNumberFormat(format);
      range.setValues(values.map(function (v) { return [transform ? transform(v) : v]; }));
      SpreadsheetApp.flush();
      var back = range.getValues().map(function (r) { return r[0]; });
      var wrong = [];
      values.forEach(function (v, i) {
        if (back[i] !== v) wrong.push(JSON.stringify(v) + ' → ' + JSON.stringify(back[i]));
      });
      return wrong.length ? 'Sai: ' + wrong.join('; ') : true;
    }

    try {
      var numericLike = ['0912345678', '00123', '12345678901234567890', '1E5', '3-4', '2026-11-05', '05/11/2026', 'TRUE', '12%'];
      check('Ô văn bản thuần (@) giữ nguyên chuỗi số, ngày, logic', function () {
        return roundTrip(numericLike, '@');
      });
      check('Ô định dạng tự động đổi kiểu chuỗi số (vì vậy mọi cột mã phải là văn bản thuần)', function () {
        var r = roundTrip(['0123'], null, null, 4);
        return r === true ? 'Không đổi kiểu – khác giả định của bộ giả lập' : true;
      });
      var formulaLike = ['=1+1', '+84912345678', '-5', '@abc', "'abc", '=HYPERLINK("http://x","y")'];
      check('Util.toSheetText trên ô văn bản thuần: không thành công thức, đọc lại đúng chuỗi gốc', function () {
        return roundTrip(formulaLike, '@', Util.toSheetText);
      });
      check('Util.toSheetText trên ô định dạng tự động: đọc lại đúng chuỗi gốc', function () {
        return roundTrip(formulaLike, null, Util.toSheetText, 5);
      });
      check('Chuỗi "=1+1" không có dấu nháy trên ô văn bản thuần thành công thức (giả định của bộ giả lập)', function () {
        var range = sheet.getRange(1, 2);
        range.setNumberFormat('@');
        range.setValue('=1+1');
        SpreadsheetApp.flush();
        return range.getFormula() ? true : 'Không thành công thức – bộ giả lập chặt hơn thực tế, vẫn an toàn';
      });
      check('Ngày giờ ghi rồi đọc lại đúng thời điểm', function () {
        var d = Util.vnDate(2026, 11, 5, 23, 59, 59);
        var range = sheet.getRange(1, 3);
        range.setNumberFormat(Config.FORMAT.DT);
        range.setValue(d);
        SpreadsheetApp.flush();
        var back = range.getValue();
        return Util.isDate(back) && back.getTime() === d.getTime() ? true : 'Đọc lại: ' + back;
      });
      check('Utilities.formatDate theo giờ Việt Nam và ISO 8601', function () {
        var s = Util.iso(Util.vnDate(2026, 11, 10, 8, 30, 0));
        return s === '2026-11-10T08:30:00+07:00' ? true : 'Nhận được ' + s;
      });
      check('Note của ô ghi rồi đọc lại', function () {
        var range = sheet.getRange(2, 1, 2, 1);
        range.setNotes([['05/11/2026 – nứt vỏ – ghi bởi a@b'], ['']]);
        var back = range.getNotes();
        return back[0][0] === '05/11/2026 – nứt vỏ – ghi bởi a@b' && back[1][0] === '' ? true : JSON.stringify(back);
      });
      check('Ghi dòng mới vượt số dòng sẵn có của sheet', function () {
        var max = sheet.getMaxRows();
        sheet.insertRowsAfter(max, 2);
        sheet.getRange(max + 2, 1).setValue('x');
        return sheet.getLastRow() === max + 2 ? true : 'Dòng cuối: ' + sheet.getLastRow();
      });
      check('Khóa: lấy được rồi nhả', function () {
        var lock = LockService.getScriptLock();
        var ok = lock.tryLock(5000);
        if (ok) lock.releaseLock();
        return ok ? true : 'Không lấy được khóa';
      });
      check('Bộ đệm: ghi, đọc, xóa', function () {
        var cache = CacheService.getScriptCache();
        cache.put('qltb_smoke', 'ok', 60);
        var v = cache.get('qltb_smoke');
        cache.remove('qltb_smoke');
        return v === 'ok' ? true : 'Đọc lại: ' + v;
      });
      check('Drive: tạo thư mục tạm rồi chuyển vào thùng rác', function () {
        var root = DriveApp.getFolderById(Repo.props()[Config.PROP.DRIVE_FOLDER_ID]);
        var f = root.createFolder('_smoke_' + Date.now());
        f.setTrashed(true);
        return f.isTrashed() ? true : 'Không vào thùng rác';
      });
      check('HMAC-SHA256 (dùng cho mã phiên)', function () {
        var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('abc', 'key'));
        // Giá trị chuẩn tính bằng Node: crypto.createHmac('sha256', 'key').update('abc'), base64 an toàn cho URL
        return sig === 'nBluMtwBdfhvSxy4konWYZ3mvuaZ5MN45oMJ7Zehpqs=' ? true : 'Nhận được ' + sig;
      });
    } finally {
      ss.deleteSheet(sheet);
    }

    var passed = results.filter(function (r) { return r.ok; }).length;
    var lines = results.map(function (r) {
      return (r.ok ? 'ĐẠT  ' : 'KHÔNG ĐẠT  ') + r.label + (r.detail ? ' – ' + r.detail : '');
    });
    var text = 'KẾT QUẢ smokeTest: ' + passed + '/' + results.length + ' ca đạt\n' + lines.join('\n');
    return { passed: passed, total: results.length, results: results, text: text };
  }

  return { run: run };
})();
