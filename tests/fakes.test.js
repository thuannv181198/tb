'use strict';

/**
 * Kiểm thử chính bộ giả lập: nếu bộ giả lập không mô phỏng được việc Sheet tự đổi kiểu,
 * các kiểm thử "giữ số 0 đầu", "không thành công thức" sẽ đạt mà không chứng minh được gì.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers');

function newSheet() {
  const { gas, env } = loadGas();
  const ss = gas.SpreadsheetApp.create('thu');
  return { gas, env, sheet: ss.getSheets()[0], ss };
}

test('Ô định dạng tự động đổi kiểu chuỗi giống Google Sheet', () => {
  const { sheet } = newSheet();
  const input = ['0123', '1E5', '3-4', '2026-11-05', 'TRUE', '12%', 'abc'];
  sheet.getRange(1, 1, input.length, 1).setValues(input.map((v) => [v]));
  const back = sheet.getRange(1, 1, input.length, 1).getValues().map((r) => r[0]);
  assert.equal(back[0], 123);
  assert.equal(back[1], 100000);
  assert.equal(Object.prototype.toString.call(back[2]), '[object Date]');
  assert.equal(Object.prototype.toString.call(back[3]), '[object Date]');
  assert.equal(back[4], true);
  assert.equal(back[5], 0.12);
  assert.equal(back[6], 'abc');
});

test('Ô văn bản thuần giữ chuỗi; dấu nháy đơn đầu bị ẩn khi đọc', () => {
  const { sheet } = newSheet();
  sheet.getRange(1, 1, 3, 1).setNumberFormat('@');
  sheet.getRange(1, 1, 3, 1).setValues([['0123'], ['+84912'], ["'=1+1"]]);
  assert.deepEqual(sheet.getRange(1, 1, 3, 1).getValues().map((r) => r[0]), ['0123', '+84912', '=1+1']);
});

test('Chuỗi bắt đầu bằng = luôn thành công thức nếu không có dấu nháy (kể cả ô văn bản thuần)', () => {
  const { sheet } = newSheet();
  sheet.getRange(1, 1).setNumberFormat('@');
  sheet.getRange(1, 1).setValue('=1+1');
  assert.equal(sheet.getRange(1, 1).getFormula(), '=1+1');
  assert.equal(sheet.getRange(1, 1).getValue(), '#ERROR!');
  sheet.getRange(1, 2).setValue('-abc');
  assert.equal(sheet.getRange(1, 2).getFormula(), '-abc');
  sheet.getRange(1, 3).setValue('+84912345678');
  assert.equal(sheet.getRange(1, 3).getValue(), 84912345678);
});

test('Phạm vi vượt số dòng của sheet bị từ chối; thêm dòng ở cuối thì ghi được', () => {
  const { sheet } = newSheet();
  assert.throws(() => sheet.getRange(1001, 1), /ngoài kích thước/);
  sheet.insertRowsAfter(1000, 5);
  sheet.getRange(1005, 1).setValue('x');
  assert.equal(sheet.getLastRow(), 1005);
  assert.throws(() => sheet.getRange(1, 27), /ngoài kích thước/);
});

test('Gọi phương thức chưa giả lập thì ném lỗi rõ ràng', () => {
  const { gas, sheet } = newSheet();
  assert.throws(() => sheet.hideSheet(), /chưa hỗ trợ Sheet.hideSheet/);
  assert.throws(() => gas.SpreadsheetApp.getActiveSpreadsheet(), /chưa hỗ trợ SpreadsheetApp.getActiveSpreadsheet/);
});

test('Bộ đệm hết hạn theo đồng hồ giả và từ chối giá trị quá 100 KB', () => {
  const { gas, env } = loadGas();
  const cache = gas.CacheService.getScriptCache();
  cache.put('k', 'v', 60);
  assert.equal(cache.get('k'), 'v');
  env.clock.advance(61 * 1000);
  assert.equal(cache.get('k'), null);
  assert.throws(() => cache.put('lon', 'x'.repeat(100 * 1024 + 1)), /too large/);
  assert.throws(() => cache.put('k'.repeat(251), 'v'), /quá dài/);
});

test('Khóa có thể đặt cho thất bại để thử lỗi BUSY', () => {
  const { gas, env } = loadGas();
  env.state.lock.alwaysFail = true;
  assert.equal(gas.LockService.getScriptLock().tryLock(10000), false);
});

test('new Date() trong backend dùng đồng hồ giả', () => {
  const { gas, env } = loadGas({ now: '2026-11-05T08:00:00+07:00' });
  assert.equal(gas.Util.iso(gas.Util.now()), '2026-11-05T08:00:00+07:00');
  env.clock.set('2026-12-31T23:59:59+07:00');
  assert.equal(gas.Util.formatDate(new gas.Date(), 'dd/MM/yyyy HH:mm:ss'), '31/12/2026 23:59:59');
});

test('Utilities.formatDate theo múi giờ Việt Nam', () => {
  const { gas } = loadGas();
  const d = new Date('2026-11-05T17:30:00Z');
  assert.equal(gas.Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', "yyyy-MM-dd'T'HH:mm:ssXXX"), '2026-11-06T00:30:00+07:00');
  assert.equal(gas.Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyyMMdd'), '20261106');
});
