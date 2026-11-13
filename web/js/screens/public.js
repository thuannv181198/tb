/**
 * Khu vực công khai (người mượn, không đăng nhập). Ở M1 mới có khung; nội dung làm ở M3 và M6.
 */
import { h, add } from '../dom.js?v=0.2.0';
import { S } from '../strings.js?v=0.2.0';
import { empty } from '../ui.js?v=0.2.0';

export function search(view) {
  add(view, h('h1', { text: S.navPublic.tim }));
  empty(view, S.publicEmpty);
}

export function cart(view) {
  add(view, h('h1', { text: S.navPublic.gio }));
  empty(view, 'Danh sách mượn đang trống. ' + S.comingSoon('M3'));
}

export function mine(view) {
  add(view, h('h1', { text: S.navPublic.cuatoi }));
  empty(view, 'Chưa có yêu cầu hay phiếu mượn nào trên máy này. ' + S.comingSoon('M3 và M6'));
}
