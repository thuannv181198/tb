/**
 * Phát hiện trình duyệt nhúng của Zalo, Messenger, Facebook, Instagram, LINE, WeChat (đặc tả mục 2, 10):
 * Google chặn đăng nhập trong trình duyệt nhúng và dữ liệu lưu cũng tách biệt.
 */
import { h, add, clear } from './dom.js?v=0.2.0';
import { S } from './strings.js?v=0.2.0';
import { toast } from './ui.js?v=0.2.0';

const EMBEDDED_UA = /(Zalo|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|MicroMessenger)/i;

export function isEmbeddedBrowser(userAgent = navigator.userAgent) {
  return EMBEDDED_UA.test(userAgent || '');
}

export function showEmbeddedBanner(el) {
  clear(el);
  add(el, h('div', { class: 'banner warn', role: 'note' },
    h('span', { text: S.embedded }),
    h('button', {
      class: 'btn small', type: 'button',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          toast(S.copied);
        } catch {
          window.prompt(S.copyLink, location.href);
        }
      }
    }, S.copyLink)));
}
