/**
 * Khu vực quản lý: các màn hình khung của M1 và trang "Thêm" theo vai trò.
 */
import { h, add } from '../dom.js?v=0.2.0';
import { S } from '../strings.js?v=0.2.0';
import { VERSION } from '../version.js?v=0.2.0';
import { empty, confirmDialog } from '../ui.js?v=0.2.0';

const MORE_ROLES = {
  giaotructiep: ['Admin', 'Quản lý'],
  buoi: ['Admin', 'Quản lý'],
  nhaphang: ['Admin'],
  kiemke: ['Admin', 'Quản lý'],
  bienban: ['Admin', 'Quản lý', 'Chỉ xem'],
  dieuchuyen: ['Admin', 'Quản lý'],
  dieuchinh: ['Admin', 'Quản lý'],
  taikhoan: ['Admin'],
  cauhinh: ['Admin']
};

export function today(view, { app }) {
  const u = app.boot.user;
  add(view, h('h1', { text: S.navManager.homnay }),
    h('section', { class: 'card' },
      h('p', null, 'Xin chào ', h('strong', { text: u.name || u.email })),
      h('p', { class: 'muted', text: S.roleLabel(u.role, u.email) }),
      h('p', { class: 'muted', text: 'Phiên đăng nhập đến ' + new Date(app.boot.expiresAt).toLocaleString('vi-VN') })));
  empty(view, 'Yêu cầu chờ duyệt, phiếu đến hạn và quá hạn sẽ hiện ở đây. ' + S.comingSoon('M4'));
}

export function borrowed(view) {
  add(view, h('h1', { text: S.navManager.dangmuon }));
  empty(view, S.comingSoon('M4'));
}

export function scan(view) {
  add(view, h('h1', { text: S.navManager.quet }));
  empty(view, S.comingSoon('M4'));
}

export function devices(view) {
  add(view, h('h1', { text: S.navManager.danhsach }));
  empty(view, S.comingSoon('M2'));
}

export function more(view, { app, logout }) {
  const role = app.boot.user.role;
  add(view, h('h1', { text: S.more }));
  const list = h('ul', { class: 'menu' });
  Object.keys(S.moreItems).forEach((key) => {
    if (!MORE_ROLES[key].includes(role)) return;
    const [label, milestone] = S.moreItems[key];
    add(list, h('li', null, milestone
      ? h('span', { class: 'menu-item disabled', 'aria-disabled': 'true' }, label, h('small', { text: S.comingSoon(milestone) }))
      : h('a', { class: 'menu-item', href: `#/${key}` }, label)));
  });
  add(view, list,
    h('section', { class: 'card' },
      h('p', { class: 'muted', text: S.roleLabel(role, app.boot.user.email) }),
      h('button', {
        class: 'btn danger', type: 'button',
        onclick: async () => {
          if (await confirmDialog(S.logout, ['Máy dùng chung ở phòng thực hành: luôn đăng xuất sau khi dùng.'], S.logout)) logout();
        }
      }, S.logout)),
    h('p', { class: 'muted center', text: S.version(VERSION) + ' · máy chủ ' + (app.boot.serverVersion || '?') }));
}
