'use strict';

/** Đăng nhập, mã phiên, đối chiếu NguoiDung (đặc tả mục 3; Kiểm thử bắt buộc M1). */
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./api-helpers');

const HOUR = 3600 * 1000;

test('Đăng nhập hợp lệ cấp mã phiên 12 giờ và ghi NhatKy', () => {
  const env = h.system();
  h.tokeninfo(env, h.MANAGER);
  const res = h.call(env, 'auth.login', { data: { idToken: 'token-thu' } });
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.data.user.email, h.MANAGER);
  assert.equal(res.data.user.role, 'Quản lý');
  assert.equal(res.data.expiresAt, '2026-11-13T20:00:00+07:00');
  const me = h.call(env, 'auth.me', { session: res.data.session });
  assert.equal(me.ok, true);
  assert.equal(me.data.user.email, h.MANAGER);
  const log = h.logs(env).at(-1);
  assert.equal(log.Action, 'auth.login');
  assert.equal(log['Kết quả'], 'Thành công');
  assert.equal(log.Email, h.MANAGER);
});

test('ID token sai aud, sai iss, email chưa xác minh, hết hạn, ngoài tên miền thì bị từ chối', () => {
  const env = h.system();
  const cases = [
    [{ aud: 'client-khac.apps.googleusercontent.com' }, 'aud'],
    [{ iss: 'https://gia-mao.example.com' }, 'iss'],
    [{ email_verified: 'false' }, 'chưa xác minh'],
    [{ exp: String(Math.floor(env.clock.now() / 1000) - 1) }, 'hết hạn'],
    [{ email: 'nguoi.ngoai@example.com' }, 'tên miền']
  ];
  for (const [override, detail] of cases) {
    h.tokeninfo(env, h.MANAGER, override);
    const res = h.call(env, 'auth.login', { data: { idToken: 'token-thu' } });
    assert.equal(res.ok, false, detail);
    assert.equal(res.error.code, 'LOGIN_FAILED', detail);
    assert.equal(res.error.message, 'Chưa đăng nhập được, vui lòng thử lại.');
    const log = h.logs(env).at(-1);
    assert.equal(log['Kết quả'], 'Từ chối');
    assert.match(log['Chi tiết'], new RegExp(detail));
  }
});

test('tokeninfo lỗi hoặc thiếu CLIENT_ID thì báo lỗi rõ, phiên đã cấp vẫn dùng được', () => {
  const env = h.system();
  const session = h.sessionFor(env, h.MANAGER);
  h.tokeninfo(env, h.MANAGER, {}, 500);
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).error.code, 'LOGIN_FAILED');
  env.state.urlFetch.handler = () => { throw new Error('mất mạng'); };
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).error.code, 'LOGIN_FAILED');
  assert.equal(h.call(env, 'auth.me', { session }).ok, true);
  delete env.props.CLIENT_ID;
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).error.code, 'CONFIG_MISSING');
  assert.equal(h.call(env, 'auth.login', { data: {} }).error.code, 'LOGIN_FAILED');
});

test('Request ẩn danh gửi rác vào auth.login không làm đầy NhatKy và không gọi tokeninfo khi thiếu token', () => {
  const env = h.system();
  const before = h.logs(env).length;
  env.resetCounters();
  assert.equal(h.call(env, 'auth.login', { data: {} }).error.code, 'LOGIN_FAILED');
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x'.repeat(6000) } }).error.code, 'LOGIN_FAILED');
  assert.equal(env.state.counters.urlFetch, 0, 'không tốn UrlFetch');
  h.tokeninfo(env, h.MANAGER, {}, 400);
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'token-rac' } }).error.code, 'LOGIN_FAILED');
  assert.equal(h.logs(env).length, before, 'không có dòng NhatKy cho request chưa biết email');
});

