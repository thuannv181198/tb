/**
 * Điểm vào của giao diện: điều hướng theo hash (#/tim, #/homnay...), hai khu vực (công khai, quản lý),
 * thanh điều hướng theo vai trò, xử lý mất phiên, dải cảnh báo trình duyệt nhúng.
 * Dữ liệu quản lý chỉ giữ trong bộ nhớ (biến app), không ghi localStorage.
 */
import { h, add, clear } from './dom.js?v=0.2.0';
import { S } from './strings.js?v=0.2.0';
import * as api from './api.js?v=0.2.0';
import * as auth from './auth.js?v=0.2.0';
import * as store from './store.js?v=0.2.0';
import { loading, errorBox, toast } from './ui.js?v=0.2.0';
import { isEmbeddedBrowser, showEmbeddedBanner } from './embedded.js?v=0.2.0';
import * as publicScreens from './screens/public.js?v=0.2.0';
import * as managerScreens from './screens/manager.js?v=0.2.0';
import * as accounts from './screens/taikhoan.js?v=0.2.0';
import * as settings from './screens/cauhinh.js?v=0.2.0';

const ADMIN = 'Admin';
const MANAGER = 'Quản lý';
const VIEWER = 'Chỉ xem';
const ALL = [ADMIN, MANAGER, VIEWER];

/** Trạng thái trong bộ nhớ của tab. */
export const app = {
  boot: null, // kết quả app.bootstrap
  returnTo: '', // màn hình cần quay lại sau khi đăng nhập lại
  embedded: isEmbeddedBrowser()
};

const ROUTES = {
  tim: { area: 'public', render: publicScreens.search },
  gio: { area: 'public', render: publicScreens.cart },
  cuatoi: { area: 'public', render: publicScreens.mine },
  dangnhap: { area: 'login', render: renderLogin },
  qrchan: { area: 'login', render: renderQrGuard },
  homnay: { area: 'manager', roles: ALL, render: managerScreens.today },
  dangmuon: { area: 'manager', roles: ALL, render: managerScreens.borrowed },
  quet: { area: 'manager', roles: [ADMIN, MANAGER], render: managerScreens.scan },
  danhsach: { area: 'manager', roles: ALL, render: managerScreens.devices },
  them: { area: 'manager', roles: ALL, render: managerScreens.more },
  taikhoan: { area: 'manager', roles: [ADMIN], render: accounts.render },
  cauhinh: { area: 'manager', roles: [ADMIN], render: settings.render }
};

const PUBLIC_NAV = ['tim', 'gio', 'cuatoi'];
const MANAGER_NAV = ['homnay', 'dangmuon', 'quet', 'danhsach', 'them'];

