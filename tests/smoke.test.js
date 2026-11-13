'use strict';

/** smokeTest() chỉ chạy trên DEV; trên bộ giả lập mọi ca phải đạt (giả định của bộ giả lập nhất quán). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas, freshSystem } = require('./helpers');

test('smokeTest() từ chối chạy khi không phải DEV', () => {
  const { env } = freshSystem();
  assert.throws(() => env.newExecution().gas.smokeTest(), /chỉ chạy trên project DEV.*chưa đặt/);
  env.props.MOI_TRUONG = 'PROD';
  assert.throws(() => env.newExecution().gas.smokeTest(), /PROD/);
});

test('smokeTest() trên DEV: mọi ca đạt với bộ giả lập và xóa sheet tạm', () => {
  const { gas, env } = loadGas({ props: { MOI_TRUONG: 'DEV' } });
  gas.setup();
  const before = env.spreadsheet().getSheets().length;
  const report = env.newExecution().gas.smokeTest();
  assert.equal(report.passed, report.total, report.text);
  assert.ok(report.total >= 12);
  assert.equal(env.spreadsheet().getSheets().length, before);
  assert.ok(env.state.logs.some((l) => l.startsWith('KẾT QUẢ smokeTest')));
});
