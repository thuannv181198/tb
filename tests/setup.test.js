'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas, plain, freshSystem, rawValues, rawObjects } = require('./helpers');

const OWNER = 'Chu.So.Huu@Example.com';

test('setup() lần đầu tạo Sheet, thư mục, Script Properties, 25 sheet và dữ liệu ban đầu', () => {
  const { gas, env } = loadGas({ email: OWNER });
  const summary = plain(gas.setup());

  assert.equal(summary.sheetCreated, true);
  assert.equal(env.props.ADMIN_EMAIL, 'chu.so.huu@example.com');
  assert.match(env.props.SESSION_SECRET, /^[0-9a-f]{64}$/);
  assert.ok(env.props.SHEET_ID);
  assert.ok(env.props.DRIVE_FOLDER_ID);
  for (const key of ['FOLDER_ANH_THIET_BI', 'FOLDER_ANH_HU_HONG', 'FOLDER_BIEN_BAN', 'FOLDER_DIEU_CHUYEN', 'FOLDER_SAO_LUU']) {
    assert.ok(env.props[key], key);
    assert.equal(env.drive.records.get(env.props[key]).parent, env.props.DRIVE_FOLDER_ID);
  }
  assert.equal(env.drive.records.get(env.props.SHEET_ID).parent, env.props.DRIVE_FOLDER_ID);
  assert.equal(env.props.PHIEN_BAN_DU_LIEU, '1');

  const ss = env.spreadsheet();
  const names = ss.getSheets().map((s) => s.getName());
  const expected = plain(gas.Config.SHEETS.map((d) => d.name));
  assert.deepEqual(names, expected, 'đúng 25 sheet, trang tính mặc định đã xóa');
  assert.equal(names.length, 25);

  for (const def of gas.Config.SHEETS) {
    const headers = rawValues(env, def.name)[0];
    assert.deepEqual(headers, plain(def.cols.map((c) => c.name)), `tiêu đề sheet ${def.name}`);
  }
  assert.deepEqual(rawValues(env, 'ThietBi')[0].slice(0, 9),
    ['STT', 'Tên thiết bị', 'Mã TB', 'Số serie', 'Tình trạng', 'Lưu trữ', 'Tổng SL thực tế', 'Ngày nhận bàn giao', 'Ghi chú']);

  const config = Object.fromEntries(rawObjects(env, 'CauHinh').map((r) => [r['Khóa'], r['Giá trị']]));
  assert.equal(config.SCHEMA_VERSION, '1');
  assert.equal(config.HAN_MUON_NGAY, '2');
  assert.equal(config.HAN_DE_XUAT_TOI_DA_NGAY, '2');
  assert.equal(config.TEN_TT_HONG_NHE, 'Hư hỏng nhẹ');
  assert.equal(config.MA_TRUY_CAP_BAT, 'Không');
  assert.equal(Object.keys(config).length, gas.Config.CONFIG_DEFAULTS.length + 1);

  const rooms = rawObjects(env, 'DanhMucPhong');
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0]['Mã phòng'], '201-VNB');
  assert.equal(rooms[0]['Trạng thái'], 'Đang dùng');

  const users = rawObjects(env, 'NguoiDung');
  assert.equal(users.length, 1);
  assert.equal(users[0].Email, 'chu.so.huu@example.com');
  assert.equal(users[0]['Vai trò'], 'Admin');
  assert.equal(users[0]['Trạng thái'], 'Hoạt động');
});