function currentRoute() {
  const name = (location.hash.replace(/^#\/?/, '').split('?')[0] || '').trim();
  return ROUTES[name] ? name : '';
}

export function go(name) {
  if (location.hash === `#/${name}`) route();
  else location.hash = `#/${name}`;
}

function role() {
  return app.boot ? app.boot.user.role : '';
}

// ---------- Khung trang ----------

function renderNav(area, active) {
  const nav = document.getElementById('nav');
  clear(nav);
  if (area === 'public') {
    const cartCount = (store.get('cart', []) || []).length;
    PUBLIC_NAV.forEach((name) => {
      const label = S.navPublic[name] + (name === 'gio' && cartCount ? ` (${cartCount})` : '');
      add(nav, navLink(name, label, active));
    });
  } else if (area === 'manager') {
    MANAGER_NAV.forEach((name) => {
      const r = ROUTES[name];
      if (r.roles && !r.roles.includes(role())) return;
      add(nav, navLink(name, S.navManager[name], active, name === 'quet'));
    });
  }
  nav.hidden = !nav.childElementCount;
}

function navLink(name, label, active, big) {
  return h('a', { href: `#/${name}`, class: `nav-item${active === name ? ' active' : ''}${big ? ' big' : ''}`, 'aria-current': active === name ? 'page' : null }, label);
}

function renderTopAction(area) {
  const el = document.getElementById('topbar-action');
  clear(el);
  if (area === 'public' && !app.embedded) {
    const loggedIn = Boolean(auth.getSession());
    add(el, h('a', { class: 'btn small light', href: loggedIn ? '#/homnay' : '#/dangnhap' }, loggedIn ? S.navManager.homnay : S.loginManager));
  } else if (area === 'manager') {
    add(el, h('a', { class: 'btn small light', href: '#/tim' }, S.navPublic.tim));
  }
}

// ---------- Điều hướng ----------

async function ensureBoot() {
  if (app.boot) return app.boot;
  app.boot = await api.read('app.bootstrap', { knownVersion: 0 });
  document.getElementById('unit-name').textContent = app.boot.unitName;
  return app.boot;
}

async function route() {
  const view = document.getElementById('view');
  let name = currentRoute();
  if (!name) {
    name = auth.getSession() ? 'homnay' : 'tim';
    history.replaceState(null, '', `#/${name}`);
  }
  const r = ROUTES[name];

  if (r.area === 'manager') {
    if (!auth.getSession()) {
      app.returnTo = name;
      return go('dangnhap');
    }
    renderTopAction('manager');
    renderNav('manager', name);
    loading(view);
    try {
      await ensureBoot();
    } catch (err) {
      if (!auth.getSession()) return; // mất phiên: đã chuyển sang đăng nhập
      return errorBox(view, err, route);
    }
    renderNav('manager', name);
    if (r.roles && !r.roles.includes(role())) {
      clear(view);
      add(view, h('div', { class: 'state state-error' }, 'Bạn không có quyền mở màn hình này.'));
      return;
    }
  } else {
    renderTopAction(r.area);
    renderNav(r.area, name);
  }
  clear(view);
  await r.render(view, { app, go, role: role(), logout: logoutAndLeave });
  view.focus({ preventScroll: true });
}

function renderLogin(view) {
  if (app.embedded) {
    add(view, h('div', { class: 'state state-error' }, S.embedded));
    return;
  }
  auth.renderLogin(view, async () => {
    app.boot = null;
    const target = app.returnTo || 'homnay';
    app.returnTo = '';
    go(target);
  });
  add(view, h('p', { class: 'center' }, h('a', { href: '#/tim' }, S.backToPublic)));
}

/** Người chưa đăng nhập quét QR thiết bị, bộ/hộp, yêu cầu: chỉ hiện thông báo, không gọi server. */
function renderQrGuard(view) {
  add(view, h('section', { class: 'card center' },
    h('h1', { text: S.qrManagerOnly }),
    app.embedded ? h('p', { text: S.embedded }) : h('a', { class: 'btn primary', href: '#/dangnhap' }, S.loginManager),
    h('p', null, h('a', { href: '#/tim' }, S.backToPublic))));
}

// ---------- Khởi động ----------

api.setSessionLostHandler(() => {
  auth.clearSession();
  app.boot = null;
  const name = currentRoute();
  if (name && ROUTES[name].area === 'manager') app.returnTo = name;
  toast(S.sessionLost, 'error');
  go('dangnhap');
});

export async function logoutAndLeave() {
  await auth.logout();
  app.boot = null;
  toast(S.logoutDone);
  go('tim');
}

function start() {
  if (app.embedded) showEmbeddedBanner(document.getElementById('banner'));
  const params = new URLSearchParams(location.search);
  const scanned = params.get('tb') || params.get('bo') || params.get('yc');
  if (scanned) {
    // Bỏ tham số khỏi thanh địa chỉ để tải lại trang không lặp lại thao tác quét
    history.replaceState(null, '', location.pathname + location.hash);
    if (!auth.getSession()) {
      location.hash = '#/qrchan';
    } else {
      // Mở thẻ thiết bị/yêu cầu sau khi quét có ở M4; tạm vào Hôm nay
      app.returnTo = '';
      location.hash = '#/homnay';
    }
  }
  window.addEventListener('hashchange', route);
  route();
}

start();