test('Tên miền Workspace khai báo trong CauHinh: cần hd đúng tên miền', () => {
  const env = h.system();
  const staff = 'can.bo.thu@truong-thu.edu.vn';
  const admin = h.sessionFor(env, h.OWNER);
  assert.equal(h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: staff, role: 'Quản lý' } }).error.code, 'VALIDATION',
    'chưa khai báo tên miền thì không cấp quyền được');
  assert.equal(h.call(env, 'config.save', { session: admin, requestId: h.rid(), data: { values: { TEN_MIEN_WORKSPACE: 'truong-thu.edu.vn' } } }).ok, true);
  assert.equal(h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: staff, role: 'Quản lý' } }).ok, true);
  h.tokeninfo(env, staff, { hd: 'truong-thu.edu.vn' });
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).ok, true);
  h.tokeninfo(env, staff);
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).error.code, 'LOGIN_FAILED', 'thiếu hd');
});

test('Email không có trong danh sách, bị khóa hoặc hết hạn quyền bị từ chối khi đăng nhập và khi dùng phiên', () => {
  const env = h.system();
  h.addUser(env, 'bi.khoa.thu@gmail.com', 'Quản lý', 'Khóa');
  h.addUser(env, 'het.han.thu@gmail.com', 'Quản lý', 'Hoạt động', { 'Ngày hết hạn': new Date('2026-11-12T00:00:00+07:00') });
  h.addUser(env, 'con.han.thu@gmail.com', 'Quản lý', 'Hoạt động', { 'Ngày hết hạn': new Date('2026-11-13T00:00:00+07:00') });
  for (const email of ['la.thu@gmail.com', 'bi.khoa.thu@gmail.com', 'het.han.thu@gmail.com']) {
    h.tokeninfo(env, email);
    const res = h.call(env, 'auth.login', { data: { idToken: 'x' } });
    assert.equal(res.error.code, 'ACCOUNT_NOT_ALLOWED', email);
    assert.equal(h.call(env, 'auth.me', { session: h.sessionFor(env, email) }).error.code, 'ACCOUNT_NOT_ALLOWED', email);
    assert.equal(h.logs(env).at(-1)['Kết quả'], 'Từ chối');
  }
  h.tokeninfo(env, 'con.han.thu@gmail.com');
  assert.equal(h.call(env, 'auth.login', { data: { idToken: 'x' } }).ok, true, 'hết hạn quyền hiểu là hết ngày đó');
});

test('Mã phiên hết hạn, sai chữ ký, sai dạng, hoặc thiếu thì bị từ chối', () => {
  const env = h.system();
  const old = h.sessionFor(env, h.MANAGER, env.clock.now() - 13 * HOUR);
  assert.equal(h.call(env, 'auth.me', { session: old }).error.code, 'SESSION_EXPIRED');

  const good = h.sessionFor(env, h.MANAGER);
  const [payload, sig] = good.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ e: h.OWNER, i: env.clock.now(), x: env.clock.now() + HOUR })).toString('base64url');
  assert.equal(h.call(env, 'auth.me', { session: `${forgedPayload}.${sig}` }).error.code, 'SESSION_INVALID', 'đổi email giữ chữ ký cũ');
  assert.equal(h.call(env, 'auth.me', { session: `${payload}.${sig.slice(0, -2)}AA` }).error.code, 'SESSION_INVALID');
  assert.equal(h.call(env, 'auth.me', { session: 'rac' }).error.code, 'SESSION_INVALID');
  assert.equal(h.call(env, 'auth.me', {}).error.code, 'AUTH_REQUIRED');

  env.props.SESSION_SECRET = 'f'.repeat(64);
  assert.equal(h.call(env, 'auth.me', { session: good }).error.code, 'SESSION_INVALID', 'đổi SESSION_SECRET làm mọi phiên mất hiệu lực');
});

test('Đăng xuất mọi thiết bị: mã phiên cấp trước bị từ chối ngay, đăng nhập lại thì dùng được', () => {
  const env = h.system();
  const before = h.sessionFor(env, h.MANAGER);
  assert.equal(h.call(env, 'auth.me', { session: before }).ok, true, 'đưa kết quả vào bộ đệm');
  env.clock.advance(1000);
  const admin = h.sessionFor(env, h.OWNER);
  const res = h.call(env, 'user.revokeSessions', { session: admin, requestId: h.rid(), data: { email: h.MANAGER } });
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(h.call(env, 'auth.me', { session: before }).error.code, 'SESSION_EXPIRED');
  env.clock.advance(1000);
  assert.equal(h.call(env, 'auth.me', { session: h.sessionFor(env, h.MANAGER) }).ok, true);
});