test('setup() đặt định dạng văn bản thuần, cố định và bảo vệ tiêu đề, danh sách thả xuống', () => {
  const { gas, env } = freshSystem();
  const ss = env.spreadsheet();
  const tb = ss.getSheetByName('ThietBi');
  const headers = rawValues(env, 'ThietBi')[0];
  const colOf = (name) => headers.indexOf(name) + 1;

  for (const name of ['Mã TB', 'Số serie', 'SĐT người đang mượn', 'Mã nhóm', 'Mã tham chiếu']) {
    assert.equal(tb.getRange(500, colOf(name)).getNumberFormat(), '@', name);
  }
  assert.equal(tb.getRange(2, colOf('Hạn trả')).getNumberFormat(), 'dd/MM/yyyy HH:mm');
  assert.equal(tb.getRange(2, colOf('Ngày nhận bàn giao')).getNumberFormat(), 'dd/MM/yyyy');
  assert.equal(ss.getSheetByName('YeuCauMuon').getRange(2, 5).getNumberFormat(), '@', 'SĐT của yêu cầu mượn');
  assert.equal(ss.getSheetByName('BoDem').getRange(2, 2).getNumberFormat(), '@', 'Kỳ của bộ đếm');

  for (const def of gas.Config.SHEETS) {
    const sh = ss.getSheetByName(def.name);
    assert.equal(sh.getFrozenRows(), 1, def.name);
    const prot = sh.getProtections('RANGE');
    assert.equal(prot.length, 1, def.name);
    assert.equal(prot[0].isWarningOnly(), true);
  }

  const rule = tb.getRange(2, colOf('Tình trạng')).getDataValidation();
  assert.deepEqual(plain(rule.values), ['Tốt', 'Hư hỏng nhẹ', 'Hư hỏng nặng', 'Đang sửa chữa', 'Chờ thanh lý', 'Đã thanh lý', 'Mất', 'Khác']);
  assert.equal(rule.allowInvalid, false);
  const roleRule = ss.getSheetByName('NguoiDung').getRange(2, 3).getDataValidation();
  assert.deepEqual(plain(roleRule.values), ['Admin', 'Quản lý', 'Chỉ xem']);
});

test('setup() chạy lần hai không mất dữ liệu, không tạo trùng sheet, dòng, khóa', () => {
  const first = freshSystem({ email: OWNER });
  const { env } = first;
  const propsBefore = { ...env.props };

  // Người dùng sửa cấu hình và có dữ liệu thiết bị trước khi chạy lại
  let run = env.newExecution();
  run.gas.Repo.withLock(() => {
    const cfg = run.gas.Repo.table('CauHinh');
    cfg.set(cfg.find('Khóa', 'HAN_MUON_NGAY', (v) => String(v)), 'Giá trị', '5');
    cfg.flush();
    const tb = run.gas.Repo.table('ThietBi');
    tb.append({
      'STT': 1, 'Tên thiết bị': 'Máy khoan cầm tay', 'Mã TB': 'MKCT-001', 'Số serie': '000123',
      'Tình trạng': 'Tốt', 'Lưu trữ': 'Phòng TH', 'Mã nhóm': 'MKCT', 'Phòng/Vị trí': '201-VNB', 'Gắn tem riêng': 'Có'
    });
    tb.flush();
  });
  const sheetCountBefore = env.spreadsheet().getSheets().length;

  run = env.newExecution();
  const summary = plain(run.gas.setup());
  assert.equal(summary.sheetCreated, false);
  assert.deepEqual(summary.stepsRan, []);
  assert.deepEqual(summary.repaired, []);
  assert.deepEqual(summary.propertiesCreated, []);
  assert.deepEqual(summary.seeded, { config: 0, rooms: 0, admin: 0 });

  assert.deepEqual({ ...env.props }, propsBefore, 'Script Properties giữ nguyên, kể cả SESSION_SECRET');
  assert.equal(env.spreadsheet().getSheets().length, sheetCountBefore);

  const config = rawObjects(env, 'CauHinh');
  const keys = config.map((r) => r['Khóa']);
  assert.equal(new Set(keys).size, keys.length, 'không trùng khóa CauHinh');
  assert.equal(config.find((r) => r['Khóa'] === 'HAN_MUON_NGAY')['Giá trị'], '5', 'không ghi đè giá trị Admin đã sửa');
  assert.equal(rawObjects(env, 'DanhMucPhong').length, 1);
  assert.equal(rawObjects(env, 'NguoiDung').length, 1);
  const devices = rawObjects(env, 'ThietBi');
  assert.equal(devices.length, 1);
  assert.equal(devices[0]['Số serie'], '000123');
  for (const name of ['ThietBi', 'CauHinh', 'NguoiDung']) {
    assert.equal(env.spreadsheet().getSheetByName(name).getProtections('RANGE').length, 1, `không tạo trùng bảo vệ ${name}`);
  }
});

test('setup() khôi phục quyền Admin của chủ sở hữu nếu bị sửa tay', () => {
  const { env } = freshSystem({ email: OWNER });
  const run = env.newExecution();
  run.gas.Repo.withLock(() => {
    const t = run.gas.Repo.table('NguoiDung');
    t.set(0, 'Trạng thái', 'Khóa');
    t.set(0, 'Vai trò', 'Chỉ xem');
    t.flush();
  });
  env.newExecution().gas.setup();
  const users = rawObjects(env, 'NguoiDung');
  assert.equal(users.length, 1);
  assert.equal(users[0]['Vai trò'], 'Admin');
  assert.equal(users[0]['Trạng thái'], 'Hoạt động');
});

