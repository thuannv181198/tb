'use strict';

const { loadGas } = require('./load-gas');

/** Chuyển giá trị tạo trong vm context sang đối tượng thường để so sánh bằng assert.deepStrictEqual. */
function plain(v) {
  return JSON.parse(JSON.stringify(v));
}

/** Môi trường mới đã chạy setup() một lần. */
function freshSystem(opts = {}) {
  const sys = loadGas(opts);
  sys.gas.setup();
  return sys;
}

/** Đọc toàn bộ giá trị thô của một sheet (gồm hàng tiêu đề) từ bảng tính giả lập. */
function rawValues(env, sheetName) {
  const sh = env.spreadsheet().getSheetByName(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (!lastRow || !lastCol) return [];
  return sh.getRange(1, 1, lastRow, lastCol).getValues();
}

/** Các dòng dữ liệu của sheet dạng đối tượng {tiêu đề: giá trị thô}. */
function rawObjects(env, sheetName) {
  const values = rawValues(env, sheetName);
  if (!values.length) return [];
  const headers = values[0];
  return values.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}

module.exports = { loadGas, plain, freshSystem, rawValues, rawObjects };
