/**
 * Quản lý tài khoản (Admin): thêm, sửa, khóa, đặt hạn quyền, đăng xuất mọi thiết bị (đặc tả mục 3, 9).
 */
import { h, add, clear } from '../dom.js?v=0.2.0';
import { S } from '../strings.js?v=0.2.0';
import * as api from '../api.js?v=0.2.0';
import { loading, errorBox, empty, toast, confirmDialog, runWrite, field } from '../ui.js?v=0.2.0';

const ROLES = ['Quản lý', 'Chỉ xem', 'Admin'];
const STATUSES = ['Hoạt động', 'Khóa'];

export async function render(view) {
  add(view, h('h1', { text: S.users }));
  const body = h('div');
  add(view, h('button', { class: 'btn primary block', type: 'button', onclick: () => openForm(null) }, S.addUser), body);

  async function load() {
    loading(body);
    try {
      const data = await api.read('user.list', {});
      clear(body);
      const others = data.users.filter((u) => !u.isOwner);
      data.users.forEach((u) => add(body, userCard(u)));
      if (!others.length) empty(body, S.usersEmpty);
    } catch (err) {
      errorBox(body, err, load);
    }
  }

  function userCard(u) {
    const expired = u.expiresOn && u.expiresOn < new Date().toISOString().slice(0, 10);
    return h('article', { class: `card user${u.status === 'Khóa' ? ' locked' : ''}` },
      h('div', { class: 'row between' },
        h('strong', { text: u.name || u.email }),
        h('span', { class: `badge ${u.isOwner ? 'owner' : ''}`, text: u.isOwner ? S.owner : u.role })),
      h('p', { class: 'muted', text: u.email }),
      h('p', { class: 'muted' },
        `${u.status}${u.phone ? ' · ' + u.phone : ''}${u.expiresOn ? ' · hạn quyền ' + u.expiresOn.split('-').reverse().join('/') : ''}${expired ? ' (đã hết hạn)' : ''}`),
      u.isOwner ? null : h('div', { class: 'row wrap' },
        h('button', { class: 'btn small', type: 'button', onclick: () => openForm(u) }, 'Sửa'),
        h('button', { class: 'btn small', type: 'button', onclick: (e) => toggleLock(u, e.currentTarget) }, u.status === 'Khóa' ? S.unlock : S.lock),
        h('button', { class: 'btn small', type: 'button', onclick: (e) => revoke(u, e.currentTarget) }, S.revoke)));
  }

  // Mỗi nút giữ requestId riêng trong bộ nhớ để bấm "Gửi lại" không ghi hai lần
  const pending = new WeakMap();
  function stateFor(button) {
    if (!pending.has(button)) pending.set(button, { requestId: '' });
    return pending.get(button);
  }

  async function toggleLock(u, button) {
    const status = u.status === 'Khóa' ? 'Hoạt động' : 'Khóa';
    const ok = await confirmDialog(status === 'Khóa' ? S.lock : S.unlock, [`${u.email}: ${u.status} → ${status}`]);
    if (!ok) return;
    const data = { email: u.email, name: u.name, role: u.role, phone: u.phone, expiresOn: u.expiresOn, status };
    await runWrite({ button, state: stateFor(button), action: 'user.save', data, onSuccess: () => { toast(S.saved); load(); } });
  }

  async function revoke(u, button) {
    if (!(await confirmDialog(S.revoke, [S.revokeConfirm(u.email)]))) return;
    await runWrite({ button, state: stateFor(button), action: 'user.revokeSessions', data: { email: u.email }, onSuccess: () => toast(S.revoked) });
  }

  function openForm(u) {
    const state = { requestId: '' };
    const email = h('input', { type: 'email', required: true, autocomplete: 'off', value: u ? u.email : '', readonly: u ? true : null });
    const name = h('input', { type: 'text', maxlength: 100, value: u ? u.name : '' });
    const role = h('select', null, ROLES.map((r) => h('option', { value: r, selected: u ? u.role === r : r === 'Quản lý' }, r)));
    const phone = h('input', { type: 'tel', inputmode: 'numeric', maxlength: 15, value: u ? u.phone : '' });
    const expiresOn = h('input', { type: 'date', value: u ? u.expiresOn : '' });
    const status = h('select', null, STATUSES.map((s) => h('option', { value: s, selected: u ? u.status === s : s === 'Hoạt động' }, s)));
    const message = h('div');
    const saveBtn = h('button', { class: 'btn primary', type: 'submit' }, S.save);
    const form = h('form', { class: 'card form', novalidate: true },
      h('h2', { text: u ? S.editUser : S.addUser.replace('+ ', '') }),
      field(S.fields.email, email, 'Chỉ Gmail (@gmail.com) hoặc tên miền khai báo trong Cấu hình.'),
      field(S.fields.name, name),
      field(S.fields.role, role),
      field(S.fields.phone, phone),
      field(S.fields.status, status),
      field(S.fields.expiresOn, expiresOn),
      message,
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => load() }, S.cancel),
        saveBtn));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        email: email.value.trim(), name: name.value.trim(), role: role.value,
        phone: phone.value.trim(), status: status.value, expiresOn: expiresOn.value
      };
      const ok = await confirmDialog(u ? S.editUser : S.addUser.replace('+ ', ''), [`${data.email} – ${data.role} – ${data.status}`]);
      if (!ok) return;
      await runWrite({
        button: saveBtn, messageEl: message, state, action: 'user.save', data,
        onSuccess: () => { toast(S.saved); load(); }
      });
    });
    clear(body);
    add(body, form);
    email.focus();
  }

  load();
}