test('Nâng cấp từ cấu trúc đời cũ chạy đúng thứ tự, tiếp tục đúng chỗ khi bị dừng giữa chừng', () => {
  const { env } = freshSystem();
  const order = [];
  let failV3 = true;

  const run = env.newExecution();
  const g = run.gas;
  const step1 = g.Migrations.STEPS[0];
  const steps = [
    {
      version: 3,
      description: 'Bước 3 dùng cột của bước 2',
      run(ss) {
        const headers = ss.getSheetByName('ThietBi').getRange(1, 1, 1, ss.getSheetByName('ThietBi').getLastColumn()).getValues()[0];
        assert.ok(headers.includes('Cột thử v2'), 'bước 2 phải chạy trước bước 3');
        if (failV3) throw new Error('dừng giữa chừng');
        order.push(3);
      }
    },
    step1,
    {
      version: 2,
      description: 'Thêm cột thử',
      run(ss) {
        const def = g.Config.sheet('ThietBi');
        g.Migrations.ensureSheet(ss, { name: 'ThietBi', fixedColumns: 9, cols: def.cols.concat([{ name: 'Cột thử v2', type: 'T' }]) });
        order.push(2);
      }
    }
  ];

  assert.throws(() => g.Setup.run(steps), /dừng giữa chừng/);
  assert.deepEqual(order, [2]);
  assert.equal(env.newExecution().gas.Migrations.currentVersion(env.spreadsheet()), 2, 'đã ghi version sau bước 2');

  failV3 = false;
  const summary = plain(env.newExecution().gas.Setup.run(steps));
  assert.deepEqual(summary.stepsRan, [3]);
  assert.equal(summary.schemaFrom, 2);
  assert.equal(summary.schemaTo, 3);
  assert.deepEqual(order, [2, 3]);
  assert.equal(rawValues(env, 'ThietBi')[0].filter((h) => h === 'Cột thử v2').length, 1);

  const again = plain(env.newExecution().gas.Setup.run(steps));
  assert.deepEqual(again.stepsRan, []);
});

test('Trùng số bước nâng cấp bị từ chối', () => {
  const { gas, env } = loadGas();
  gas.setup();
  const g = env.newExecution().gas;
  const s = g.Migrations.STEPS[0];
  assert.throws(() => g.Migrations.run(env.spreadsheet(), [s, s]), /Trùng số bước/);
});

test('setup() thêm lại cột bị xóa nhầm, giữ dữ liệu', () => {
  const { env } = freshSystem();
  const sh = env.spreadsheet().getSheetByName('NguoiDung');
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('Phiên hợp lệ từ') + 1;
  sh.getRange(1, col).setValue('');
  const summary = plain(env.newExecution().gas.setup());
  assert.ok(summary.repaired.includes('NguoiDung.Phiên hợp lệ từ'));
  const after = rawValues(env, 'NguoiDung');
  assert.equal(after[0].filter((h) => h === 'Phiên hợp lệ từ').length, 1);
  assert.equal(after[1][0], 'chu.so.huu@example.com');
});

test('Cột 1–9 của ThietBi sai thứ tự thì setup() dừng và báo rõ', () => {
  const { env } = freshSystem();
  const sh = env.spreadsheet().getSheetByName('ThietBi');
  sh.getRange(1, 3, 1, 2).setValues([['Số serie', 'Mã TB']]);
  assert.throws(() => env.newExecution().gas.setup(), /cột 3 phải là "Mã TB"/);
});

test('setup() không lấy được khóa thì báo BUSY và không tạo gì', () => {
  const { gas, env } = loadGas();
  env.state.lock.alwaysFail = true;
  assert.throws(() => gas.setup(), (e) => e.code === 'BUSY');
  assert.equal(env.props.SHEET_ID, undefined);
  assert.equal(env.state.spreadsheets.size, 0);
});

test('setup() dùng lại thư mục Drive khai báo sẵn; mã thư mục sai thì báo rõ', () => {
  const { gas, env } = loadGas();
  const folder = gas.DriveApp.createFolder('Thư mục có sẵn');
  env.props.DRIVE_FOLDER_ID = folder.getId();
  gas.setup();
  assert.equal(env.drive.records.get(env.props.SHEET_ID).parent, folder.getId());

  const other = loadGas();
  other.env.props.DRIVE_FOLDER_ID = 'khong_ton_tai';
  assert.throws(() => other.gas.setup(), /DRIVE_FOLDER_ID/);
});
