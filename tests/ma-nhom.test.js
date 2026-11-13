'use strict';

/** Quy tắc mã nhóm (đặc tả mục 5). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGas, plain } = require('./helpers');

const { gas } = loadGas();
const U = gas.Util;

test('Ví dụ của đặc tả: có dấu và chữ Đ', () => {
  assert.equal(U.groupCodeFromName('Máy khoan cầm tay').code, 'MKCT');
  assert.equal(U.groupCodeFromName('Đồng hồ vạn năng').code, 'DHVN');
  assert.equal(U.groupCodeFromName('đèn đo độ ẩm').code, 'DDDA');
});

test('Khoảng trắng thừa, chữ hoa, chữ thường cho cùng mã và cùng tên chuẩn hóa', () => {
  const a = '  MÁY   khoan  Cầm TAY ';
  assert.equal(U.groupCodeFromName(a).code, 'MKCT');
  assert.equal(U.normalizeName(a), 'máy khoan cầm tay');
});

test('Tên dạng NFC và NFD cho cùng tên chuẩn hóa và cùng mã', () => {
  const nfc = 'Đồng hồ vạn năng'.normalize('NFC');
  const nfd = 'Đồng hồ vạn năng'.normalize('NFD');
  assert.notEqual(nfc, nfd, 'hai chuỗi khác nhau ở mức byte');
  assert.equal(U.normalizeName(nfd), U.normalizeName(nfc));
  assert.equal(U.groupCodeFromName(nfd).code, U.groupCodeFromName(nfc).code);
  assert.equal(U.groupCodeFromName(nfd).code, 'DHVN');
});

test('Từ bắt đầu bằng chữ số lấy chữ số đó; ký tự đặc biệt bị bỏ qua', () => {
  assert.equal(U.groupCodeFromName('Bộ loe ống 1/4').code, 'BLO1');
  assert.equal(U.groupCodeFromName('Ống đồng (Φ6) – 3/8').code, 'OD63');
  assert.equal(U.groupCodeFromName('Kìm - cắt').code, 'KC');
});

test('Mã dài quá 6 ký tự lấy 6 ký tự đầu', () => {
  const r = plain(U.groupCodeFromName('Máy hút chân không hai cấp loại lớn 2 HP'));
  assert.equal(r.code, 'MHCKHC');
  assert.equal(r.full, 'MHCKHCLL2H');
  assert.equal(r.truncated, true);
});

test('Mã ngắn hơn 2 ký tự thì để trống, Admin tự đặt', () => {
  const r = plain(U.groupCodeFromName('Kìm'));
  assert.equal(r.code, '');
  assert.equal(r.tooShort, true);
  assert.equal(U.groupCodeFromName('  ').code, '');
});

test('Trùng mã thì gợi ý thêm chữ cái tiếp theo của từ cuối', () => {
  assert.equal(U.suggestGroupCode('Mỏ cặp', ['MC']), 'MCA');
  assert.equal(U.suggestGroupCode('Máy đo nồng độ', ['MDND']), 'MDNDO');
  assert.equal(U.suggestGroupCode('Mỏ cặp', ['MC', 'MCA']), 'MCAP');
  assert.equal(U.suggestGroupCode('Mỏ cặp', []), 'MC', 'không trùng thì giữ mã gốc');
  assert.equal(U.suggestGroupCode('Mỏ cặp', ['mc']), 'MCA', 'so mã không phân biệt hoa thường');
});

test('Không gợi ý được khi vượt 6 ký tự hoặc hết chữ của từ cuối', () => {
  assert.equal(U.suggestGroupCode('Máy hút chân không hai cấp', ['MHCKHC']), '');
  assert.equal(U.suggestGroupCode('Mỏ cặp', ['MC', 'MCA', 'MCAP']), '');
  assert.equal(U.suggestGroupCode('Kìm', []), '');
});

test('Mã nhóm Admin tự đặt: 2–6 ký tự A–Z, 0–9', () => {
  for (const ok of ['KI', 'KIM', 'MDNDO2', 'A1']) assert.equal(U.isValidGroupCode(ok), true, ok);
  for (const bad of ['K', 'KIMCAT1', 'kim', 'KÌM', 'K-1', '', 'K I']) assert.equal(U.isValidGroupCode(bad), false, bad);
});
