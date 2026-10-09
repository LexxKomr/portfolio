// Разделы админки: работы, категории, тексты, оформление, публикация, настройки.
import { h, get, set, toast, confirmBox, promptBox, formDialog, textField, i18nField, checkField, selectField, colorField, stringsField, tagsField, listEditor } from './ui.js';
import * as S from './store.js';
import { state, touched } from './store.js';
import { TEXT_GROUPS, ICONS, DEFAULT_THEME, THEME_LABELS, SECTION_LABELS } from './schema.js';
import * as auth from './auth.js';
import { GH } from './github.js';
import { apiBase } from './screens.js';

const siteUrl = () => new URL('../', location.href).href;
const sortedWorks = () => [...state.works.works].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const catTitle = (id) => state.works.categories.find((c) => c.id === id)?.title?.ru || '—';
const nav = (hash) => { location.hash = hash; };
const page = (title, sub, ...kids) => h('div', { class: 'view' }, h('h1', {}, title), sub && h('p', { class: 'sub' }, sub), ...kids);

/* =============== РАБОТЫ =============== */
export function worksView() {
  const root = page('Работы', 'Порядок здесь — это порядок на сайте. Скрытые работы видны только вам.');
  const list = h('div');
  const draw = () => {
    list.replaceChildren();
    const arr = sortedWorks();
    if (!arr.length) list.append(h('p', { class: 'sub' }, 'Пока нет ни одной работы. Нажмите «Добавить работу».'));
    arr.forEach((w, i) => {
      const cover = w.cover ? h('img', { src: S.previewUrl(w.cover), alt: '' }) : h('span', { class: 'noimg' });
      list.append(h('div', { class: `row${w.visible === false ? ' hidden-work' : ''}` },
        cover,
        h('div', {}, h('strong', {}, w.title.ru || '(без названия)', w.visible === false && h('span', { class: 'pill' }, 'скрыта'), ),
          h('small', {}, `${catTitle(w.category)}, ${w.year || '—'}, материалов: ${w.images.length}`)),
        h('div', { class: 'row-btns' },
          h('button', { class: 'ico', title: 'Выше', disabled: i === 0, onClick: () => move(arr, i, -1) }, '↑'),
          h('button', { class: 'ico', title: 'Ниже', disabled: i === arr.length - 1, onClick: () => move(arr, i, 1) }, '↓'),
          h('button', { class: 'btn small', onClick: () => nav(`#/works/${w.slug}`) }, 'Править'))));
    });
  };
  const move = (arr, i, d) => { S.moveItem(arr, i, d); S.renumber(arr); touched(); draw(); };
  draw();
  root.append(h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', onClick: async () => {
    if (!state.works.categories.length) return toast('Сначала создайте хотя бы одну категорию.', 'err');
    const title = await promptBox('Новая работа', 'Название (по-русски)', '');
    if (!title) return;
    const w = S.newWork(title);
    nav(`#/works/${w.slug}`);
  } }, '+ Добавить работу'), h('a', { class: 'btn', href: siteUrl(), target: '_blank', rel: 'noopener' }, 'Открыть сайт')), list);
  return root;
}


