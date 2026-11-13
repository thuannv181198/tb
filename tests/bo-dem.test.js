'use strict';

/** Cấp số thứ tự từ BoDem và định dạng mã (đặc tả mục 5). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { freshSystem, plain, rawObjects } = require('./helpers');

function codes(gas, type, count) {
  return plain(gas.Repo.withLock(() => gas.Repo.nextCodes(type, count)));
}

test('Cấp số tiếp theo theo ngày, không cấp lại số đã dùng kể cả ở lần chạy sau', () => {
  const { env } = freshSystem({ now: '2026-11-05T09:00:00+07:00' });
  let g = env.newExecution().gas;
  assert.deepEqual(codes(g, 'YC'), ['YC-20261105-001']);
  assert.deepEqual(codes(g, 'YC'), ['YC-20261105-002']);
  assert.deepEqual(codes(g, 'YC', 3), ['YC-20261105-003', 'YC-20261105-004', 'YC-20261105-005']);
  g = env.newExecution().gas;
  assert.deepEqual(codes(g, 'YC'), ['YC-20261105-006']);
  assert.deepEqual(codes(g, 'PM'), ['PM-20261105-001'], 'mỗi loại mã một bộ đếm');
});

test('Sang ngày mới, năm mới thì đếm lại theo kỳ; mã không có kỳ đếm liên tục', () => {
  const { env } = freshSystem({ now: '2026-12-31T23:59:00+07:00' });
  const g = env.newExecution().gas;
  assert.deepEqual(codes(g, 'YC'), ['YC-20261231-001']);
  assert.deepEqual(codes(g, 'GH'), ['GH-2026-001']);
  assert.deepEqual(codes(g, 'BO'), ['BO-001']);
  assert.deepEqual(codes(g, 'DN'), ['DN-2026-01']);
  assert.deepEqual(codes(g, 'KK'), ['KK-20261231-01']);
  env.clock.set('2027-01-01T00:01:00+07:00');
  assert.deepEqual(codes(g, 'YC'), ['YC-20270101-001']);
  assert.deepEqual(codes(g, 'GH'), ['GH-2027-001']);
  assert.deepEqual(codes(g, 'BO'), ['BO-002']);
});

test('Kỳ của bộ đếm lưu dạng chuỗi, không thành số', () => {
  const { env } = freshSystem({ now: '2026-11-05T09:00:00+07:00' });
  codes(env.newExecution().gas, 'YC');
  codes(env.newExecution().gas, 'BO');
  const rows = rawObjects(env, 'BoDem');
  const yc = rows.find((r) => r['Loại mã'] === 'YC');
  assert.equal(yc['Kỳ'], '20261105');
  assert.equal(yc['Số cuối đã cấp'], 1);
  assert.equal(rows.find((r) => r['Loại mã'] === 'BO')['Kỳ'], '');
});

test('Vượt 999 thì thêm chữ số: BO-999 rồi BO-1000', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  codes(g, 'BO');
  g.Repo.withLock(() => {
    const t = g.Repo.table('BoDem');
    t.set(t.find('Loại mã', 'BO'), 'Số cuối đã cấp', 998);
    t.flush();
  });
  assert.deepEqual(codes(g, 'BO', 2), ['BO-999', 'BO-1000']);
  assert.deepEqual(codes(g, 'BO'), ['BO-1001']);
});

test('Mã TB: tối thiểu 3 chữ số, sau 999 là 1000; đọc lại số thứ tự', () => {
  const { gas } = freshSystem();
  assert.equal(gas.Util.deviceCode('MKCT', 1), 'MKCT-001');
  assert.equal(gas.Util.deviceCode('MKCT', 999), 'MKCT-999');
  assert.equal(gas.Util.deviceCode('MKCT', 1000), 'MKCT-1000');
  assert.equal(gas.Util.deviceNumber('MKCT-1000'), 1000);
  assert.equal(gas.Util.deviceNumber('MKCT-007'), 7);
  assert.equal(gas.Util.deviceNumber('abc'), 0);
});

test('Cấp số ngoài vùng khóa là lỗi lập trình', () => {
  const { gas } = freshSystem();
  assert.throws(() => gas.Repo.nextCodes('YC'), /withLock/);
  assert.throws(() => gas.Repo.nextDeviceCodes('MKCT'), /withLock/);
});

function addGroup(g, code, lastIssued) {
  g.Repo.withLock(() => {
    const t = g.Repo.table('NhomTB');
    t.append({ 'Mã nhóm': code, 'Tên chuẩn hóa': code.toLowerCase(), 'Tên hiển thị': code, 'Số thứ tự cuối đã cấp': lastIssued });
    t.flush();
  });
}

function addDevice(g, code, status) {
  g.Repo.withLock(() => {
    const t = g.Repo.table('ThietBi');
    t.append({
      'Tên thiết bị': 'Máy khoan cầm tay', 'Mã TB': code, 'Số serie': 'Không có', 'Tình trạng': status || 'Tốt',
      'Mã nhóm': code.split('-')[0], 'Phòng/Vị trí': '201-VNB', 'Gắn tem riêng': 'Có'
    });
    t.flush();
  });
}

function deviceCodes(g, group, count) {
  return plain(g.Repo.withLock(() => g.Repo.nextDeviceCodes(group, count)));
}

test('Mã TB: cấp tiếp theo nhóm, không cấp lại số đã dùng ở lần chạy sau', () => {
  const { env } = freshSystem();
  let g = env.newExecution().gas;
  addGroup(g, 'MKCT', 0);
  assert.deepEqual(deviceCodes(g, 'MKCT', 2), ['MKCT-001', 'MKCT-002']);
  g = env.newExecution().gas;
  assert.deepEqual(deviceCodes(g, ' mkct '), ['MKCT-003']);
  const groups = rawObjects(env, 'NhomTB');
  assert.equal(groups[0]['Số thứ tự cuối đã cấp'], 3);
});

test('Mã TB: tăng tiếp từ số lớn nhất, kể cả thiết bị Mất, Đã thanh lý hoặc bộ đếm bị sửa nhỏ đi', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  addGroup(g, 'MKCT', 2);
  addDevice(g, 'MKCT-001');
  addDevice(g, 'MKCT-007', 'Mất');
  addDevice(g, 'MKCT-005', 'Đã thanh lý');
  addDevice(g, 'MKCTA-050'); // nhóm khác có tiền tố giống, không được tính
  assert.deepEqual(deviceCodes(g, 'MKCT'), ['MKCT-008']);
});

test('Mã TB: sau 999 là 1000; nhóm chưa có thì báo NOT_FOUND', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  addGroup(g, 'DHVN', 998);
  assert.deepEqual(deviceCodes(g, 'DHVN', 3), ['DHVN-999', 'DHVN-1000', 'DHVN-1001']);
  assert.throws(() => g.Repo.withLock(() => g.Repo.nextDeviceCodes('KHONGCO')), (e) => e.code === 'NOT_FOUND');
});

test('Thao tác lỗi giữa chừng: số đã cấp vẫn được flush trước khi nhả khóa, không cấp trùng', () => {
  const { env } = freshSystem({ now: '2026-11-05T09:00:00+07:00' });
  const g = env.newExecution().gas;
  env.resetCounters();
  assert.throws(() => g.Repo.withLock(() => {
    g.Repo.nextCodes('PM');
    throw new Error('lỗi sau khi cấp số');
  }), /lỗi sau khi cấp số/);
  assert.equal(env.state.counters.flush, 1, 'flush cả khi lỗi');
  assert.equal(env.state.lock.held, 0, 'đã nhả khóa');
  assert.equal(g.Repo.isLocked(), false);
  assert.deepEqual(codes(env.newExecution().gas, 'PM'), ['PM-20261105-002']);
});

test('Ghi nối tiếp (Repo.append) ngoài vùng khóa là lỗi lập trình', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  assert.throws(() => g.Repo.append('NhatKy', [{ 'Thời gian': new g.Date(), 'Email': 'a', 'Action': 'x', 'Kết quả': 'Thành công' }]), /withLock/);
});

test('Mã xác nhận 6 ký tự không có O, 0, I, 1', () => {
  const { gas } = freshSystem();
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const c = gas.Util.randomCode(6);
    assert.match(c, /^[A-HJ-NP-Z2-9]{6}$/);
    seen.add(c);
  }
  assert.ok(seen.size > 295, 'mã ngẫu nhiên, hầu như không trùng');
});
