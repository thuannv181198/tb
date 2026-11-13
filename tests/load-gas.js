'use strict';

/**
 * Nạp mọi file gas/*.js vào một vm context dùng chung (giống phạm vi toàn cục của Apps Script),
 * cùng bộ giả lập dịch vụ Google và đồng hồ giả. Mỗi kiểm thử gọi loadGas() để có môi trường mới.
 *
 *   const { gas, env } = loadGas({ now: '2026-11-05T08:00:00+07:00', props: { ... } });
 *   gas.setup();               // gọi hàm toàn cục của backend
 *   env.clock.set('...');      // đổi thời điểm hiện tại
 *   env.newExecution();        // mô phỏng một lần chạy mới (xóa trạng thái trong bộ nhớ của backend)
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createSpreadsheetApp } = require('./fakes/sheets');
const svc = require('./fakes/services');

const GAS_DIR = path.join(__dirname, '..', 'gas');

function gasFiles() {
  return fs.readdirSync(GAS_DIR).filter((f) => f.endsWith('.js')).sort();
}

function makeClock(start) {
  let current = start === undefined ? Date.parse('2026-11-05T08:00:00+07:00') : toMs(start);
  return {
    now: () => current,
    set: (v) => { current = toMs(v); },
    advance: (ms) => { current += ms; }
  };
}

function toMs(v) {
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) throw new Error(`Thời điểm không hợp lệ: ${v}`);
  return ms;
}

/** Date dùng đồng hồ giả khi gọi new Date() hoặc Date.now(). */
function makeClockDate(clock) {
  const RealDate = Date;
  class ClockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(clock.now());
      else super(...args);
    }
    static now() { return clock.now(); }
  }
  return ClockDate;
}

/**
 * opts.now: thời điểm bắt đầu; opts.props: Script Properties ban đầu;
 * opts.email: email tài khoản chạy script; opts.shared: dùng chung dữ liệu với môi trường trước
 * (để mô phỏng nhiều lần chạy trên cùng Sheet).
 */
function loadGas(opts = {}) {
  const shared = opts.shared;
  const state = shared || {
    props: { ...(opts.props || {}) },
    cache: new Map(),
    counters: {},
    lock: { failNext: 0, alwaysFail: false, held: 0 },
    mail: { quota: opts.mailQuota === undefined ? 100 : opts.mailQuota, sent: [] },
    urlFetch: { handler: null },
    session: { effectiveEmail: opts.email || 'chu.so.huu@example.com', activeEmail: '' },
    logs: [],
    clock: makeClock(opts.now)
  };
  resetCounters(state);

  const drive = shared ? state.driveFake : svc.createDrive(state);
  state.driveFake = drive;
  state.drive = drive.api;

  const globals = {
    SpreadsheetApp: createSpreadsheetApp(state),
    PropertiesService: svc.createPropertiesService(state),
    CacheService: svc.createCacheService(state),
    LockService: svc.createLockService(state),
    DriveApp: drive.app,
    MailApp: svc.createMailApp(state),
    UrlFetchApp: svc.createUrlFetchApp(state),
    Utilities: svc.createUtilities(),
    Session: svc.createSession(state),
    ContentService: svc.createContentService(),
    Logger: svc.createLogger(state),
    console: { log: (...a) => state.logs.push(a.join(' ')), warn: () => {}, error: () => {}, info: () => {} },
    Date: makeClockDate(state.clock)
  };

  const context = vm.createContext(globals);
  for (const file of gasFiles()) {
    const code = fs.readFileSync(path.join(GAS_DIR, file), 'utf8');
    vm.runInContext(code, context, { filename: `gas/${file}` });
  }

  const env = {
    state,
    clock: state.clock,
    props: state.props,
    drive: drive.api,
    /** Bảng tính hiện tại theo SHEET_ID (đối tượng giả lập). */
    spreadsheet() {
      return globals.SpreadsheetApp.openById(state.props.SHEET_ID);
    },
    /** Mô phỏng một lần chạy mới trên cùng dữ liệu. */
    newExecution() {
      return loadGas({ shared: state });
    },
    resetCounters: () => resetCounters(state)
  };
  return { gas: context, env };
}

function resetCounters(state) {
  state.counters = {
    sheetReads: 0, sheetWrites: 0, openById: 0, flush: 0,
    propReads: 0, propWrites: 0, cacheReads: 0, lockAttempts: 0, urlFetch: 0
  };
}

module.exports = { loadGas, gasFiles };