export function workView(slug) {
  const w = state.works.works.find((x) => x.slug === slug);
  if (!w) return page('Работа не найдена', '', h('a', { class: 'btn', href: '#/works' }, 'К списку работ'));
  const root = page(w.title.ru || 'Новая работа', null);
  root.prepend(h('p', { class: 'crumbs' }, h('a', { href: '#/works' }, '← Все работы')));

  const v = h('div', { class: 'card' }, h('h2', {}, 'Показ на сайте'),
    checkField(w, 'visible', 'Показывать на сайте', 'Если выключено, работа не видна посетителям.'));

  const main = h('div', { class: 'card' }, h('h2', {}, 'Основное'),
    i18nField(w, 'title', 'Название'),
    i18nField(w, 'summary', 'Короткое описание под заголовком', { long: true }),
    selectField(w, 'category', 'Категория', state.works.categories.map((c) => [c.id, c.title.ru])),
    textField(w, 'year', 'Год или период', { hint: 'Например, 2025 или 2025–2026.' }),
    i18nField(w, 'client', 'Заказчик'),
    i18nField(w, 'badge', 'Подпись-плашка', { hint: 'Например, «Работа в штате». Можно оставить пустой.' }),
    i18nField(w, 'role', 'Что делали'),
    tagsField(w, 'tags', 'Инструменты'));

  const story = h('div', { class: 'card' }, h('h2', {}, 'История проекта'),
    i18nField(w, 'task', 'Задача', { long: true }), i18nField(w, 'solution', 'Решение', { long: true }));

  const gallery = h('div', { class: 'card' }, h('h2', {}, 'Материалы'));
  const grid = h('div', { class: 'media-grid' });
  const status = h('p', { class: 'hint' });
  const drawGrid = () => {
    grid.replaceChildren();
    w.images.forEach((im, i) => {
      const isVid = im.type === 'video';
      const th = isVid ? im.poster : im.thumb;
      const isCover = w.cover === th;
            grid.append(h('div', { class: 'media' },
        h('div', { class: 'thumb' }, h('img', { src: S.previewUrl(th), alt: '' }), isVid && h('span', { class: 'vid' }, 'видео'),
          h('span', { class: 'flags' }, isCover && h('span', {}, 'обложка'))),
        h('div', { class: 'body' },
          (() => { const i1 = h('input', { class: 'inp', placeholder: 'Подпись (RU)', value: im.alt?.ru || '' }); i1.addEventListener('input', () => { im.alt = { ...im.alt, ru: i1.value }; touched(); }); return i1; })(),
          (() => { const i2 = h('input', { class: 'inp', placeholder: 'Caption (EN)', value: im.alt?.en || '' }); i2.addEventListener('input', () => { im.alt = { ...im.alt, en: i2.value }; touched(); }); return i2; })(),
          h('div', { class: 'media-actions' },
            h('button', { class: 'ico', title: 'Влево', disabled: i === 0, onClick: () => { S.moveItem(w.images, i, -1); touched(); drawGrid(); } }, '←'),
            h('button', { class: 'ico', title: 'Вправо', disabled: i === w.images.length - 1, onClick: () => { S.moveItem(w.images, i, 1); touched(); drawGrid(); } }, '→'),
            h('button', { class: `ico${isCover ? ' on' : ''}`, title: 'Сделать обложкой карточки', onClick: () => { S.setCover(w, im); touched(); drawGrid(); } }, '▣'),
            h('button', { class: 'ico danger', title: 'Удалить', onClick: async () => { if (await confirmBox('Удалить этот материал из работы? Файл будет удалён при публикации.', { ok: 'Удалить', danger: true })) { S.removeImage(w, i); drawGrid(); } } }, '✕')))));
    });
    if (w.cover && !w.images.some((im) => (im.type === 'video' ? im.poster : im.thumb) === w.cover)) {
      grid.append(h('div', { class: 'media' }, h('div', { class: 'thumb' }, h('img', { src: S.previewUrl(w.cover), alt: '' }), h('span', { class: 'flags' }, h('span', {}, 'особая обложка'))),
        h('div', { class: 'body' }, h('p', { class: 'hint' }, 'Обложка собрана отдельно из нескольких материалов.'), h('button', { class: 'btn small', onClick: () => { if (w.images[0]) S.setCover(w, w.images[0]); touched(); drawGrid(); } }, 'Заменить первым материалом'))));
    }
  };
  const drop = h('label', { class: 'drop' }, h('strong', {}, 'Добавить изображения или видео'), h('span', {}, 'Перетащите файлы сюда или нажмите. JPG, PNG, WebP; видео MP4 или WebM до 25 МБ.'),
    h('input', { type: 'file', multiple: true, accept: 'image/*,video/mp4,video/webm' }));
  const upload = async (files) => {
    if (!files.length) return;
    status.textContent = `Обрабатываю файлов: ${files.length}…`;
    const { added, errors } = await S.addImages(w, [...files]);
    errors.forEach((m) => toast(m, 'err'));
    status.textContent = added.length ? `Добавлено: ${added.length}. Не забудьте нажать «Опубликовать».` : '';
    drawGrid();
  };
  drop.querySelector('input').addEventListener('change', (e) => { upload(e.target.files); e.target.value = ''; });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); upload(e.dataTransfer.files); });
  drawGrid();
  gallery.append(grid, drop, status, h('p', { class: 'hint' }, '▣ — обложка карточки в списке работ на главной странице.'));

  const danger = h('div', { class: 'card' }, h('h2', {}, 'Удаление'),
    h('p', { class: 'hint' }, 'Работа и все её файлы будут удалены из репозитория при публикации. До публикации можно отменить через раздел «Публикация».'),
    h('button', { class: 'btn ghost danger-text', onClick: async () => {
      if (await confirmBox(`Удалить работу «${w.title.ru}» вместе со всеми материалами?`, { ok: 'Удалить работу', danger: true })) { S.deleteWork(w.slug); toast('Работа удалена. Изменение вступит в силу после публикации.'); nav('#/works'); }
    } }, 'Удалить работу'));

  root.append(v, main, gallery, story, danger);
  return root;
}

