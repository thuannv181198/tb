/**
 * Đăng nhập và phân quyền (đặc tả mục 3):
 * - xác minh ID token của Google Identity Services bằng endpoint tokeninfo (QUYET-DINH Q9);
 * - mã phiên ký HMAC-SHA256 bằng SESSION_SECRET, hạn PHIEN_GIO giờ;
 * - đối chiếu NguoiDung, lưu đệm 5 phút, xóa đệm ngay khi Admin sửa tài khoản;
 * - quản lý tài khoản (Admin).
 */
var Auth = (function () {
  var TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';
  var ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
  var USER_CACHE_SECONDS = 300;
  var HOUR_MS = 60 * 60 * 1000;

  // ---------- Mã phiên ----------

  function b64url(value) {
    return Utilities.base64EncodeWebSafe(value).replace(/=+$/, '');
  }

  function b64urlDecodeToString(s) {
    var padded = s + '===='.slice(0, (4 - (s.length % 4)) % 4);
    return Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString();
  }

  function secret() {
    var s = Repo.props()[Config.PROP.SESSION_SECRET];
    if (!s) throw Util.err('CONFIG_MISSING', 'Hệ thống chưa cấu hình xong (thiếu SESSION_SECRET). Báo Admin chạy setup().');
    return s;
  }

  function sign(payload) {
    return b64url(Utilities.computeHmacSha256Signature(payload, secret()));
  }

  /** So sánh chuỗi không dừng sớm, tránh đoán chữ ký theo thời gian phản hồi. */
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /** Mã phiên = base64url(JSON {e, i, x}) + "." + chữ ký. i, x: mốc ms cấp và hết hạn. */
  function issueSession(email, issuedMs, hours) {
    var payload = b64url(JSON.stringify({ e: email, i: issuedMs, x: issuedMs + hours * HOUR_MS }));
    return payload + '.' + sign(payload);
  }

  /** Giải mã và kiểm tra chữ ký. Sai dạng hoặc sai chữ ký thì SESSION_INVALID. */
  function decodeSession(token) {
    var parts = Util.str(token).split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) throw invalidSession();
    if (!safeEqual(sign(parts[0]), parts[1])) throw invalidSession();
    var data;
    try {
      data = JSON.parse(b64urlDecodeToString(parts[0]));
    } catch (e) {
      throw invalidSession();
    }
    if (!data || typeof data.e !== 'string' || typeof data.i !== 'number' || typeof data.x !== 'number') throw invalidSession();
    return { email: data.e, issuedMs: data.i, expiresMs: data.x };
  }

  function invalidSession() {
    return Util.err('SESSION_INVALID', 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.');
  }

  // ---------- Tài khoản ----------

  function ownerEmail() {
    return Util.normEmail(Repo.props()[Config.PROP.ADMIN_EMAIL]);
  }

  function userCacheKey(email) {
    return 'nd:' + Util.normEmail(email);
  }

  function clearUserCache(email) {
    CacheService.getScriptCache().remove(userCacheKey(email));
  }

  /** Bản ghi NguoiDung của email (đã chuẩn hóa), có lưu đệm. Không có thì { exists: false }. */
  function loadUserRecord(email) {
    var key = userCacheKey(email);
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { cache.remove(key); }
    }
    var t = Repo.table('NguoiDung');
    var i = t.find('Email', email, Util.normEmail);
    var rec = { email: Util.normEmail(email), exists: i >= 0 };
    if (i >= 0) {
      var expires = t.get(i, 'Ngày hết hạn');
      var validFrom = t.get(i, 'Phiên hợp lệ từ');
      rec.name = t.get(i, 'Họ tên');
      rec.role = t.get(i, 'Vai trò');
      rec.status = t.get(i, 'Trạng thái');
      rec.expiresOn = expires ? expires.getTime() : null;
      rec.validFrom = validFrom ? validFrom.getTime() : null;
    }
    try { cache.put(key, JSON.stringify(rec), USER_CACHE_SECONDS); } catch (e) { /* bộ đệm lỗi thì bỏ qua */ }
    return rec;
  }

  /**
   * Quyền hiện tại của email. Chủ sở hữu luôn là Admin đang hoạt động.
   * Trả { allowed, reason, email, name, role, isOwner, validFrom }.
   */
  function resolveUser(email) {
    var e = Util.normEmail(email);
    var rec = loadUserRecord(e);
    var isOwner = e === ownerEmail() && !!e;
    var user = { email: e, name: rec.name || '', role: rec.role || '', isOwner: isOwner, validFrom: rec.validFrom || null };
    if (isOwner) {
      user.role = Config.ROLE.ADMIN;
      user.allowed = true;
      return user;
    }
    if (!rec.exists) return deny(user, 'không có trong danh sách');
    if (rec.status !== Config.USER_STATUS.ACTIVE) return deny(user, 'tài khoản bị khóa');
    if (rec.expiresOn && Util.now().getTime() > Util.endOfDay(new Date(rec.expiresOn)).getTime()) return deny(user, 'quyền đã hết hạn');
    var roles = [Config.ROLE.ADMIN, Config.ROLE.MANAGER, Config.ROLE.VIEWER];
    if (roles.indexOf(rec.role) < 0) return deny(user, 'vai trò không hợp lệ');
    user.allowed = true;
    return user;
  }

  function deny(user, reason) {
    user.allowed = false;
    user.reason = reason;
    return user;
  }

  /** Email có thuộc tên miền được phép đăng nhập không (mục 3 bước 2). hd: claim của token. */
  function emailDomainAllowed(email, hd, checkHd) {
    var e = Util.normEmail(email);
    if (/@gmail\.com$/.test(e)) return true;
    var domain = Util.str(Repo.config().TEN_MIEN_WORKSPACE).trim().toLowerCase();
    if (!domain) return false;
    if (e.slice(-(domain.length + 1)) !== '@' + domain) return false;
    return !checkHd || Util.str(hd).toLowerCase() === domain;
  }

  // ---------- Kiểm tra phiên mỗi request ----------

  /**
   * Kiểm tra mã phiên và quyền hiện tại. Trả user {email, name, role, isOwner, expiresMs}.
   * Lỗi: AUTH_REQUIRED, SESSION_INVALID, SESSION_EXPIRED, ACCOUNT_NOT_ALLOWED.
   */
  function authenticate(token) {
    if (!token) throw Util.err('AUTH_REQUIRED', 'Vui lòng đăng nhập.');
    var s = decodeSession(token);
    if (Util.now().getTime() > s.expiresMs) {
      throw Util.err('SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    var user = resolveUser(s.email);
    if (!user.allowed) {
      var e = Util.err('ACCOUNT_NOT_ALLOWED', 'Tài khoản chưa được cấp quyền.');
      e.email = user.email;
      e.logDetail = user.reason;
      throw e;
    }
    if (user.validFrom && s.issuedMs < user.validFrom) {
      throw Util.err('SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    return { email: user.email, name: user.name, role: user.role, isOwner: user.isOwner, expiresMs: s.expiresMs };
  }

  function publicUser(u) {
    return { email: u.email, name: u.name || '', role: u.role, isOwner: !!u.isOwner };
  }

  // ---------- Action: auth.* ----------

  function loginFailed(detail, email) {
    var e = Util.err('LOGIN_FAILED', 'Chưa đăng nhập được, vui lòng thử lại.');
    e.logDetail = detail;
    e.email = email || '';
    return e;
  }

  /** auth.login: { idToken } → { session, expiresAt, user }. */
  function login(ctx) {
    var idToken = Util.str(ctx.data.idToken);
    if (!idToken || idToken.length > 5000) throw loginFailed('thiếu ID token');
    var clientId = Repo.props()[Config.PROP.CLIENT_ID];
    if (!clientId) throw Util.err('CONFIG_MISSING', 'Hệ thống chưa cấu hình đăng nhập (thiếu CLIENT_ID). Báo Admin.');

    var info;
    try {
      var res = UrlFetchApp.fetch(TOKENINFO_URL + encodeURIComponent(idToken), { muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) throw new Error('tokeninfo HTTP ' + res.getResponseCode());
      info = JSON.parse(res.getContentText());
    } catch (err) {
      throw loginFailed('không xác minh được ID token: ' + err.message);
    }

    var email = Util.normEmail(info.email);
    if (info.aud !== clientId) throw loginFailed('aud không khớp CLIENT_ID', email);
    if (ISSUERS.indexOf(info.iss) < 0) throw loginFailed('iss không hợp lệ', email);
    if (!(info.email_verified === true || info.email_verified === 'true')) throw loginFailed('email chưa xác minh', email);
    var exp = Number(info.exp);
    if (!exp || exp * 1000 <= Util.now().getTime()) throw loginFailed('ID token đã hết hạn', email);
    if (!email || !emailDomainAllowed(email, info.hd, true)) throw loginFailed('email ngoài tên miền cho phép', email);

    var user = resolveUser(email);
    if (!user.allowed) {
      var denied = Util.err('ACCOUNT_NOT_ALLOWED', 'Tài khoản chưa được cấp quyền.');
      denied.email = email;
      denied.logDetail = user.reason;
      throw denied;
    }
    var hours = Repo.configInt('PHIEN_GIO', 12);
    var now = Util.now().getTime();
    var session = issueSession(email, now, hours);
    ctx.user = { email: email, role: user.role };
    ctx.log = { target: email, detail: 'Đăng nhập, vai trò ' + user.role };
    return { session: session, expiresAt: Util.iso(new Date(now + hours * HOUR_MS)), user: publicUser(user) };
  }

  /** auth.me → { user, expiresAt }. */
  function me(ctx) {
    return { user: publicUser(ctx.user), expiresAt: Util.iso(new Date(ctx.user.expiresMs)) };
  }

  /** auth.logout: mã phiên không lưu ở server; chỉ ghi nhật ký. */
  function logout(ctx) {
    ctx.log = { target: ctx.user.email, detail: 'Đăng xuất' };
    return {};
  }

  // ---------- Action: user.* (Admin) ----------

  function userRow(t, i) {
    var email = Util.normEmail(t.get(i, 'Email'));
    return {
      email: email,
      name: t.get(i, 'Họ tên'),
      role: t.get(i, 'Vai trò'),
      phone: t.get(i, 'SĐT'),
      status: t.get(i, 'Trạng thái'),
      expiresOn: t.get(i, 'Ngày hết hạn') ? Util.formatDate(t.get(i, 'Ngày hết hạn'), 'yyyy-MM-dd') : '',
      validFrom: Util.iso(t.get(i, 'Phiên hợp lệ từ')),
      createdAt: Util.iso(t.get(i, 'Ngày tạo')),
      isOwner: email === ownerEmail()
    };
  }

  /** user.list → { users }. */
  function listUsers() {
    var t = Repo.table('NguoiDung');
    var users = [];
    for (var i = 0; i < t.size(); i++) {
      if (Util.str(t.get(i, 'Email')).trim()) users.push(userRow(t, i));
    }
    return { users: users };
  }

  /** user.save: tạo hoặc sửa tài khoản. Chủ sở hữu không bị khóa, không bị hạ quyền. */
  function saveUser(ctx) {
    var d = ctx.data || {};
    var email = Util.normEmail(d.email);
    var fields = [];
    if (!Util.isEmail(email)) fields.push('email');
    else if (!emailDomainAllowed(email, '', false)) {
      throw Util.err('VALIDATION', 'Chỉ cấp quyền cho Gmail (@gmail.com) hoặc email thuộc tên miền khai báo trong Cấu hình.', { fields: ['email'] });
    }
    var roles = [Config.ROLE.ADMIN, Config.ROLE.MANAGER, Config.ROLE.VIEWER];
    var role = Util.str(d.role);
    if (roles.indexOf(role) < 0) fields.push('role');
    var status = Util.str(d.status || Config.USER_STATUS.ACTIVE);
    if ([Config.USER_STATUS.ACTIVE, Config.USER_STATUS.LOCKED].indexOf(status) < 0) fields.push('status');
    var phone = '';
    if (Util.str(d.phone).trim()) {
      phone = Util.cleanPhone(d.phone);
      if (!phone) fields.push('phone');
    }
    var expiresOn = null;
    if (Util.str(d.expiresOn).trim()) {
      expiresOn = Util.parseDate(d.expiresOn);
      if (!expiresOn) fields.push('expiresOn');
    }
    if (fields.length) throw Util.err('VALIDATION', 'Thông tin tài khoản chưa hợp lệ.', { fields: fields });
    var name = Util.cleanText(d.name, 100, 'Họ tên');

    if (email === ownerEmail() && (role !== Config.ROLE.ADMIN || status !== Config.USER_STATUS.ACTIVE || expiresOn)) {
      throw Util.err('VALIDATION', 'Tài khoản chủ sở hữu luôn là Admin đang hoạt động, không đặt hạn.', { fields: ['role', 'status', 'expiresOn'] });
    }

    var t = Repo.table('NguoiDung');
    var i = t.find('Email', email, Util.normEmail);
    var created = i < 0;
    if (created) {
      i = t.append({ 'Email': email, 'Ngày tạo': Util.now() });
    }
    t.set(i, 'Họ tên', name);
    t.set(i, 'Vai trò', role);
    t.set(i, 'SĐT', phone);
    t.set(i, 'Trạng thái', status);
    t.set(i, 'Ngày hết hạn', expiresOn ? Util.startOfDay(expiresOn) : '');
    t.flush();
    clearUserCache(email);
    ctx.log = { target: email, detail: (created ? 'Thêm' : 'Sửa') + ' tài khoản: ' + role + ', ' + status };
    return { user: userRow(t, i) };
  }

  /** user.revokeSessions: mọi mã phiên cấp trước thời điểm này của email mất hiệu lực. */
  function revokeSessions(ctx) {
    var email = Util.normEmail(ctx.data && ctx.data.email);
    var t = Repo.table('NguoiDung');
    var i = t.find('Email', email, Util.normEmail);
    if (i < 0) throw Util.err('NOT_FOUND', 'Không tìm thấy tài khoản.');
    var now = Util.now();
    t.set(i, 'Phiên hợp lệ từ', now);
    t.flush();
    clearUserCache(email);
    ctx.log = { target: email, detail: 'Đăng xuất mọi thiết bị' };
    return { validFrom: Util.iso(now) };
  }

  return {
    issueSession: issueSession,
    decodeSession: decodeSession,
    authenticate: authenticate,
    resolveUser: resolveUser,
    clearUserCache: clearUserCache,
    emailDomainAllowed: emailDomainAllowed,
    login: login,
    me: me,
    logout: logout,
    listUsers: listUsers,
    saveUser: saveUser,
    revokeSessions: revokeSessions
  };
})();
