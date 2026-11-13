'use strict';

/**
 * Hàm trợ giúp kiểm thử API: gọi doPost như trình duyệt, tạo tài khoản, mã phiên, giả lập tokeninfo.
 * Email dưới đây là dữ liệu thử, không phải người thật.
 */
const { loadGas, rawObjects } = require('./helpers');

const CLIENT_ID = 'client-thu-nghiem.apps.googleusercontent.com';
const OWNER = 'chu.so.huu.thu@gmail.com';
const MANAGER = 'quan.ly.thu@gmail.com';
const VIEWER = 'chi.xem.thu@gmail.com';
const ADMIN2 = 'admin.hai.thu@gmail.com';

/** Hệ thống đã setup, có CLIENT_ID và 3 tài khoản: Admin thứ hai, Quản lý, Chỉ xem. */
function system(opts = {}) {
  const sys = loadGas({ email: OWNER, props: { CLIENT_ID }, now: '2026-11-13T08:00:00+07:00', ...opts });
  sys.gas.setup();
  addUser(sys.env, ADMIN2, 'Admin');
  addUser(sys.env, MANAGER, 'Quản lý');
  addUser(sys.env, VIEWER, 'Chỉ xem');
  return sys.env;
}

function addUser(env, email, role, status = 'Hoạt động', extra = {}) {
  const { gas } = env.newExecution();
  gas.Repo.withLock(() => {
    const t = gas.Repo.table('NguoiDung');
    t.append({ 'Email': email, 'Họ tên': 'Người thử', 'Vai trò': role, 'Trạng thái': status, 'Ngày tạo': new gas.Date(), ...extra });
    t.flush();
  });
}

/** Gọi API như trình duyệt (mỗi lần là một lần chạy mới). raw: gửi nguyên chuỗi body. */
function call(env, action, { session, requestId, data } = {}, raw) {
  const { gas } = env.newExecution();
  const body = raw !== undefined ? raw : JSON.stringify({ action, session, requestId, data });
  const out = gas.doPost({ postData: { contents: body } });
  return JSON.parse(out.getContent());
}

function sessionFor(env, email, issuedMs, hours = 12) {
  const { gas } = env.newExecution();
  return gas.Auth.issueSession(email, issuedMs === undefined ? env.clock.now() : issuedMs, hours);
}

let reqSeq = 0;
function rid() {
  reqSeq += 1;
  return `req-thu-${String(reqSeq).padStart(6, '0')}-${Math.random().toString(36).slice(2, 8)}`;
}

/** tokeninfo giả trả thông tin hợp lệ cho email, ghi đè được từng trường. */
function tokeninfo(env, email, overrides = {}, code = 200) {
  env.state.urlFetch.handler = (url) => {
    if (!url.startsWith('https://oauth2.googleapis.com/tokeninfo?id_token=')) throw new Error(`URL lạ: ${url}`);
    return {
      code,
      body: {
        aud: CLIENT_ID,
        iss: 'https://accounts.google.com',
        email,
        email_verified: 'true',
        exp: String(Math.floor(env.clock.now() / 1000) + 3600),
        ...overrides
      }
    };
  };
}

function logs(env) {
  return rawObjects(env, 'NhatKy');
}

module.exports = { CLIENT_ID, OWNER, MANAGER, VIEWER, ADMIN2, system, addUser, call, sessionFor, rid, tokeninfo, logs, rawObjects };