/* =============== КАТЕГОРИИ =============== */
export function categoriesView() {
  const root = page('Категории', 'Категории работ показываются на сайте как фильтры. Пустая категория на сайте не появится.');
  const list = h('div');
  const cats = () => state.works.categories;
  const draw = () => {
    list.replaceChildren();
    cats().forEach((c, i) => {
      const used = state.works.works.filter((w) => w.category === c.id).length;
      list.append(h('div', { class: 'card' },
        i18nField(c, 'title', `Название категории (${used ? `работ: ${used}` : 'пока пусто'})`),
        h('div', { class: 'row-btns', style: 'justify-content:flex-start' },
          h('button', { class: 'ico', disabled: i === 0, title: 'Выше', onClick: () => { S.moveItem(cats(), i, -1); S.renumber(cats()); touched(); draw(); } }, '↑'),
          h('button', { class: 'ico', disabled: i === cats().length - 1, title: 'Ниже', onClick: () => { S.moveItem(cats(), i, 1); S.renumber(cats()); touched(); draw(); } }, '↓'),
          h('button', { class: 'btn small ghost danger-text', disabled: used > 0, title: used ? 'Сначала перенесите работы в другую категорию' : '', onClick: async () => {
            if (await confirmBox(`Удалить категорию «${c.title.ru}»?`, { ok: 'Удалить', danger: true })) { cats().splice(i, 1); S.renumber(cats()); touched(); draw(); }
          } }, 'Удалить'), used > 0 && h('span', { class: 'hint' }, 'Нельзя удалить, пока в ней есть работы.'))));
    });
  };
  draw();
  root.append(h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', onClick: async () => {
    const name = await promptBox('Новая категория', 'Название (по-русски)', '');
    if (!name) return;
    const id = S.uniqueSlug(name, cats().map((c) => c.id));
    cats().push({ id, title: { ru: name, en: '' }, order: cats().length + 1 });
    touched(); draw();
  } }, '+ Добавить категорию')), list);
  return root;
}

/* =============== ТЕКСТЫ =============== */
function parentAndKey(path) {
  const parts = path.split('.');
  const key = parts.pop();
  let o = state.site;
  for (const p of parts) o = o[p] ??= {};
  return [o, key];
}

function fieldNode(f) {
  const [o, key] = parentAndKey(f.path);
  switch (f.t) {
    case 'i18n': return i18nField(o, key, f.label, { hint: f.hint });
    case 'i18n-long': return i18nField(o, key, f.label, { long: true, hint: f.hint });
    case 'text': return textField(o, key, f.label, { type: f.type || 'text', hint: f.hint });
    case 'select': return selectField(o, key, f.label, f.options);
    case 'strings': return stringsField(o, key, f.label);
    case 'photo': return photoField(f);
    case 'list': {
      o[key] ??= [];
      return h('div', { class: 'fld' }, h('span', { class: 'lbl' }, f.label), f.hint && h('span', { class: 'hint' }, f.hint),
        listEditor(o[key], {
          create: f.create, addLabel: f.addLabel, itemTitle: f.itemTitle,
          renderItem: (it) => h('div', {}, f.item.map((sf) => {
            if (sf.t === 'icon') return selectField(it, sf.k, sf.label, ICONS);
            if (sf.t === 'i18n') return i18nField(it, sf.k, sf.label);
            return i18nField(it, sf.k, sf.label, { long: true });
          })),
        }));
    }
    default: return h('p', {}, `Неизвестный тип поля: ${f.t}`);
  }
}

function photoField(f) {
  const wrap = h('div', { class: 'fld' }, h('span', { class: 'lbl' }, f.label));
  const draw = () => {
    wrap.replaceChildren(h('span', { class: 'lbl' }, f.label));
    const cur = state.site.person.photo;
    if (cur) wrap.append(h('img', { class: 'photo-prev', src: S.previewUrl(cur), alt: '' }));
    const input = h('input', { type: 'file', accept: 'image/*' });
    input.addEventListener('change', async () => {
      if (!input.files[0]) return;
      try { await S.setPhoto(input.files[0]); toast('Фото добавлено.'); draw(); } catch (e) { toast(e.message || 'Не удалось обработать фото.', 'err'); }
    });
    wrap.append(h('div', { class: 'row-btns', style: 'justify-content:flex-start' }, h('label', { class: 'btn small' }, cur ? 'Заменить фото' : 'Загрузить фото', input), cur && h('button', { class: 'btn small ghost danger-text', onClick: () => { S.clearPhoto(); draw(); } }, 'Убрать фото')),
      f.hint && h('span', { class: 'hint' }, f.hint));
    input.style.display = 'none';
  };
  draw();
  return wrap;
}

