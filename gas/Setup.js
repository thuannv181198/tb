/**
 * setup(): người triển khai chạy trong trình soạn thảo Apps Script.
 * Tự tạo (nếu chưa có) Google Sheet, thư mục Drive gốc và 5 thư mục con, các sheet và cột,
 * định dạng, danh sách thả xuống, bảo vệ hàng tiêu đề, dữ liệu ban đầu, khóa SESSION_SECRET.
 * Chạy lại nhiều lần không mất dữ liệu.
 */
function setup() {
  var summary = Setup.run();
  Logger.log(Setup.describe(summary));
  return summary;
}

var Setup = (function () {
  /** steps: chỉ dùng cho kiểm thử nâng cấp; mặc định Migrations.STEPS. */
  function run(steps) {
    return Repo.withLock(function () {
      var props = Repo.props();
      var env = props[Config.PROP.ENV] || '';
      var suffix = env ? '_' + env : '';
      var toSave = {};

      var adminEmail = props[Config.PROP.ADMIN_EMAIL] || Util.normEmail(Session.getEffectiveUser().getEmail());
      if (!adminEmail) throw new Error('Không lấy được email tài khoản đang chạy. Hãy đăng nhập Google rồi chạy lại setup().');
      if (!props[Config.PROP.ADMIN_EMAIL]) toSave[Config.PROP.ADMIN_EMAIL] = adminEmail;

      // Thư mục Drive gốc
      var root;
      if (props[Config.PROP.DRIVE_FOLDER_ID]) {
        root = openFolder(props[Config.PROP.DRIVE_FOLDER_ID], Config.PROP.DRIVE_FOLDER_ID);
      } else {
        root = DriveApp.createFolder('QLTB_DuLieu' + suffix);
        toSave[Config.PROP.DRIVE_FOLDER_ID] = root.getId();
      }
      Config.FOLDERS.forEach(function (f) {
        if (props[f[0]]) {
          openFolder(props[f[0]], f[0]);
        } else {
          toSave[f[0]] = root.createFolder(f[1]).getId();
        }
      });

      // File Google Sheet
      var ss;
      var createdSheet = false;
      if (props[Config.PROP.SHEET_ID]) {
        ss = SpreadsheetApp.openById(props[Config.PROP.SHEET_ID]);
      } else {
        ss = SpreadsheetApp.create('QLTB_DuLieu' + suffix);
        DriveApp.getFileById(ss.getId()).moveTo(root);
        toSave[Config.PROP.SHEET_ID] = ss.getId();
        createdSheet = true;
      }

      if (!props[Config.PROP.SESSION_SECRET]) toSave[Config.PROP.SESSION_SECRET] = newSecret();
      if (!props[Config.PROP.DATA_VERSION]) toSave[Config.PROP.DATA_VERSION] = '1';
      if (Object.keys(toSave).length) Repo.setProps(toSave);

      Repo.useSpreadsheet(ss);
      Repo.clearConfig(); // Admin có thể vừa sửa tay CauHinh
      var migration = Migrations.run(ss, steps);
      // Lưới an toàn: thêm lại sheet hoặc cột bị xóa nhầm bằng tay (không đổi dữ liệu đã có)
      var repaired = [];
      Config.SHEETS.forEach(function (def) {
        var r = Migrations.ensureSheet(ss, def);
        if (r.created) repaired.push(def.name);
        r.added.forEach(function (c) { repaired.push(def.name + '.' + c); });
      });
      Repo.useSpreadsheet(ss);
      var seeded = {
        config: seedConfig(),
        rooms: seedRooms(),
        admin: seedAdmin(adminEmail)
      };
      Repo.useSpreadsheet(ss);
      applyFormats(ss);
      removeDefaultSheet(ss);

      return {
        sheetCreated: createdSheet,
        spreadsheetId: ss.getId(),
        schemaFrom: migration.from,
        schemaTo: migration.to,
        stepsRan: migration.ran,
        repaired: repaired,
        propertiesCreated: Object.keys(toSave).filter(function (k) { return k !== Config.PROP.SESSION_SECRET; })
          .concat(toSave[Config.PROP.SESSION_SECRET] ? ['SESSION_SECRET'] : []),
        seeded: seeded
      };
    }, 30000);
  }

  function openFolder(id, propName) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      throw new Error('Không mở được thư mục Drive ghi trong Script Property ' + propName +
        '. Kiểm tra lại mã thư mục, hoặc xóa thuộc tính này để setup() tạo thư mục mới.', { cause: e });
    }
  }

  /** 64 ký tự hex ngẫu nhiên từ hai UUID ngẫu nhiên. */
  function newSecret() {
    return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  }

  /** Thêm khóa CauHinh còn thiếu; không ghi đè giá trị Admin đã sửa. Trả số khóa đã thêm. */
  function seedConfig() {
    var t = Repo.table('CauHinh');
    var have = {};
    for (var i = 0; i < t.size(); i++) have[Util.str(t.get(i, 'Khóa')).trim()] = true;
    var added = 0;
    Config.CONFIG_DEFAULTS.forEach(function (row) {
      if (!have[row[0]]) {
        t.append({ 'Khóa': row[0], 'Giá trị': row[1], 'Mô tả': row[2] });
        added++;
      }
    });
    t.flush();
    return added;
  }

  /** Phòng ban đầu (mục 4): chỉ thêm khi danh mục phòng đang trống. */
  function seedRooms() {
    var t = Repo.table('DanhMucPhong');
    if (t.size() > 0) return 0;
    var room = Repo.config().PHONG_MAC_DINH || '201-VNB';
    t.append({
      'Mã phòng': room,
      'Tên phòng': room,
      'Trạng thái': Config.ROOM_STATUS.ACTIVE,
      'Ngày bắt đầu': Util.startOfDay(Util.now())
    });
    t.flush();
    return 1;
  }

  /** Tài khoản chủ sở hữu luôn có trong NguoiDung với vai trò Admin. */
  function seedAdmin(adminEmail) {
    var t = Repo.table('NguoiDung');
    var i = t.find('Email', adminEmail, Util.normEmail);
    if (i >= 0) {
      if (t.get(i, 'Vai trò') !== Config.ROLE.ADMIN || t.get(i, 'Trạng thái') !== Config.USER_STATUS.ACTIVE) {
        t.set(i, 'Vai trò', Config.ROLE.ADMIN);
        t.set(i, 'Trạng thái', Config.USER_STATUS.ACTIVE);
        t.flush();
      }
      return 0;
    }
    t.append({
      'Email': adminEmail,
      'Họ tên': 'Quản trị chính',
      'Vai trò': Config.ROLE.ADMIN,
      'Trạng thái': Config.USER_STATUS.ACTIVE,
      'Ngày tạo': Util.now()
    });
    t.flush();
    return 1;
  }

  /**
   * Định dạng cột theo kiểu (văn bản thuần cho mã và chuỗi số), cố định và in đậm hàng
   * tiêu đề, bảo vệ hàng tiêu đề (chỉ cảnh báo), danh sách thả xuống.
   */
  function applyFormats(ss) {
    var statusList = Config.STATUSES.map(function (s) { return Repo.statusNames()[s.code]; });
    Config.SHEETS.forEach(function (def) {
      var sheet = ss.getSheetByName(def.name);
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(Util.str);
      var maxRows = sheet.getMaxRows();
      var types = {};
      def.cols.forEach(function (c) { types[c.name] = c.type; });

      // Gom các cột liền nhau cùng định dạng để giảm số lần gọi
      if (maxRows > 1) {
        var start = -1;
        var current = null;
        for (var c = 0; c <= headers.length; c++) {
          var f = c < headers.length && types[headers[c]] ? Config.FORMAT[types[headers[c]]] : null;
          if (f !== current) {
            if (current) sheet.getRange(2, start + 1, maxRows - 1, c - start).setNumberFormat(current);
            start = c;
            current = f;
          }
        }
      }

      var header = sheet.getRange(1, 1, 1, lastCol);
      header.setFontWeight('bold');
      sheet.setFrozenRows(1);
      var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).filter(function (p) {
        return p.getDescription() === Config.HEADER_PROTECTION;
      });
      if (!protections.length) {
        header.protect().setDescription(Config.HEADER_PROTECTION).setWarningOnly(true);
      }

      Config.VALIDATIONS.concat([{ sheet: 'ThietBi', col: 'Tình trạng', values: statusList }])
        .filter(function (v) { return v.sheet === def.name; })
        .forEach(function (v) {
          var colIndex = headers.indexOf(v.col);
          if (colIndex < 0 || maxRows < 2) return;
          var rule = SpreadsheetApp.newDataValidation().requireValueInList(v.values, true).setAllowInvalid(false).build();
          sheet.getRange(2, colIndex + 1, maxRows - 1, 1).setDataValidation(rule);
        });
    });
  }

  /**
   * Đặt lại danh sách thả xuống cột Tình trạng của ThietBi. list: danh sách tên; bỏ trống thì
   * lấy tên hiển thị hiện tại trong CauHinh.
   */
  function applyStatusValidation(ss, list) {
    var sheet = ss.getSheetByName('ThietBi');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(Util.str);
    var colIndex = headers.indexOf('Tình trạng');
    var maxRows = sheet.getMaxRows();
    if (colIndex < 0 || maxRows < 2) return;
    if (!list) {
      var names = Repo.statusNames();
      list = Config.STATUSES.map(function (s) { return names[s.code]; });
    }
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
    sheet.getRange(2, colIndex + 1, maxRows - 1, 1).setDataValidation(rule);
  }

  /** Xóa trang tính mặc định trống do Google tạo khi tạo file mới. */
  function removeDefaultSheet(ss) {
    var sheets = ss.getSheets();
    if (sheets.length < 2) return;
    sheets.forEach(function (sh) {
      if (Config.DEFAULT_SHEET_NAMES.indexOf(sh.getName()) >= 0 && sh.getLastRow() === 0 && sh.getLastColumn() === 0) {
        ss.deleteSheet(sh);
      }
    });
  }

  function describe(summary) {
    return [
      'Đã chạy setup() thành công.',
      summary.sheetCreated ? 'Đã tạo file Google Sheet mới.' : 'Dùng file Google Sheet đã có.',
      'Cấu trúc dữ liệu: phiên bản ' + summary.schemaFrom + ' → ' + summary.schemaTo +
        (summary.stepsRan.length ? ' (đã chạy bước ' + summary.stepsRan.join(', ') + ')' : ' (không cần nâng cấp)'),
      summary.repaired.length ? 'Đã thêm lại sheet/cột bị thiếu: ' + summary.repaired.join(', ') : 'Đủ sheet và cột.',
      'Script Properties mới: ' + (summary.propertiesCreated.join(', ') || 'không có'),
      'Dữ liệu ban đầu: ' + summary.seeded.config + ' khóa cấu hình, ' + summary.seeded.rooms + ' phòng, ' +
        summary.seeded.admin + ' tài khoản Admin.'
    ].join('\n');
  }

  return {
    run: run,
    applyFormats: applyFormats,
    applyStatusValidation: applyStatusValidation,
    describe: describe
  };
})();
