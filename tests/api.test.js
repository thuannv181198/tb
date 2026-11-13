'use strict';

/** Router doPost, bảng action, phân quyền, requestId, khóa ghi, cấu hình (Kiểm thử bắt buộc M1). */
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./api-helpers');

const ROLES = { Admin: h.ADMIN2, 'Quản lý': h.MANAGER, 'Chỉ xem': h.VIEWER };

test('Mọi action quản lý từ chối vai trò không đủ quyền và ghi NhatKy "Từ chối"', () => {
  const env = h.system();
  const { gas } = env.newExecution();
  const table = gas.Api.actions();
  let checked = 0;
  for (const name of Object.keys(table)) {
    const def = table[name];
    if (def.roles === gas.Api.PUBLIC) continue;
    for (const role of Object.keys(ROLES)) {
      if (def.roles.includes(role)) continue;
      const before = h.logs(env).length;
      const res = h.call(env, name, { session: h.sessionFor(env, ROLES[role]), requestId: h.rid(), data: {} });
      assert.equal(res.ok, false, `${name} với ${role}`);
      assert.equal(res.error.code, 'FORBIDDEN', `${name} với ${role}`);
      const rows = h.logs(env);
      assert.equal(rows.length, before + 1);
      assert.equal(rows.at(-1).Action, name);
      assert.equal(rows.at(-1)['Kết quả'], 'Từ chối');
      assert.equal(rows.at(-1).Email, ROLES[role]);
      checked++;
    }
  }
  assert.ok(checked >= 10, `đã kiểm ${checked} cặp action–vai trò`);
});

test('Mọi action quản lý từ chối khi chưa đăng nhập', () => {
  const env = h.system();
  const { gas } = env.newExecution();
  const table = gas.Api.actions();
  for (const name of Object.keys(table)) {
    if (table[name].roles === gas.Api.PUBLIC) continue;
    assert.equal(h.call(env, name, { requestId: h.rid(), data: {} }).error.code, 'AUTH_REQUIRED', name);
  }
});

test('Mỗi action trong bảng có trong hợp đồng dữ liệu', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'HOP-DONG-DU-LIEU.md'), 'utf8');
  const env = h.system();
  for (const name of Object.keys(env.newExecution().gas.Api.actions())) {
    assert.ok(doc.includes('`' + name + '`'), `${name} chưa có trong docs/HOP-DONG-DU-LIEU.md`);
  }
});

test('Gửi lại cùng requestId trả kết quả cũ, không ghi lần hai (kể cả khi bộ đệm đã mất)', () => {
  const env = h.system();
  const admin = h.sessionFor(env, h.OWNER);
  const requestId = h.rid();
  const data = { email: 'lap.lai.thu@gmail.com', name: 'Lặp lại', role: 'Quản lý' };
  const first = h.call(env, 'user.save', { session: admin, requestId, data });
  assert.equal(first.ok, true);
  const logsAfterFirst = h.logs(env).length;

  const second = h.call(env, 'user.save', { session: admin, requestId, data: { ...data, role: 'Chỉ xem' } });
  assert.deepEqual(second.data, first.data, 'trả đúng kết quả cũ');
  env.state.cache.clear();
  const third = h.call(env, 'user.save', { session: admin, requestId, data });
  assert.deepEqual(third.data, first.data, 'bộ đệm mất vẫn tra được từ sheet KetQuaRequest');

  assert.equal(h.logs(env).length, logsAfterFirst, 'không ghi NhatKy lần hai');
  assert.equal(h.rawObjects(env, 'KetQuaRequest').filter((r) => r.requestId === requestId).length, 1);
  const users = h.rawObjects(env, 'NguoiDung').filter((r) => r.Email === 'lap.lai.thu@gmail.com');
  assert.equal(users.length, 1);
  assert.equal(users[0]['Vai trò'], 'Quản lý', 'lần gửi lại không đổi dữ liệu');

  const other = h.call(env, 'user.revokeSessions', { session: admin, requestId, data: { email: 'lap.lai.thu@gmail.com' } });
  assert.equal(other.error.code, 'BAD_REQUEST', 'cùng requestId cho action khác');
});