export function textsView(groupId) {
  const g = TEXT_GROUPS.find((x) => x.id === groupId) || TEXT_GROUPS[0];
  return page(g.title, 'Русский и английский тексты редактируются рядом. Пустой английский текст на сайте покажется русским.', h('div', { class: 'card' }, g.fields.map(fieldNode)));
}

/* =============== ОФОРМЛЕНИЕ =============== */
export function designView() {
  const theme = (state.site.theme ??= { ...DEFAULT_THEME });
  const colors = h('div', { class: 'card' }, h('h2', {}, 'Цвета'),
    Object.keys(DEFAULT_THEME).map((k) => colorField(theme, k, THEME_LABELS[k], DEFAULT_THEME[k])),
    h('button', { class: 'btn small', onClick: () => { Object.assign(theme, DEFAULT_THEME); touched(); window.dispatchEvent(new Event('pf-rerender')); } }, 'Вернуть исходные цвета'),
    h('p', { class: 'hint', style: 'margin-top:10px' }, 'Смотрите результат в «Предпросмотре» перед публикацией. Следите за контрастом: светлый текст должен быть читаем на тёмных блоках.'));
  const sections = h('div', { class: 'card' }, h('h2', {}, 'Разделы на главной'),
    Object.entries(SECTION_LABELS).map(([k, label]) => checkField(state.site.sections, k, label)));
  return page('Оформление', 'Цвета и состав страницы.', colors, sections);
}

/* =============== ПУБЛИКАЦИЯ =============== */
export function publishView() {
  const root = page('Публикация', 'Все правки хранятся в этом браузере и попадают на сайт только после нажатия «Опубликовать». Сайт обновляется примерно за минуту.');
  const c = S.changes();
  if (!c.count) { root.append(h('div', { class: 'card' }, h('p', {}, 'Неопубликованных изменений нет. Всё, что вы видите в админке, уже на сайте.'))); return root; }

  const bytes = [...state.pending.values()].reduce((n, b) => n + (b.size || 0), 0);
  const items = [];
  if (c.siteChanged) items.push(h('li', {}, 'Изменены тексты и оформление сайта ', h('code', {}, 'data/site.json')));
  if (c.worksChanged) items.push(h('li', {}, 'Изменён список работ и категорий ', h('code', {}, 'data/works.json')));
  if (c.newFiles.length) items.push(h('li', {}, `Новых файлов: ${c.newFiles.length}, ${(bytes / 1048576).toFixed(1)} МБ`));
  if (c.deletes.length) items.push(h('li', {}, `Файлов к удалению: ${c.deletes.length}`));

  const msg = h('input', { class: 'inp', value: 'Обновление сайта через админку' });
  const bar = h('div', { class: 'progress', hidden: true }, h('i'));
  const out = h('div');
  const btn = h('button', { class: 'btn primary', onClick: () => run(false) }, 'Опубликовать на сайте');
  const revert = h('button', { class: 'btn ghost danger-text', onClick: async () => {
    if (await confirmBox('Все неопубликованные правки будут сброшены. Это нельзя отменить.', { ok: 'Сбросить правки', danger: true })) { S.revertAll(); toast('Правки сброшены.'); nav('#/works'); }
  } }, 'Отменить все правки');

  async function run(force) {
    btn.disabled = true; revert.disabled = true; out.replaceChildren(); bar.hidden = false;
    try {
      await S.publish({ message: msg.value.trim(), force, onProgress: (d, t) => { bar.firstChild.style.width = `${Math.round((d / t) * 100)}%`; } });
      bar.firstChild.style.width = '100%';
      out.replaceChildren(h('div', { class: 'ok-box' }, h('strong', {}, 'Опубликовано.'), h('p', { id: 'pages-st' }, 'GitHub собирает сайт. Обычно это занимает меньше минуты…')),
        h('div', { class: 'toolbar', style: 'margin-top:12px' }, h('a', { class: 'btn', href: siteUrl(), target: '_blank', rel: 'noopener' }, 'Открыть сайт')));
      toast('Изменения отправлены на GitHub.');
      watchPages();
    } catch (e) {
      bar.hidden = true; btn.disabled = false; revert.disabled = false;
      if (e instanceof S.RemoteChanged) {
        if (await confirmBox('Файлы данных в репозитории изменились после того, как вы открыли админку (например, правили сайт в другом месте). Если продолжить, ваша версия заменит их.', { ok: 'Заменить версией из админки', danger: true, title: 'Репозиторий изменился' })) run(true);
      } else {
        out.replaceChildren(h('p', { class: 'err' }, e.message || 'Не удалось опубликовать.'));
      }
    }
  }
  async function watchPages() {
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const el = document.getElementById('pages-st');
      if (!el) return;
      const s = await state.gh.pagesStatus();
      if (s.status === 'built') { el.textContent = 'Сайт обновлён. Если не видите изменений, обновите страницу (Ctrl+F5).'; return; }
      if (s.status === 'errored') { el.textContent = 'GitHub сообщил об ошибке сборки: ' + (s.error || 'смотрите вкладку Actions в репозитории.'); return; }
    }
  }

  root.append(h('div', { class: 'card' }, h('h2', {}, 'Что будет опубликовано'), h('ul', { class: 'changes' }, items),
    h('label', { class: 'fld' }, h('span', { class: 'lbl' }, 'Комментарий к изменению'), msg), bar,
    h('div', { class: 'toolbar', style: 'margin:0' }, btn, revert), out));
  return root;
}

