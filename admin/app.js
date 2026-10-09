// Точка входа админки: вход → загрузка данных → оболочка с разделами.
import * as auth from './auth.js';
import { GH } from './github.js';
import * as S from './store.js';
import { state } from './store.js';
import { h, confirmBox } from './ui.js';
import { setupScreen, loginScreen, errorScreen, apiBase } from './screens.js';
import { worksView, workView, categoriesView, textsView, designView, publishView, settingsView } from './views.js';
import { TEXT_GROUPS } from './schema.js';

const root = document.getElementById('root');
start();

async function start() {
  let session = auth.resume();
  if (!session) session = auth.hasAccount() ? await loginScreen(root) : await setupScreen(root);
  await boot(session);
}

async function boot(session) {
  root.replaceChildren(h('p', { class: 'boot' }, 'Загружаю данные из репозитория…'));
  const r = session.repo;
  const gh = new GH({ token: session.token, owner: r.owner, repo: r.name, branch: r.branch, apiBase: apiBase() });
  try {
    await S.load(gh);
  } catch (e) {
    const actions = [['Повторить', () => boot(session)], ['Выйти', () => lock(), 'ghost']];
    if (e.kind === 'auth' || e.kind === 'perm') actions.unshift(['Заменить токен', () => { auth.logout(); location.hash = '#/settings'; location.reload(); }]);
    return errorScreen(root, 'Не удалось загрузить данные', e.message || String(e), actions);
  }
  if (state.draftOffer) {
    const when = new Date(state.draftOffer.savedAt).toLocaleString('ru-RU');
    const restore = await confirmBox(`Найдены неопубликованные правки от ${when}. Восстановить их?`, { ok: 'Восстановить', title: 'Черновик' });
    if (restore) S.restoreDraft(); else await S.discardDraft();
  }
  mountShell(session);
}

function lock() {
  auth.logout();
  location.hash = '';
  location.reload();
}

/* ---------- оболочка ---------- */
function mountShell(session) {
  const links = [];
  const link = (href, label, extra, cls) => { const a = h('a', { href, class: cls }, label, extra); links.push(a); return a; };
  const badge = h('span', { class: 'badge', hidden: true });
  const side = h('nav', { class: 'side', 'aria-label': 'Разделы' },
    h('span', { class: 'brand-mark', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.7 6.6 4.9 10.8 12 12-7.1 1.2-11.3 5.4-12 12-.7-6.6-4.9-10.8-12-12C7.1 10.8 11.3 6.6 12 0z"/></svg><span>Портфолио</span>' }),
    link('#/works', 'Работы'), link('#/categories', 'Категории'),
    h('span', { class: 'sub', style: 'opacity:.6;padding:8px 12px 2px' }, 'Тексты'),
    TEXT_GROUPS.map((g) => link(`#/texts/${g.id}`, g.title, null, 'sub')),
    link('#/design', 'Оформление'), link('#/publish', 'Публикация', badge), link('#/settings', 'Настройки'),
    h('span', { class: 'grow' }),
    h('a', { href: new URL('../', location.href).href, target: '_blank', rel: 'noopener' }, 'Открыть сайт'),
    h('a', { href: '#', onClick: (e) => { e.preventDefault(); lock(); } }, 'Выйти'));

  const dot = h('span', { class: 'dot' });
  const statusText = h('span');
  const publishBtn = h('a', { class: 'btn primary', href: '#/publish' }, 'Опубликовать');
  const bar = h('header', { class: 'bar' },
    h('div', { style: 'display:flex;gap:12px;align-items:center' }, h('button', { class: 'btn small menu-btn', 'aria-label': 'Меню', onClick: () => side.classList.toggle('open') }, '☰'), h('span', { class: 'status' }, dot, statusText)),
    h('div', { class: 'bar-actions' }, h('button', { class: 'btn', onClick: openPreview }, 'Предпросмотр'), publishBtn));
  const view = h('main', { id: 'view-root' });
  root.replaceChildren(h('div', { class: 'shell' }, side, h('div', { class: 'main' }, bar, view)));

  const refreshStatus = () => {
    const c = S.changes();
    dot.classList.toggle('dirty', c.count > 0);
    statusText.textContent = c.count ? `Неопубликованных изменений: ${c.count}` : 'Все изменения опубликованы';
    badge.hidden = !c.count; badge.textContent = c.count;
    publishBtn.textContent = c.count ? `Опубликовать (${c.count})` : 'Опубликовать';
  };
  S.onChange(refreshStatus);
  refreshStatus();

  function route() {
    const [, sec = 'works', arg] = location.hash.replace(/^#/, '').split('/');
    let node;
    let current = `#/${sec}`;
    if (sec === 'works') { node = arg ? workView(decodeURIComponent(arg)) : worksView(); current = '#/works'; }
    else if (sec === 'categories') node = categoriesView();
    else if (sec === 'texts') { node = textsView(arg); current = `#/texts/${arg || TEXT_GROUPS[0].id}`; }
    else if (sec === 'design') node = designView();
    else if (sec === 'publish') node = publishView();
    else if (sec === 'settings') node = settingsView(session, { lock });
    else { node = worksView(); current = '#/works'; }
    view.replaceChildren(node);
    links.forEach((a) => (a.getAttribute('href') === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    side.classList.remove('open');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('pf-rerender', route);
  route();

  /* автоблокировка при бездействии */
  let last = 0;
  const bump = () => { const n = Date.now(); if (n - last > 5000) { last = n; auth.touch(); } };
  ['click', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
  setInterval(() => { if (auth.idleExpired()) lock(); }, 30000);
  window.addEventListener('beforeunload', (e) => { if (S.changes().count) { e.preventDefault(); e.returnValue = ''; } });
}

/* ---------- предпросмотр ---------- */
function openPreview() {
  const dlg = h('dialog', { class: 'preview' });
  const frame = h('iframe', { title: 'Предпросмотр сайта' });
  const stage = h('div', { class: 'preview-stage' }, frame);
  const pages = h('select', { 'aria-label': 'Страница' }, h('option', { value: 'index.html?preview=1' }, 'Главная'),
    [...state.works.works].filter((w) => w.visible !== false).sort((a, b) => a.order - b.order).map((w) => h('option', { value: `work.html?slug=${encodeURIComponent(w.slug)}&preview=1` }, w.title.ru || w.slug)));
  const load = () => { frame.src = new URL('../' + pages.value, location.href).href; };
  pages.addEventListener('change', load);
  const bDesk = h('button', { class: 'btn on', onClick: () => { stage.classList.remove('phone'); bDesk.classList.add('on'); bPhone.classList.remove('on'); } }, 'Компьютер');
  const bPhone = h('button', { class: 'btn', onClick: () => { stage.classList.add('phone'); bPhone.classList.add('on'); bDesk.classList.remove('on'); } }, 'Телефон');
  const onMsg = (e) => { if (e.origin === location.origin && e.data?.type === 'pf-ready' && e.source) e.source.postMessage(S.previewPayload(), location.origin); };
  const close = () => { window.removeEventListener('message', onMsg); dlg.close(); dlg.remove(); };
  window.addEventListener('message', onMsg);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.append(h('div', { class: 'preview-bar' }, bDesk, bPhone, pages, h('button', { class: 'btn', onClick: () => frame.contentWindow.location.reload() }, 'Обновить'),
    h('span', { style: 'flex:1' }), h('small', {}, 'Так сайт выглядит с вашими правками. Скрытые работы здесь не видны.'), h('button', { class: 'btn', onClick: close }, 'Закрыть')), stage);
  document.body.append(dlg);
  dlg.showModal();
  load();
}
