/**
 * Hàm thuần dùng chung: chuẩn hóa chuỗi, tạo mã nhóm, làm sạch đầu vào, thời gian, định dạng mã.
 * Không đọc, ghi Sheet. Chỉ dùng Utilities.formatDate và Utilities.getUuid của Google.
 */
var Util = (function () {
  var TZ = 'Asia/Ho_Chi_Minh';
  // Việt Nam dùng UTC+7 cố định, không có giờ mùa hè
  var VN_OFFSET_HOURS = 7;
  var DAY_MS = 24 * 60 * 60 * 1000;

  /** Tạo lỗi nghiệp vụ có mã lỗi cố định (xem hợp đồng dữ liệu, mục mã lỗi). */
  function err(code, message, details) {
    var e = new Error(message);
    e.code = code;
    e.isAppError = true;
    if (details !== undefined) e.details = details;
    return e;
  }

  function isDate(v) {
    return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
  }

  function str(v) {
    return v === null || v === undefined ? '' : String(v);
  }

  // ---------- Chuỗi ----------

  function nfc(v) {
    return str(v).normalize('NFC');
  }

  /** NFC, gộp khoảng trắng, bỏ khoảng trắng hai đầu. */
  function collapseSpaces(v) {
    return nfc(v).replace(/\s+/g, ' ').trim();
  }

  /** Chuẩn hóa tên thiết bị (mục 5 bước 1): NFC, bỏ khoảng trắng thừa, chữ thường. */
  function normalizeName(v) {
    return collapseSpaces(v).toLowerCase();
  }

  /** Bỏ dấu tiếng Việt; Đ/đ → D/d. */
  function removeDiacritics(v) {
    return nfc(v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  /** Các từ của tên sau khi bỏ dấu, viết hoa, chỉ giữ A–Z và 0–9. Từ rỗng bị bỏ. */
  function nameWords(name) {
    return removeDiacritics(normalizeName(name)).toUpperCase().split(' ')
      .map(function (w) { return w.replace(/[^A-Z0-9]/g, ''); })
      .filter(function (w) { return w.length > 0; });
  }

  /**
   * Mã nhóm từ tên (mục 5 bước 3): chữ cái (hoặc chữ số) đầu của mỗi từ, tối đa 6 ký tự.
   * Trả { code, full, tooShort, truncated }; code rỗng khi ngắn hơn 2 ký tự (Admin tự đặt).
   */
  function groupCodeFromName(name) {
    var full = nameWords(name).map(function (w) { return w.charAt(0); }).join('');
    var code = full.slice(0, 6);
    var tooShort = code.length < 2;
    return { code: tooShort ? '' : code, full: full, tooShort: tooShort, truncated: full.length > 6 };
  }

  /** Mã nhóm hợp lệ khi Admin tự đặt: 2–6 ký tự A–Z, 0–9. */
  function isValidGroupCode(code) {
    return /^[A-Z0-9]{2,6}$/.test(str(code));
  }

  /**
   * Gợi ý mã nhóm thay thế khi trùng (mục 5 bước 4): thêm lần lượt chữ cái tiếp theo của từ cuối
   * (Mỏ cặp: MC → MCA). Không gợi ý được (vượt 6 ký tự hoặc hết chữ) thì trả chuỗi rỗng.
   * takenCodes: mảng mã nhóm đã có.
   */
  function suggestGroupCode(name, takenCodes) {
    var base = groupCodeFromName(name).code;
    if (!base) return '';
    var taken = {};
    (takenCodes || []).forEach(function (c) { taken[str(c).toUpperCase()] = true; });
    if (!taken[base]) return base;
    var words = nameWords(name);
    var last = words[words.length - 1] || '';
    for (var k = 1; k < last.length; k++) {
      var candidate = base + last.slice(1, 1 + k);
      if (candidate.length > 6) break;
      if (!taken[candidate]) return candidate;
    }
    return '';
  }

  // ---------- Làm sạch đầu vào ----------

  /**
   * Làm sạch chuỗi người dùng nhập: NFC, bỏ ký tự điều khiển (giữ xuống dòng, tab), bỏ khoảng trắng
   * hai đầu. maxLen > 0: quá dài thì báo lỗi VALIDATION với tên trường label.
   */
  function cleanText(v, maxLen, label) {
    var s = nfc(v)
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    if (maxLen && s.length > maxLen) {
      throw err('VALIDATION', (label || 'Nội dung') + ' dài quá ' + maxLen + ' ký tự.');
    }
    return s;
  }

  /** Chuẩn hóa mã (Mã TB, mã nhóm, mã phiếu...): bỏ mọi khoảng trắng, viết hoa. */
  function normCode(v) {
    return nfc(v).replace(/\s+/g, '').toUpperCase();
  }

  /** So sánh serie (mục 5): bỏ khoảng trắng, không phân biệt chữ hoa, thường. */
  function normSerial(v) {
    return nfc(v).replace(/\s+/g, '').toUpperCase();
  }

  function normEmail(v) {
    return nfc(v).trim().toLowerCase();
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(v));
  }

  /**
   * SĐT Việt Nam 10 chữ số. Bỏ khoảng trắng, dấu chấm, gạch; +84/84 đầu đổi thành 0.
   * Sai định dạng trả chuỗi rỗng. Luôn trả chuỗi để giữ số 0 đầu.
   */
  function cleanPhone(v) {
    var s = nfc(v).replace(/[\s.\-()]/g, '');
    if (/^\+84\d{9}$/.test(s)) s = '0' + s.slice(3);
    else if (/^84\d{9}$/.test(s)) s = '0' + s.slice(2);
    return /^0\d{9}$/.test(s) ? s : '';
  }

  /**
   * Chuỗi ghi vào ô Sheet: thêm dấu nháy đơn khi bắt đầu bằng = + - @ hoặc ' để Sheet giữ
   * nguyên văn bản (không thành công thức, không mất dấu nháy của người dùng).
   */
  function toSheetText(v) {
    var s = str(v);
    return /^[=+\-@']/.test(s) ? "'" + s : s;
  }

  // ---------- Thời gian (múi giờ Asia/Ho_Chi_Minh) ----------

  function now() {
    return new Date();
  }

  function formatDate(d, pattern) {
    return Utilities.formatDate(d, TZ, pattern);
  }

  /** ISO 8601 kèm múi giờ, ví dụ 2026-11-10T08:30:00+07:00. Không phải ngày thì trả ''. */
  function iso(d) {
    return isDate(d) ? formatDate(d, "yyyy-MM-dd'T'HH:mm:ssXXX") : '';
  }

  function ymd(d) {
    return formatDate(d, 'yyyyMMdd');
  }

  function year(d) {
    return formatDate(d, 'yyyy');
  }

  /** Thời điểm theo giờ Việt Nam. Tháng tính từ 1. */
  function vnDate(y, m, d, hh, mi, ss) {
    return new Date(Date.UTC(y, m - 1, d, (hh || 0) - VN_OFFSET_HOURS, mi || 0, ss || 0));
  }

  function vnParts(d) {
    var p = formatDate(d, 'yyyy-MM-dd').split('-');
    return { y: Number(p[0]), m: Number(p[1]), d: Number(p[2]) };
  }

  function startOfDay(d) {
    var p = vnParts(d);
    return vnDate(p.y, p.m, p.d, 0, 0, 0);
  }

  /** 23:59:59 của ngày đó theo giờ Việt Nam (hạn trả chỉ có ngày). */
  function endOfDay(d) {
    var p = vnParts(d);
    return vnDate(p.y, p.m, p.d, 23, 59, 59);
  }

  function addDays(d, n) {
    return new Date(d.getTime() + n * DAY_MS);
  }

  function validYmd(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || y < 2000 || y > 2100) return false;
    var probe = new Date(Date.UTC(y, m - 1, d));
    return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
  }

  /**
   * Đọc ngày do người dùng hoặc trình duyệt gửi. Nhận: Date; yyyy-MM-dd; dd/MM/yyyy;
   * ISO 8601 có múi giờ. Ngày không kèm giờ hiểu là 00:00 giờ Việt Nam.
   * Không dùng new Date(chuỗi dd/MM/yyyy). Sai thì trả null.
   */
  function parseDate(v) {
    if (isDate(v)) return new Date(v.getTime());
    var s = str(v).trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return validYmd(+m[1], +m[2], +m[3]) ? vnDate(+m[1], +m[2], +m[3]) : null;
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (m) return validYmd(+m[3], +m[2], +m[1]) ? vnDate(+m[3], +m[2], +m[1]) : null;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(s)) {
      var d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  /** Hạn trả từ một ngày: 23:59:59 ngày đó. Sai định dạng trả null. */
  function dueDate(v) {
    var d = parseDate(v);
    return d ? endOfDay(d) : null;
  }

  // ---------- Mã ----------

  function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = '0' + s;
    return s;
  }

  /** Kỳ của bộ đếm theo loại mã: yyyyMMdd, yyyy hoặc '' (mục 5, sheet BoDem). */
  function periodKey(period, d) {
    if (period === 'day') return ymd(d);
    if (period === 'year') return year(d);
    return '';
  }

  /** Mã có số thứ tự: YC-20261105-001, BO-001, DN-2026-01; vượt số chữ số thì dài thêm. */
  function formatSeqCode(typeDef, period, n) {
    var parts = [typeDef.prefix];
    if (period) parts.push(period);
    parts.push(pad(n, typeDef.digits));
    return parts.join('-');
  }

  /** Mã TB = Mã nhóm + "-" + số thứ tự tối thiểu 3 chữ số (MKCT-001, ..., MKCT-1000). */
  function deviceCode(groupCode, n) {
    return groupCode + '-' + pad(n, 3);
  }

  /** Số thứ tự trong Mã TB; không đúng dạng thì trả 0. */
  function deviceNumber(code) {
    var m = /-(\d+)$/.exec(str(code));
    return m ? Number(m[1]) : 0;
  }

  /** Chuỗi ngẫu nhiên từ bảng chữ của mã xác nhận (không có O, 0, I, 1). */
  function randomCode(length) {
    var alphabet = Config.CONFIRM_ALPHABET;
    var out = '';
    while (out.length < length) {
      var hex = Utilities.getUuid().replace(/-/g, '');
      for (var i = 0; i + 1 < hex.length && out.length < length; i += 2) {
        // 256 chia hết cho 32 nên không lệch phân bố
        out += alphabet.charAt(parseInt(hex.substr(i, 2), 16) % alphabet.length);
      }
    }
    return out;
  }

  // ---------- Số ----------

  function toInt(v, fallback) {
    var n = parseInt(str(v), 10);
    return isNaN(n) ? fallback : n;
  }

  return {
    TZ: TZ,
    err: err,
    isDate: isDate,
    str: str,
    nfc: nfc,
    collapseSpaces: collapseSpaces,
    normalizeName: normalizeName,
    removeDiacritics: removeDiacritics,
    nameWords: nameWords,
    groupCodeFromName: groupCodeFromName,
    isValidGroupCode: isValidGroupCode,
    suggestGroupCode: suggestGroupCode,
    cleanText: cleanText,
    normCode: normCode,
    normSerial: normSerial,
    normEmail: normEmail,
    isEmail: isEmail,
    cleanPhone: cleanPhone,
    toSheetText: toSheetText,
    now: now,
    formatDate: formatDate,
    iso: iso,
    ymd: ymd,
    year: year,
    vnDate: vnDate,
    startOfDay: startOfDay,
    endOfDay: endOfDay,
    addDays: addDays,
    parseDate: parseDate,
    dueDate: dueDate,
    pad: pad,
    periodKey: periodKey,
    formatSeqCode: formatSeqCode,
    deviceCode: deviceCode,
    deviceNumber: deviceNumber,
    randomCode: randomCode,
    toInt: toInt
  };
})();
