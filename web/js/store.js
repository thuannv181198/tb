/**
 * localStorage với tiền tố "qltb." (docs/HOP-DONG-DU-LIEU.md mục 8.2). Mọi lần đọc, ghi bọc try/catch:
 * chế độ riêng tư hoặc bị chặn lưu trữ thì app vẫn chạy, chỉ không nhớ được.
 * Khu vực quản lý chỉ lưu mã phiên và tùy chọn giao diện.
 */
const PREFIX = 'qltb.';
const ALLOWED = new Set(['session', 'ui', 'clientId', 'accessCode', 'cart', 'borrower', 'myRequests', 'myLoans']);

function key(name) {
  if (!ALLOWED.has(name)) throw new Error(`Khóa localStorage chưa khai báo: ${name}`);
  return PREFIX + name;
}

export function get(name, fallback = null) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function set(name, value) {
  try {
    // eslint-disable-next-line no-restricted-syntax -- module duy nhất được ghi localStorage
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(name) {
  try {
    localStorage.removeItem(key(name));
  } catch {
    // bỏ qua
  }
}
