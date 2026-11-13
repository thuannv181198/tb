/**
 * Cửa vào của web app: doPost (API), doGet (kiểm tra sống).
 * Bảng action trung tâm (Api.actions) quyết định: vai trò được gọi, có ghi dữ liệu không, hàm xử lý.
 * Trình tự xử lý theo docs/HOP-DONG-DU-LIEU.md mục 7.2.
 */
function doPost(e) {
  return Api.toOutput(Api.handle(e && e.postData ? e.postData.contents : ''));
}

function doGet() {
  return Api.toOutput({
    ok: true,
    data: { app: 'Quản lý thiết bị – KHOA CÔNG NGHỆ NĂNG LƯỢNG', version: Api.VERSION },
    serverTime: Util.iso(Util.now())
  });
}

var Api = (function () {
  var VERSION = '0.2.0';
  var PUBLIC = 'public';
  var REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
  var RESULT_MAX_CHARS = 45000;
  var RESULT_CACHE_SECONDS = 600;
  var BODY_MAX_CHARS = 30 * 1024 * 1024;

  var table = null;

  /**
   * Bảng action. roles: mảng vai trò hoặc PUBLIC. write: bắt buộc requestId, chạy trong khóa,
   * ghi NhatKy và KetQuaRequest. logOnly: không ghi dữ liệu nhưng có ghi NhatKy (đăng nhập, đăng xuất).
   * Tạo khi gọi lần đầu để không phụ thuộc thứ tự nạp file.
   */
  function actions() {
    if (table) return table;
    var A = Config.ROLE.ADMIN;
    var Q = Config.ROLE.MANAGER;
    var X = Config.ROLE.VIEWER;
    table = {
      'auth.login': { roles: PUBLIC, write: false, logOnly: true, handler: function (ctx) { return Auth.login(ctx); } },
      'auth.me': { roles: [A, Q, X], write: false, handler: function (ctx) { return Auth.me(ctx); } },
      'auth.logout': { roles: [A, Q, X], write: false, logOnly: true, handler: function (ctx) { return Auth.logout(ctx); } },
      'user.list': { roles: [A], write: false, handler: function () { return Auth.listUsers(); } },
      'user.save': { roles: [A], write: true, handler: function (ctx) { return Auth.saveUser(ctx); } },
      'user.revokeSessions': { roles: [A], write: true, handler: function (ctx) { return Auth.revokeSessions(ctx); } },
      'config.get': { roles: [A], write: false, handler: function () { return HeThong.getConfig(); } },
      'config.save': { roles: [A], write: true, handler: function (ctx) { return HeThong.saveConfig(ctx); } },
      'app.bootstrap': { roles: [A, Q, X], write: false, handler: function (ctx) { return HeThong.bootstrap(ctx); } }
    };
    return table;
  }

  // ---------- Xử lý một request ----------

  function handle(body) {
    var ctx = { action: '', data: {}, user: null, requestId: '', log: null };
    try {
      var req = parse(body);
      ctx.action = req.action;
      ctx.data = req.data;
      ctx.requestId = req.requestId;
      var def = actions()[req.action];
      if (!def) throw Util.err('UNKNOWN_ACTION', 'Chức năng không tồn tại.');

      if (def.roles !== PUBLIC) {
        ctx.user = Auth.authenticate(req.session);
        if (def.roles.indexOf(ctx.user.role) < 0) {
          throw Util.err('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
        }
      }

      var data;
      if (def.write) {
        if (!REQUEST_ID.test(req.requestId)) throw Util.err('BAD_REQUEST', 'Yêu cầu không hợp lệ (thiếu mã lần gửi). Hãy tải lại trang.');
        data = Repo.withLock(function () { return runWrite(def, ctx); });
      } else {
        data = def.handler(ctx);
        if (def.logOnly) {
          var entry = logEntry(ctx, 'Thành công', ctx.log);
          Repo.withLock(function () { Repo.append('NhatKy', [entry]); });
        }
      }
      return { ok: true, data: data, serverTime: Util.iso(Util.now()) };
    } catch (e) {
      return failure(e, ctx);
    }
  }

  /** Phần ghi trong vùng khóa: gặp lại requestId thì trả kết quả cũ, không ghi lần hai. */
  function runWrite(def, ctx) {
    var prev = findResult(ctx.requestId);
    if (prev) {
      if (prev.action !== ctx.action) throw Util.err('BAD_REQUEST', 'Mã lần gửi đã dùng cho thao tác khác. Hãy tải lại trang.');
      return prev.result;
    }
    var result = def.handler(ctx);
    Repo.append('NhatKy', [logEntry(ctx, 'Thành công', ctx.log)]);
    saveResult(ctx, result);
    return result;
  }

  function parse(body) {
    if (!body || body.length > BODY_MAX_CHARS) throw Util.err('BAD_REQUEST', 'Yêu cầu không hợp lệ. Hãy tải lại trang.');
    var req;
    try {
      req = JSON.parse(body);
    } catch (e) {
      throw Util.err('BAD_REQUEST', 'Yêu cầu không hợp lệ. Hãy tải lại trang.');
    }
    if (!req || typeof req !== 'object' || typeof req.action !== 'string' || !req.action) {
      throw Util.err('BAD_REQUEST', 'Yêu cầu không hợp lệ. Hãy tải lại trang.');
    }
    var data = req.data && typeof req.data === 'object' && !Array.isArray(req.data) ? req.data : {};
    return { action: req.action, session: Util.str(req.session), requestId: Util.str(req.requestId), data: data };
  }

  // ---------- KetQuaRequest ----------

  function resultCacheKey(requestId) {
    return 'req:' + requestId;
  }

  /** Kết quả đã lưu của requestId: bộ đệm trước, rồi sheet KetQuaRequest. Không có thì null. */
  function findResult(requestId) {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(resultCacheKey(requestId));
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { cache.remove(resultCacheKey(requestId)); }
    }
    var sheet = Repo.getSheet('KetQuaRequest');
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(Util.str);
    var idCol = headers.indexOf('requestId');
    var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (var r = ids.length - 1; r >= 0; r--) {
      if (Util.str(ids[r][0]) === requestId) {
        var row = sheet.getRange(r + 2, 1, 1, headers.length).getValues()[0];
        var raw = Util.str(row[headers.indexOf('Kết quả')]);
        var result;
        try { result = JSON.parse(raw); } catch (e) { result = {}; }
        return { action: Util.str(row[headers.indexOf('Action')]), result: result };
      }
    }
    return null;
  }

  function saveResult(ctx, result) {
    var json = JSON.stringify(result === undefined ? null : result);
    if (json.length > RESULT_MAX_CHARS) {
      json = JSON.stringify({ tomTat: true, ma: (result && (result.ma || result.maPhieu || result.maYC)) || '' });
    }
    Repo.append('KetQuaRequest', [{
      'requestId': ctx.requestId,
      'Thời gian': Util.now(),
      'Action': ctx.action,
      'Email': ctx.user ? ctx.user.email : 'công khai',
      'Kết quả': json
    }]);
    try {
      CacheService.getScriptCache().put(resultCacheKey(ctx.requestId),
        JSON.stringify({ action: ctx.action, result: JSON.parse(json) }), RESULT_CACHE_SECONDS);
    } catch (e) {
      // Bộ đệm chỉ để tra nhanh; sheet KetQuaRequest là nơi lưu chính
    }
  }

  // ---------- Nhật ký và lỗi ----------

  function logEntry(ctx, result, info) {
    var email = ctx.user && ctx.user.email ? ctx.user.email : (info && info.email) || 'công khai';
    return {
      'Thời gian': Util.now(),
      'Email': email,
      'Action': ctx.action || '(không rõ)',
      'Đối tượng': info && info.target ? Util.str(info.target).slice(0, 500) : '',
      'Kết quả': result,
      'Chi tiết': info && info.detail ? Util.str(info.detail).slice(0, 1000) : ''
    };
  }

  /** Ghi một dòng NhatKy ngoài luồng chính; lỗi khi ghi nhật ký không làm hỏng phản hồi. */
  function tryLog(ctx, result, info) {
    try {
      var entry = logEntry(ctx, result, info);
      Repo.withLock(function () { Repo.append('NhatKy', [entry]); }, 3000);
    } catch (e) {
      // Không lấy được khóa hoặc thiếu sheet: bỏ qua dòng nhật ký này
    }
  }

  var DENIED_CODES = ['FORBIDDEN', 'ACCOUNT_NOT_ALLOWED', 'LOGIN_FAILED', 'QR_MANAGER_ONLY'];

  function failure(e, ctx) {
    var code = e && e.isAppError ? e.code : 'SERVER_ERROR';
    var message = e && e.isAppError ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.';
    // Chỉ ghi "Từ chối" khi đã biết email (người đã đăng nhập, hoặc email lấy từ ID token Google đã ký):
    // request ẩn danh gửi rác không được làm đầy NhatKy (HOP-DONG 7.2, đặc tả mục 3)
    var deniedEmail = (ctx.user && ctx.user.email) || (e && e.email) || '';
    if (DENIED_CODES.indexOf(code) >= 0 && deniedEmail) {
      tryLog(ctx, 'Từ chối', { email: deniedEmail, target: deniedEmail, detail: code + (e.logDetail ? ': ' + e.logDetail : '') });
    } else if (code === 'SERVER_ERROR') {
      tryLog(ctx, 'Lỗi', { email: e && e.email, detail: Util.str(e && e.message) });
    }
    var error = { code: code, message: message };
    if (e && e.isAppError && e.details !== undefined) error.details = e.details;
    return { ok: false, error: error, serverTime: Util.iso(Util.now()) };
  }

  function toOutput(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  }

  return {
    VERSION: VERSION,
    PUBLIC: PUBLIC,
    actions: actions,
    handle: handle,
    toOutput: toOutput
  };
})();