/* =============== НАСТРОЙКИ =============== */
export function settingsView(session, { lock }) {
  const root = page('Настройки', 'Доступ к репозиторию и резервные копии.');
  const r = session.repo;
  root.append(h('div', { class: 'card' }, h('h2', {}, 'Репозиторий'),
    h('p', {}, `${r.owner}/${r.name}, ветка ${r.branch}`),
    h('p', { class: 'hint' }, 'Токен GitHub сохранён в этом браузере в зашифрованном виде.'),
    h('div', { class: 'toolbar', style: 'margin:12px 0 0' },
      h('button', { class: 'btn small', onClick: () => changeToken(session) }, 'Заменить токен'),
      h('button', { class: 'btn small', onClick: changeCreds }, 'Сменить логин и пароль'),
      h('button', { class: 'btn small', onClick: lock }, 'Выйти'))));

  const file = h('input', { type: 'file', accept: 'application/json', style: 'display:none' });
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d.site?.hero || !Array.isArray(d.works?.works)) throw new Error('Это не резервная копия портфолио.');
      if (!(await confirmBox('Текущие правки в админке будут заменены содержимым копии. Картинки из копии не загружаются: используются те, что уже есть в репозитории.', { ok: 'Загрузить копию', danger: true, title: 'Восстановить из копии?' }))) return;
      state.site = d.site; state.works = d.works; touched(); toast('Копия загружена. Проверьте и опубликуйте.');
    } catch (e) { toast(e.message || 'Не удалось прочитать файл.', 'err'); }
  });
  root.append(h('div', { class: 'card' }, h('h2', {}, 'Резервная копия текстов'),
    h('p', { class: 'hint' }, 'Сохраняет тексты, список работ и настройки в один файл. Изображения лежат в репозитории и копируются GitHub.'),
    h('div', { class: 'toolbar', style: 'margin:12px 0 0' },
      h('button', { class: 'btn small', onClick: () => {
        const blob = new Blob([JSON.stringify({ site: state.site, works: state.works, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.append(a); a.click(); a.remove();
      } }, 'Скачать копию'),
      h('label', { class: 'btn small' }, 'Загрузить копию', file)),
    ));
  return root;
}

async function changeCreds() {
  await formDialog('Смена логина и пароля', [
    { label: 'Текущий логин', autocomplete: 'username' }, { label: 'Текущий пароль', type: 'password', autocomplete: 'current-password' },
    { label: 'Новый логин', autocomplete: 'off' }, { label: 'Новый пароль (от 10 символов)', type: 'password', autocomplete: 'new-password' },
  ], async ([login, password, newLogin, newPassword]) => {
    await auth.changeCredentials({ login, password, newLogin, newPassword });
    toast('Логин и пароль изменены.');
    return true;
  });
}

async function changeToken(session) {
  await formDialog('Новый токен GitHub', [
    { label: 'Логин', autocomplete: 'username' }, { label: 'Пароль', type: 'password', autocomplete: 'current-password' }, { label: 'Новый токен', type: 'password' },
  ], async ([login, password, token]) => {
    const r = session.repo;
    await new GH({ token: token.trim(), owner: r.owner, repo: r.name, branch: r.branch, apiBase: apiBase() }).checkAccess();
    const data = await auth.updateSecret({ login, password, patch: { token: token.trim() } });
    state.gh.token = data.token;
    toast('Токен заменён.');
    return true;
  });
}
