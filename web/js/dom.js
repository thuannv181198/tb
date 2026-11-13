/**
 * Hàm tạo phần tử dùng chung. Không dùng innerHTML hay ghép chuỗi HTML: mọi chữ đưa vào trang
 * đi qua textContent hoặc nút văn bản (đặc tả mục 3, chống XSS).
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = String(value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'value') el.value = value;
    else if (key === 'checked' || key === 'disabled' || key === 'selected') el[key] = Boolean(value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  add(el, ...children);
  return el;
}

/** Thêm con vào phần tử; bỏ qua null, undefined, false; chuỗi và số thành nút văn bản. */
export function add(el, ...children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}
