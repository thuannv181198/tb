'use strict';

/**
 * SĐT, serie, chuỗi dạng số và chuỗi dạng công thức ghi vào Sheet rồi đọc lại phải đúng chuỗi gốc
 * (đặc tả mục 3). Bộ giả lập mô phỏng việc Sheet tự đổi kiểu (xem fakes.test.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { freshSystem, rawObjects } = require('./helpers');

const TRICKY = [
  '0123', '000123', '0912345678', '12345678901234567890', '1E5', '3-4', '2026-11-05', '05/11/2026', 'TRUE', '12%',
  '=1+1', '=HYPERLINK("http://x","y")', '+84912345678', '-5', '-abc', '@abc', "'nháy đơn", 'SN 12 34', 'Không có'
];

function deviceRow(i, serial) {
  return {
    'STT': i + 1, 'Tên thiết bị': 'Thiết bị thử', 'Mã TB': `TBT-${String(i + 1).padStart(3, '0')}`, 'Số serie': serial,
    'Tình trạng': 'Tốt', 'Lưu trữ': 'Phòng TH', 'Mã nhóm': 'TBT', 'Phòng/Vị trí': '201-VNB', 'Gắn tem riêng': 'Có',
    'SĐT người đang mượn': '0912345678', 'Ghi chú': serial
  };
}

test('Serie và SĐT ghi bằng Table rồi đọc lại đúng chuỗi gốc', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  g.Repo.withLock(() => {
    const t = g.Repo.table('ThietBi');
    TRICKY.forEach((s, i) => t.append(deviceRow(i, s)));
    t.flush();
  });

  const raw = rawObjects(env, 'ThietBi');
  TRICKY.forEach((s, i) => {
    assert.equal(raw[i]['Số serie'], s, `ô thô Số serie dòng ${i + 1}`);
    assert.equal(typeof raw[i]['Số serie'], 'string');
    assert.equal(raw[i]['Ghi chú'], s, `ô thô Ghi chú dòng ${i + 1}`);
    assert.equal(raw[i]['SĐT người đang mượn'], '0912345678');
  });
  const formulas = env.spreadsheet().getSheetByName('ThietBi').getRange(2, 1, TRICKY.length, 27).getFormulas();
  assert.ok(formulas.every((row) => row.every((f) => f === '')), 'không ô nào thành công thức');

  const t2 = env.newExecution().gas.Repo.table('ThietBi');
  TRICKY.forEach((s, i) => assert.equal(t2.get(i, 'Số serie'), s));
  assert.equal(t2.find('Số serie', '000123'), 1);
  assert.equal(t2.find('Mã TB', ' tbt-003 '), 2, 'tìm theo mã đã chuẩn hóa');
});

test('Sửa một ô không làm hỏng các ô khác của dòng khi ghi lại', () => {
  const { env } = freshSystem();
  let g = env.newExecution().gas;
  g.Repo.withLock(() => {
    const t = g.Repo.table('ThietBi');
    TRICKY.forEach((s, i) => t.append(deviceRow(i, s)));
    t.flush();
  });
  g = env.newExecution().gas;
  g.Repo.withLock(() => {
    const t = g.Repo.table('ThietBi');
    for (let i = 0; i < t.size(); i++) t.set(i, 'Tình trạng', 'Hư hỏng nhẹ');
    t.flush();
  });
  const raw = rawObjects(env, 'ThietBi');
  TRICKY.forEach((s, i) => {
    assert.equal(raw[i]['Số serie'], s);
    assert.equal(raw[i]['Tình trạng'], 'Hư hỏng nhẹ');
  });
});

test('Ghi nối tiếp không đọc sheet (NhatKy) cũng giữ đúng chuỗi gốc và ghi được quá 1000 dòng', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  const rows = [];
  for (let i = 0; i < 1005; i++) {
    rows.push({ 'Thời gian': new g.Date(), 'Email': 'công khai', 'Action': 'thu', 'Đối tượng': TRICKY[i % TRICKY.length], 'Kết quả': 'Thành công' });
  }
  g.Repo.withLock(() => g.Repo.append('NhatKy', rows));
  const raw = rawObjects(env, 'NhatKy');
  assert.equal(raw.length, 1005);
  raw.forEach((r, i) => assert.equal(r['Đối tượng'], TRICKY[i % TRICKY.length]));
  assert.ok(env.spreadsheet().getSheetByName('NhatKy').getMaxRows() >= 1006);
});

test('Ghi sai kiểu hoặc vượt 50.000 ký tự bị từ chối trước khi ghi', () => {
  const { env } = freshSystem();
  const g = env.newExecution().gas;
  const t = g.Repo.table('ThietBi');
  assert.throws(() => t.append({ 'STT': 'abc' }), (e) => e.code === 'VALIDATION');
  assert.throws(() => t.append({ 'Hạn trả': '05/11/2026' }), (e) => e.code === 'VALIDATION');
  assert.throws(() => t.append({ 'Ghi chú': 'x'.repeat(50001) }), (e) => e.code === 'VALIDATION');
  assert.throws(() => t.append({ 'Cột không có': 'x' }), /không có cột/);
});

test('Util.toSheetText chỉ thêm dấu nháy khi cần', () => {
  const { gas } = freshSystem();
  assert.equal(gas.Util.toSheetText('=1+1'), "'=1+1");
  assert.equal(gas.Util.toSheetText('+84'), "'+84");
  assert.equal(gas.Util.toSheetText('-5'), "'-5");
  assert.equal(gas.Util.toSheetText('@a'), "'@a");
  assert.equal(gas.Util.toSheetText("'a"), "''a");
  assert.equal(gas.Util.toSheetText('0123'), '0123');
  assert.equal(gas.Util.toSheetText('a=b'), 'a=b');
});

test('Làm sạch đầu vào: SĐT 10 chữ số, chuỗi, mã, serie', () => {
  const { gas } = freshSystem();
  const U = gas.Util;
  assert.equal(U.cleanPhone('0912 345 678'), '0912345678');
  assert.equal(U.cleanPhone('091.234.5678'), '0912345678');
  assert.equal(U.cleanPhone('+84 912 345 678'), '0912345678');
  assert.equal(U.cleanPhone('84912345678'), '0912345678');
  assert.equal(U.cleanPhone('091234567'), '');
  assert.equal(U.cleanPhone('09123456789'), '');
  assert.equal(U.cleanPhone('abc'), '');
  assert.equal(U.cleanText('  a\u0000b\r\nc  '), 'ab\nc');
  assert.throws(() => U.cleanText('abcdef', 5, 'Họ tên'), (e) => e.code === 'VALIDATION' && /Họ tên/.test(e.message));
  assert.equal(U.normCode(' mkct - 001 '), 'MKCT-001');
  assert.equal(U.normSerial('sn 12 ab'), U.normSerial('SN12AB'));
  assert.equal(U.normEmail(' A.B@Gmail.COM '), 'a.b@gmail.com');
});
