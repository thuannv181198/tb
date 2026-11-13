/**
 * Đăng nhập khu vực quản lý bằng Google Identity Services (đặc tả mục 3).
 * Trình duyệt chỉ gửi ID token lên server; server xác minh và cấp mã phiên 12 giờ.
 * Mã phiên lưu ở localStorage (qltb.session) để tab mới mở từ camera vẫn còn đăng nhập.
 */
import { CONFIG } from '../config.js?v=0.2.0';
import { h, add, clear } from './dom.js?v=0.2.0';
import { S } from './strings.js?v=0.2.0';
import * as api from './api.js?v=0.2.0';
import * as store from './store.js?v=0.2.0';
import { field } from './ui.js?v=0.2.0';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise = null;

export function getSession() {
  const s = store.get('session');
  if (!s || !s.token || !s.expiresAt) return null;
  if (Date.parse(s.expiresAt) <= Date.now()) {
    store.remove('session');
    return null;
  }
  return s;
}

export function clearSession() {
  store.remove('session');
}

function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { gisPromise = null; reject(new Error(S.loginGisFailed)); };
      document.head.append(s);
    });
  }
  return gisPromise;
}

async function exchange(idToken) {
  const data = await api.read('auth.login', { idToken });
  store.set('session', { token: data.session, expiresAt: data.expiresAt, email: data.user.email });
  return data.user;
}

/**
 * Vẽ khung đăng nhập vào el. onSuccess(user) được gọi sau khi có mã phiên.
 * Trên máy phát triển (CONFIG.DEV_LOGIN) có thêm ô đăng nhập thử; server thật không chấp nhận mã này.
 */
export function renderLogin(el, onSuccess) {
  clear(el);
  const message = h('div', { class: 'msg-area', 'aria-live': 'polite' });
  const buttonHost = h('div', { class: 'gis-button' });
  add(el, h('section', { class: 'card login' },
    h('h1', { text: S.loginTitle }),
    h('p', { class: 'muted', text: S.loginHint }),
    buttonHost,
    message));

  function showError(text) {
    clear(message);
    add(message, h('p', { class: 'msg error', role: 'alert', text }));
  }

  async function handleToken(idToken) {
    clear(message);
    add(message, h('p', { class: 'muted', text: S.loading }));
    try {
      const user = await exchange(idToken);
      clear(message);
      onSuccess(user);
    } catch (err) {
      showError(err.message || S.loginFailed);
    }
  }

  if (CONFIG.DEV_LOGIN) {
    const email = h('input', { type: 'email', autocomplete: 'off', placeholder: 'admin.dev@gmail.com', value: 'admin.dev@gmail.com' });
    add(el, h('section', { class: 'card dev' },
      h('h2', { text: S.devLogin }),
      field('Email', email),
      h('button', { class: 'btn', type: 'button', onclick: () => handleToken('dev:' + email.value.trim()) }, S.loginManager)));
  }

  if (!CONFIG.CLIENT_ID) {
    if (!CONFIG.DEV_LOGIN) showError(S.loginNoClientId);
    return;
  }
  loadGis().then(() => {
    window.google.accounts.id.initialize({
      client_id: CONFIG.CLIENT_ID,
      callback: (resp) => handleToken(resp.credential),
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: true
    });
    window.google.accounts.id.renderButton(buttonHost, {
      type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'vi', width: 280
    });
  }).catch((err) => showError(err.message));
}

/** Đăng xuất: báo server ghi nhật ký (không bắt buộc thành công), rồi xóa mã phiên trên máy. */
export async function logout() {
  try {
    await api.read('auth.logout', {});
  } catch {
    // Mất mạng vẫn xóa phiên trên máy
  }
  clearSession();
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}
