/**
 * Thành phần giao diện dùng chung: trạng thái đang tải, lỗi kèm Thử lại, rỗng, thông báo nhanh,
 * hộp xác nhận, và chạy thao tác ghi có nút "Gửi lại" dùng đúng requestId cũ (đặc tả mục 10).
 */
import { h, add, clear } from './dom.js?v=0.2.0';
import { S } from './strings.js?v=0.2.0';
import * as api from './api.js?v=0.2.0';

export function loading(el, text = S.loading) {
  clear(el);
  add(el, h('div', { class: 'state state-loading', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), text));
}

export function errorBox(el, err, retry) {
  clear(el);
  add(el, h('div', { class: 'state state-error', role: 'alert' },
    h('p', { text: (err && err.message) || String(err) }),
    retry ? h('button', { class: 'btn', type: 'button', onclick: retry }, S.retry) : null));
}

export function empty(el, text) {
  add(el, h('div', { class: 'state state-empty' }, text));
}

let toastTimer = null;
export function toast(message, kind = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

/** Hộp xác nhận. lines: các dòng mô tả. Trả Promise<boolean>. */
export function confirmDialog(title, lines, okText = S.confirm) {
  return new Promise((resolve) => {
    const dialog = h('dialog', { class: 'dialog' },
      h('h2', { text: title }),
      [].concat(lines || []).map((l) => h('p', { text: l })),
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, S.cancel),
        h('button', { class: 'btn primary', type: 'button', onclick: () => close(true) }, okText)));
    function close(result) {
      dialog.close();
      dialog.remove();
      resolve(result);
    }
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });
    document.body.append(dialog);
    dialog.showModal();
  });
}

/**
 * Chạy một thao tác ghi gắn với nút bấm:
 * - khóa nút trong lúc gửi để tránh bấm hai lần;
 * - lỗi mạng hoặc quá thời gian: giữ nguyên dữ liệu, hiện nút "Gửi lại" dùng đúng requestId cũ;
 * - lỗi khác: hiện thông báo của server.
 * state: đối tượng do màn hình giữ trong bộ nhớ ({ requestId }), để bấm lại vẫn dùng mã cũ.
 */
export async function runWrite({ button, messageEl, state, action, data, onSuccess }) {
  if (button.disabled) return;
  const label = button.textContent;
  button.disabled = true;
  button.textContent = S.loading;
  if (messageEl) clear(messageEl);
  try {
    if (!state.requestId) state.requestId = api.newRequestId();
    const result = await api.write(action, data, state.requestId);
    state.requestId = '';
    button.textContent = label;
    button.disabled = false;
    await onSuccess(result);
  } catch (err) {
    button.disabled = false;
    if (err.retryable) {
      button.textContent = S.resend;
    } else {
      button.textContent = label;
      state.requestId = ''; // server đã từ chối: lần bấm sau là một thao tác mới
    }
    if (messageEl) add(messageEl, h('p', { class: 'msg error', role: 'alert', text: err.message }));
    else toast(err.message, 'error');
  }
}

/** Ô nhập có nhãn. */
export function field(label, input, hint) {
  const id = input.id || `f-${Math.random().toString(36).slice(2, 9)}`;
  input.id = id;
  return h('div', { class: 'field' }, h('label', { for: id, text: label }), input, hint ? h('small', { text: hint }) : null);
}