test('Action ghi thiếu hoặc sai requestId bị từ chối', () => {
  const env = h.system();
  const admin = h.sessionFor(env, h.OWNER);
  for (const requestId of [undefined, '', 'ngắn', 'có khoảng trắng 123456', 'x'.repeat(65)]) {
    const res = h.call(env, 'user.save', { session: admin, requestId, data: { email: 'a.thu@gmail.com', role: 'Quản lý' } });
    assert.equal(res.error.code, 'BAD_REQUEST', String(requestId));
  }
});

test('Không lấy được khóa thì action ghi trả BUSY và không ghi gì', () => {
  const env = h.system();
  const admin = h.sessionFor(env, h.OWNER);
  const before = { users: h.rawObjects(env, 'NguoiDung').length, logs: h.logs(env).length, results: h.rawObjects(env, 'KetQuaRequest').length };
  env.state.lock.alwaysFail = true;
  const res = h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: 'ban.thu@gmail.com', role: 'Quản lý' } });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, 'BUSY');
  assert.equal(res.error.message, 'Hệ thống đang bận, vui lòng bấm lại sau vài giây.');
  assert.deepEqual({ users: h.rawObjects(env, 'NguoiDung').length, logs: h.logs(env).length, results: h.rawObjects(env, 'KetQuaRequest').length }, before);
  env.state.lock.alwaysFail = false;
  assert.equal(h.call(env, 'user.save', { session: admin, requestId: h.rid(), data: { email: 'ban.thu@gmail.com', role: 'Quản lý' } }).ok, true);
});

test('Request sai dạng, action không có; lỗi lạ không lộ chi tiết kỹ thuật', () => {
  const env = h.system();
  assert.equal(h.call(env, '', {}, 'không phải json').error.code, 'BAD_REQUEST');
  assert.equal(h.call(env, '', {}, '').error.code, 'BAD_REQUEST');
  assert.equal(h.call(env, '', {}, JSON.stringify({ data: {} })).error.code, 'BAD_REQUEST');
  assert.equal(h.call(env, 'khong.co', {}).error.code, 'UNKNOWN_ACTION');

  // Lỗi lập trình bên trong: trả SERVER_ERROR, chi tiết chỉ nằm trong NhatKy
  delete env.state.spreadsheets.get(env.props.SHEET_ID)._sheets.splice(
    env.state.spreadsheets.get(env.props.SHEET_ID)._sheets.findIndex((s) => s._name === 'DanhMucPhong'), 1);
  const res = h.call(env, 'app.bootstrap', { session: h.sessionFor(env, h.OWNER) });
  assert.equal(res.error.code, 'SERVER_ERROR');
  assert.equal(res.error.message, 'Thiếu sheet "DanhMucPhong". Hãy chạy setup().');
  assert.equal(JSON.stringify(res).includes('at '), false, 'không có stack trace');
});

test('Phản hồi luôn có ok, serverTime ISO; doGet trả trạng thái sống', () => {
  const env = h.system();
  const res = h.call(env, 'auth.me', { session: h.sessionFor(env, h.VIEWER) });
  assert.equal(res.ok, true);
  assert.match(res.serverTime, /^2026-11-13T08:00:00\+07:00$/);
  const { gas } = env.newExecution();
  const out = gas.doGet();
  assert.equal(out.getMimeType(), 'JSON');
  assert.equal(JSON.parse(out.getContent()).ok, true);
});