test('Admin khóa hoặc đổi vai trò: có hiệu lực ngay, không chờ bộ đệm 5 phút', () => {
  const env = h.system();
  const mgr = h.sessionFor(env, h.MANAGER);
  assert.equal(h.call(env, 'auth.me', { session: mgr }).data.user.role, 'Quản lý');
  const admin = h.sessionFor(env, h.OWNER);
  h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: h.MANAGER, name: 'Người thử', role: 'Chỉ xem' } });
  assert.equal(h.call(env, 'auth.me', { session: mgr }).data.user.role, 'Chỉ xem');
  h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: h.MANAGER, role: 'Chỉ xem', status: 'Khóa' } });
  assert.equal(h.call(env, 'auth.me', { session: mgr }).error.code, 'ACCOUNT_NOT_ALLOWED');
});

test('Tài khoản chủ sở hữu không thể bị khóa hay hạ quyền', () => {
  const env = h.system();
  const admin2 = h.sessionFor(env, h.ADMIN2);
  for (const data of [{ role: 'Admin', status: 'Khóa' }, { role: 'Quản lý' }, { role: 'Admin', expiresOn: '2026-12-31' }]) {
    const res = h.call(env, 'user.save', { session: admin2, requestId: h.rid(), data: { email: h.OWNER, ...data } });
    assert.equal(res.error.code, 'VALIDATION', JSON.stringify(data));
  }
  // Sửa tay trên Sheet cũng không khóa được chủ sở hữu
  const { gas } = env.newExecution();
  gas.Repo.withLock(() => {
    const t = gas.Repo.table('NguoiDung');
    const i = t.find('Email', h.OWNER, gas.Util.normEmail);
    t.set(i, 'Trạng thái', 'Khóa');
    t.set(i, 'Vai trò', 'Chỉ xem');
    t.flush();
  });
  gas.CacheService.getScriptCache().remove(`nd:${h.OWNER}`);
  const me = h.call(env, 'auth.me', { session: h.sessionFor(env, h.OWNER) });
  assert.equal(me.ok, true);
  assert.equal(me.data.user.role, 'Admin');
  assert.equal(me.data.user.isOwner, true);
});

test('Quản lý tài khoản: thêm, sửa, danh sách; SĐT và hạn quyền được kiểm tra', () => {
  const env = h.system();
  const admin = h.sessionFor(env, h.OWNER);
  const bad = h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: 'sai', role: 'Sếp', phone: '123', expiresOn: '31/02/2026' } });
  assert.equal(bad.error.code, 'VALIDATION');
  assert.deepEqual(bad.error.details.fields.sort(), ['email', 'expiresOn', 'phone', 'role']);
  const ok = h.call(env, 'user.save', {
    session: admin, requestId: h.rid(),
    data: { email: ' Moi.Thu@Gmail.com ', name: '=Người mới', role: 'Quản lý', phone: '0912 345 678', expiresOn: '2027-06-30' }
  });
  assert.equal(ok.ok, true, JSON.stringify(ok));
  assert.equal(ok.data.user.email, 'moi.thu@gmail.com');
  assert.equal(ok.data.user.name, '=Người mới');
  assert.equal(ok.data.user.phone, '0912345678');
  assert.equal(ok.data.user.expiresOn, '2027-06-30');
  const list = h.call(env, 'user.list', { session: admin });
  assert.equal(list.data.users.length, 5);
  assert.equal(list.data.users.find((u) => u.email === h.OWNER).isOwner, true);
  const raw = h.rawObjects(env, 'NguoiDung').find((r) => r.Email === 'moi.thu@gmail.com');
  assert.equal(raw['SĐT'], '0912345678');
  assert.equal(raw['Họ tên'], '=Người mới');
});
