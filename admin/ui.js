// Небольшие помощники для построения интерфейса админки без фреймворка.
import { touched } from './store.js';

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
export function set(o, path, val) {
  const ks = path.split('.');
  const last = ks.pop();
  ks.reduce((a, k) => (a[k] ??= {}), o)[last] = val;
}

/* ---------- уведомления и диалоги ---------- */
export function toast(msg, kind = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: `toast ${kind}` }, msg);
  box.append(t);
  setTimeout(() => t.classList.add('out'), kind === 'err' ? 7000 : 3200);
  setTimeout(() => t.remove(), kind === 'err' ? 7600 : 3800);
}

function dialog(build) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'dlg' });
    const close = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    dlg.append(build(close));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export const confirmBox = (text, { ok = 'Да', danger = false, title = 'Подтвердите действие' } = {}) =>
  dialog((close) => h('div', {}, h('h3', {}, title), h('p', {}, text),
    h('div', { class: 'dlg-actions' }, h('button', { class: 'btn ghost', onClick: () => close(false) }, 'Отмена'), h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, onClick: () => close(true) }, ok)))).then(Boolean);

export const promptBox = (title, label, value = '', { ok = 'Создать' } = {}) =>
  dialog((close) => {
    const input = h('input', { type: 'text', value, class: 'inp' });
    const go = () => close(input.value.trim() || null);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    queueMicrotask(() => input.focus());
    return h('div', {}, h('h3', {}, title), h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), input),
      h('div', { class: 'dlg-actions' }, h('button', { class: 'btn ghost', onClick: () => close(null) }, 'Отмена'), h('button', { class: 'btn primary', onClick: go }, ok)));
  });

export const formDialog = (title, fields, submit, { ok = 'Сохранить' } = {}) =>
  dialog((close) => {
    const inputs = fields.map((f) => h('input', { type: f.type || 'text', class: 'inp', autocomplete: f.autocomplete || 'off', value: f.value || '' }));
    const err = h('p', { class: 'err', role: 'alert' });
    const go = async () => {
      err.textContent = '';
      try { close(await submit(inputs.map((i) => i.value))); } catch (e) { err.textContent = e.message; }
    };
    return h('div', {}, h('h3', {}, title),
      fields.map((f, i) => h('label', { class: 'fld' }, h('span', { class: 'lbl' }, f.label), inputs[i])), err,
      h('div', { class: 'dlg-actions' }, h('button', { class: 'btn ghost', onClick: () => close(null) }, 'Отмена'), h('button', { class: 'btn primary', onClick: go }, ok)));
  });

/* ---------- поля ---------- */
const changed = () => touched();

export function textField(obj, key, label, { long = false, hint = '', type = 'text', placeholder = '' } = {}) {
  const el = long ? h('textarea', { class: 'inp', rows: 4 }) : h('input', { class: 'inp', type, placeholder });
  el.value = obj[key] ?? '';
  el.addEventListener('input', () => { obj[key] = el.value; changed(); });
  return h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), el, hint && h('span', { class: 'hint' }, hint));
}

export function i18nField(obj, key, label, { long = false, hint = '' } = {}) {
  obj[key] = obj[key] && typeof obj[key] === 'object' ? obj[key] : { ru: obj[key] || '', en: '' };
  const v = obj[key];
  const mk = (lang) => {
    const el = long ? h('textarea', { class: 'inp', rows: 4 }) : h('input', { class: 'inp', type: 'text' });
    el.value = v[lang] ?? '';
    el.addEventListener('input', () => { v[lang] = el.value; changed(); });
    return h('div', { class: 'pair-in' }, h('span', { class: 'tag' }, lang.toUpperCase()), el);
  };
  return h('div', { class: 'fld' }, h('span', { class: 'lbl' }, label), h('div', { class: 'pair' }, mk('ru'), mk('en')), hint && h('span', { class: 'hint' }, hint));
}

export function checkField(obj, key, label, hint = '') {
  const el = h('input', { type: 'checkbox' });
  el.checked = !!obj[key];
  el.addEventListener('change', () => { obj[key] = el.checked; changed(); });
  return h('label', { class: 'chk' }, el, h('span', {}, label, hint && h('small', {}, hint)));
}

export function selectField(obj, key, label, options, { onChange } = {}) {
  const el = h('select', { class: 'inp' }, options.map(([v, t]) => h('option', { value: v }, t)));
  el.value = obj[key] ?? '';
  el.addEventListener('change', () => { obj[key] = el.value; changed(); onChange?.(el.value); });
  return h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), el);
}

export function colorField(obj, key, label, fallback) {
  const el = h('input', { type: 'color', class: 'color' });
  const hex = h('input', { class: 'inp hex', type: 'text', maxlength: 7 });
  const cur = obj[key] || fallback;
  el.value = cur; hex.value = cur;
  el.addEventListener('input', () => { hex.value = el.value; obj[key] = el.value; changed(); });
  hex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) { el.value = hex.value; obj[key] = hex.value; changed(); } });
  return h('label', { class: 'fld color-fld' }, h('span', { class: 'lbl' }, label), h('span', { class: 'color-row' }, el, hex));
}

export function stringsField(obj, key, label, hint = 'Каждая позиция — с новой строки.') {
  const el = h('textarea', { class: 'inp', rows: 4 });
  el.value = (obj[key] || []).join('\n');
  el.addEventListener('input', () => { obj[key] = el.value.split('\n').map((s) => s.trim()).filter(Boolean); changed(); });
  return h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), el, h('span', { class: 'hint' }, hint));
}

export function tagsField(obj, key, label, hint = 'Через запятую.') {
  const el = h('input', { class: 'inp', type: 'text' });
  el.value = (obj[key] || []).join(', ');
  el.addEventListener('input', () => { obj[key] = el.value.split(',').map((s) => s.trim()).filter(Boolean); changed(); });
  return h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), el, h('span', { class: 'hint' }, hint));
}

/** Редактор списка элементов с кнопками «вверх/вниз/удалить». */
export function listEditor(arr, { renderItem, create, addLabel = 'Добавить', itemTitle = (it, i) => `Элемент ${i + 1}`, onChange = changed }) {
  const root = h('div', { class: 'list-ed' });
  const draw = () => {
    root.replaceChildren();
    arr.forEach((it, i) => {
      const card = h('div', { class: 'list-item' },
        h('div', { class: 'list-head' }, h('strong', {}, itemTitle(it, i)),
          h('span', { class: 'row-btns' },
            h('button', { class: 'ico', type: 'button', title: 'Вверх', disabled: i === 0, onClick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; onChange(); draw(); } }, '↑'),
            h('button', { class: 'ico', type: 'button', title: 'Вниз', disabled: i === arr.length - 1, onClick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; onChange(); draw(); } }, '↓'),
            h('button', { class: 'ico danger', type: 'button', title: 'Удалить', onClick: () => { arr.splice(i, 1); onChange(); draw(); } }, '✕'))),
        renderItem(it, i));
      root.append(card);
    });
    root.append(h('button', { class: 'btn ghost small', type: 'button', onClick: () => { arr.push(create()); onChange(); draw(); } }, '+ ' + addLabel));
  };
  draw();
  return root;
}