test('app.bootstrap trả thông tin khởi động theo vai trò', () => {
  const env = h.system();
  const res = h.call(env, 'app.bootstrap', { session: h.sessionFor(env, h.VIEWER) });
  assert.equal(res.ok, true);
  assert.equal(res.data.user.role, 'Chỉ xem');
  assert.equal(res.data.unitName, 'KHOA CÔNG NGHỆ NĂNG LƯỢNG');
  assert.equal(res.data.statuses.length, 8);
  assert.deepEqual(res.data.rooms.map((r) => r.ma), ['201-VNB']);
  assert.equal(res.data.limits.hanMuonNgay, 2);
  assert.equal(res.data.dataVersion, 1);
});

test('Đăng xuất ghi NhatKy', () => {
  const env = h.system();
  const res = h.call(env, 'auth.logout', { session: h.sessionFor(env, h.MANAGER) });
  assert.equal(res.ok, true);
  const log = h.logs(env).at(-1);
  assert.equal(log.Action, 'auth.logout');
  assert.equal(log.Email, h.MANAGER);
});

test('Cấu hình: kiểm tra giá trị, bật mã truy cập cần mã hợp lệ, khóa lạ bị từ chối', () => {
  const env = h.system();
  const admin = h.sessionFor(env, h.OWNER);
  const save = (values) => h.call(env, 'config.save', { session: admin, requestId: h.rid(), data: { values } });
  assert.equal(save({ HAN_MUON_NGAY: '0' }).error.code, 'VALIDATION');
  assert.equal(save({ HAN_MUON_NGAY: 'abc' }).error.code, 'VALIDATION');
  assert.equal(save({ SCHEMA_VERSION: '9' }).error.code, 'VALIDATION');
  assert.equal(save({ KHOA_LA: 'x' }).error.code, 'VALIDATION');
  assert.equal(save({ MA_TRUY_CAP_BAT: 'Có' }).error.code, 'VALIDATION');
  assert.equal(save({ MA_TRUY_CAP: '12a4' }).error.code, 'VALIDATION');
  assert.equal(save({ MUC_LAP_BIEN_BAN: 'HONG_NANG,KHONG_CO' }).error.code, 'VALIDATION');
  assert.equal(save({ PHONG_MAC_DINH: '999-XYZ' }).error.code, 'VALIDATION');
  assert.equal(save({ EMAIL_NHAN_THONG_BAO: 'a@b.vn, sai' }).error.code, 'VALIDATION');
  assert.equal(save({ TEN_TT_KHAC: 'Tốt' }).error.code, 'VALIDATION', 'trùng tên tình trạng');

  const ok = save({ MA_TRUY_CAP_BAT: 'Có', MA_TRUY_CAP: '0123', HAN_MUON_NGAY: '3', EMAIL_NHAN_THONG_BAO: ' A@B.vn ,c@d.vn' });
  assert.equal(ok.ok, true, JSON.stringify(ok));
  assert.equal(ok.data.values.MA_TRUY_CAP, '0123');
  assert.equal(ok.data.values.HAN_MUON_NGAY, '3');
  assert.equal(ok.data.values.EMAIL_NHAN_THONG_BAO, 'a@b.vn,c@d.vn');
  const raw = Object.fromEntries(h.rawObjects(env, 'CauHinh').map((r) => [r['Khóa'], r['Giá trị']]));
  assert.equal(raw.MA_TRUY_CAP, '0123', 'mã truy cập giữ số 0 đầu');
  const boot = h.call(env, 'app.bootstrap', { session: admin });
  assert.equal(boot.data.limits.hanMuonNgay, 3, 'cấu hình mới có hiệu lực ngay, không chờ bộ đệm');
  assert.equal(h.call(env, 'config.get', { session: admin }).data.values.MA_TRUY_CAP_BAT, 'Có');
});

