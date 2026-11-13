/**
 * Cấu hình (Admin): sửa các khóa CauHinh. Chỉ gửi các khóa đã đổi; server kiểm tra lại toàn bộ.
 */
import { h, add, clear } from '../dom.js?v=0.2.0';
import { S } from '../strings.js?v=0.2.0';
import * as api from '../api.js?v=0.2.0';
import { loading, errorBox, toast, confirmDialog, runWrite, field } from '../ui.js?v=0.2.0';

const GROUPS = [
  ['Chung', ['TEN_DON_VI', 'PHONG_MAC_DINH', 'EMAIL_NHAN_THONG_BAO', 'TEN_MIEN_WORKSPACE', 'LIEN_HE_DU_LIEU_CA_NHAN', 'PHIEN_GIO', 'GIO_EMAIL_TONG_HOP']],
  ['Mượn, trả, gia hạn', ['HAN_MUON_NGAY', 'HAN_DE_XUAT_TOI_DA_NGAY', 'NHAC_TRUOC_HAN_NGAY', 'GIA_HAN_TOI_DA_LAN', 'GIA_HAN_TOI_DA_NGAY', 'GIU_CHO_PHUT', 'LAM_MOI_QR_TOI_DA', 'SO_DONG_TOI_DA_YC', 'SO_YC_CHO_DUYET_MOI_SDT']],
  ['Mã truy cập trang công khai', ['MA_TRUY_CAP_BAT', 'MA_TRUY_CAP']],
  ['Biên bản', ['MUC_LAP_BIEN_BAN', 'SO_NHAN_CHUNG_TOI_THIEU']],
  ['Tên hiển thị tình trạng', ['TEN_TT_TOT', 'TEN_TT_HONG_NHE', 'TEN_TT_HONG_NANG', 'TEN_TT_DANG_SUA', 'TEN_TT_CHO_THANH_LY', 'TEN_TT_DA_THANH_LY', 'TEN_TT_MAT', 'TEN_TT_KHAC']]
];

export async function render(view) {
  add(view, h('h1', { text: S.settings }), h('p', { class: 'muted', text: S.settingsHint }));
  const body = h('div');
  add(view, body);

  async function load() {
    loading(body);
    try {
      const data = await api.read('config.get', {});
      show(data);
    } catch (err) {
      errorBox(body, err, load);
    }
  }

  function show(data) {
    clear(body);
    const state = { requestId: '' };
    const inputs = {};
    const listed = new Set(GROUPS.flatMap((g) => g[1]));
    const other = Object.keys(data.values).filter((k) => !listed.has(k));
    const groups = GROUPS.concat([['Giới hạn khác', other]]);
    const form = h('form', { class: 'form', novalidate: true });
    groups.forEach(([title, keys]) => {
      const box = h('fieldset', { class: 'card' }, h('legend', { text: title }));
      keys.forEach((k) => {
        let input;
        if (k === 'MA_TRUY_CAP_BAT') {
          input = h('select', null, ['Không', 'Có'].map((v) => h('option', { value: v, selected: data.values[k] === v }, v)));
        } else {
          input = h('input', { type: 'text', value: data.values[k], inputmode: /^\d+$/.test(data.values[k]) && k !== 'MA_TRUY_CAP' ? 'numeric' : null });
        }
        inputs[k] = input;
        add(box, field(data.descriptions[k] || k, input, k));
      });
      add(form, box);
    });
    const message = h('div');
    const saveBtn = h('button', { class: 'btn primary block', type: 'submit' }, S.save);
    add(form, message, saveBtn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = {};
      Object.keys(inputs).forEach((k) => {
        const v = inputs[k].value.trim();
        if (v !== data.values[k]) values[k] = v;
      });
      const keys = Object.keys(values);
      if (!keys.length) return toast(S.settingsNoChange);
      if (!(await confirmDialog(S.settings, [S.settingsConfirm(keys)]))) return;
      await runWrite({
        button: saveBtn, messageEl: message, state, action: 'config.save', data: { values },
        onSuccess: (result) => { toast(S.saved); show(result); }
      });
    });
    add(body, form);
  }

  load();
}
