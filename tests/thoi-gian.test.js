'use strict';

/** Xử lý thời gian theo giờ Việt Nam (đặc tả mục 2 và 4). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas } = require('./helpers');

const { gas } = loadGas({ now: '2026-11-05T08:30:00+07:00' });
const U = gas.Util;

test('ISO 8601 kèm múi giờ +07:00', () => {
  assert.equal(U.iso(U.now()), '2026-11-05T08:30:00+07:00');
  assert.equal(U.iso(null), '');
});

test('Hạn trả chỉ có ngày hiểu là 23:59:59 giờ Việt Nam', () => {
  assert.equal(U.iso(U.dueDate('2026-11-07')), '2026-11-07T23:59:59+07:00');
  assert.equal(U.iso(U.dueDate('07/11/2026')), '2026-11-07T23:59:59+07:00');
  assert.equal(U.iso(U.endOfDay(new Date('2026-11-05T17:30:00Z'))), '2026-11-06T23:59:59+07:00', '00:30 ngày 6 giờ VN');
});

test('Đọc ngày: không nhầm dd/MM với MM/dd; ngày không tồn tại bị từ chối', () => {
  assert.equal(U.iso(U.parseDate('05/11/2026')), '2026-11-05T00:00:00+07:00');
  assert.equal(U.parseDate('31/02/2026'), null);
  assert.equal(U.parseDate('2026-13-01'), null);
  assert.equal(U.parseDate('hôm nay'), null);
  assert.equal(U.parseDate(''), null);
  assert.equal(U.iso(U.parseDate('2026-11-10T08:30:00+07:00')), '2026-11-10T08:30:00+07:00');
});

test('Cộng ngày và đầu ngày theo giờ Việt Nam', () => {
  const start = U.startOfDay(U.now());
  assert.equal(U.iso(start), '2026-11-05T00:00:00+07:00');
  assert.equal(U.iso(U.endOfDay(U.addDays(start, 2))), '2026-11-07T23:59:59+07:00');
  assert.equal(U.ymd(U.now()), '20261105');
  assert.equal(U.year(U.now()), '2026');
});