test('Đổi tên tình trạng ghi lại cột Tình trạng của ThietBi và danh sách thả xuống (C4)', () => {
  const env = h.system();
  const { gas } = env.newExecution();
  gas.Repo.withLock(() => {
    const t = gas.Repo.table('ThietBi');
    for (const [code, status] of [['TBT-001', 'Tốt'], ['TBT-002', 'Hư hỏng nhẹ'], ['TBT-003', 'Tốt']]) {
      t.append({ 'Tên thiết bị': 'Thiết bị thử', 'Mã TB': code, 'Số serie': 'Không có', 'Tình trạng': status, 'Mã nhóm': 'TBT', 'Phòng/Vị trí': '201-VNB', 'Gắn tem riêng': 'Có' });
    }
    t.flush();
  });
  const admin = h.sessionFor(env, h.OWNER);
  const res = h.call(env, 'config.save', { session: admin, requestId: h.rid(), data: { values: { TEN_TT_TOT: 'Tốt (dùng được)' } } });
  assert.equal(res.ok, true, JSON.stringify(res));
  const devices = h.rawObjects(env, 'ThietBi');
  assert.deepEqual(devices.map((d) => d['Tình trạng']), ['Tốt (dùng được)', 'Hư hỏng nhẹ', 'Tốt (dùng được)']);
  const sheet = env.spreadsheet().getSheetByName('ThietBi');
  assert.equal(sheet.getRange(2, 5).getDataValidation().values[0], 'Tốt (dùng được)');
  assert.equal(env.props.PHIEN_BAN_DU_LIEU, '2', 'ghi ThietBi thì tăng phienBanDuLieu');
  const g = env.newExecution().gas;
  assert.equal(g.Repo.statusCode('tốt (dùng được)'), 'TOT');
});

test('Đổi tên tình trạng bị ngắt giữa chừng: gửi lại cùng requestId chạy tiếp phần còn thiếu', () => {
  const env = h.system();
  let g = env.newExecution().gas;
  g.Repo.withLock(() => {
    const t = g.Repo.table('ThietBi');
    t.append({ 'Tên thiết bị': 'Thiết bị thử', 'Mã TB': 'TBT-001', 'Số serie': 'Không có', 'Tình trạng': 'Hư hỏng nhẹ', 'Mã nhóm': 'TBT', 'Phòng/Vị trí': '201-VNB', 'Gắn tem riêng': 'Có' });
    t.flush();
  });
  const admin = h.sessionFor(env, h.OWNER);
  const requestId = h.rid();
  const body = JSON.stringify({ action: 'config.save', session: admin, requestId, data: { values: { TEN_TT_HONG_NHE: 'Hỏng nhẹ' } } });

  // Lần 1: dừng sau khi đã ghi ThietBi (giả lập lỗi dịch vụ khi đặt danh sách thả xuống)
  g = env.newExecution().gas;
  g.Setup.applyStatusValidation = () => { throw new Error('Lỗi dịch vụ giả lập'); };
  const first = JSON.parse(g.doPost({ postData: { contents: body } }).getContent());
  assert.equal(first.error.code, 'SERVER_ERROR');
  assert.equal(h.rawObjects(env, 'KetQuaRequest').filter((r) => r.requestId === requestId).length, 0);

  // Lần 2: gửi lại cùng requestId
  const second = h.call(env, '', {}, body);
  assert.equal(second.ok, true, JSON.stringify(second));
  assert.equal(h.rawObjects(env, 'ThietBi')[0]['Tình trạng'], 'Hỏng nhẹ');
  assert.equal(Object.fromEntries(h.rawObjects(env, 'CauHinh').map((r) => [r['Khóa'], r['Giá trị']])).TEN_TT_HONG_NHE, 'Hỏng nhẹ');
  assert.equal(env.spreadsheet().getSheetByName('ThietBi').getRange(2, 5).getDataValidation().values[1], 'Hỏng nhẹ');
  assert.equal(h.rawObjects(env, 'KetQuaRequest').filter((r) => r.requestId === requestId).length, 1);
  assert.equal(env.newExecution().gas.Repo.statusCode('Hỏng nhẹ'), 'HONG_NHE');
});
