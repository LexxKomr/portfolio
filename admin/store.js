// Состояние админки: данные сайта, ожидающие загрузки файлы, черновик в IndexedDB, публикация.
import { processImage, processPhoto, processVideo } from './images.js';

export const state = {
  gh: null,
  site: null,
  works: null,
  base: { site: '', works: '' }, // сериализованные версии, загруженные из репозитория
  shas: {},                       // sha файлов данных на момент загрузки
  files: [],                      // все файлы репозитория: [{path, sha}]
  pending: new Map(),             // path → Blob (ещё не опубликованы)
  deletes: new Set(),             // path к удалению при публикации
  blobUrls: {},                   // path → blob: URL для предпросмотра
  draftOffer: null,
};

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
let saveTimer;
export function touched() {
  listeners.forEach((f) => f());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 700);
}

const ser = (o) => JSON.stringify(o, null, 2) + '\n';

/* ---------- загрузка ---------- */
export async function load(gh) {
  state.gh = gh;
  const [site, works, head] = await Promise.all([gh.getText('data/site.json'), gh.getText('data/works.json'), gh.getHead()]);
  state.site = JSON.parse(site.text);
  state.works = JSON.parse(works.text);
  state.base = { site: ser(state.site), works: ser(state.works) };
  state.shas = { site: site.sha, works: works.sha };
  state.files = await gh.listFiles(head.treeSha);
  state.pending.clear(); state.deletes.clear(); state.blobUrls = {};
  state.draftOffer = await readDraft();
  if (state.draftOffer && state.draftOffer.baseSha?.site === site.sha && state.draftOffer.baseSha?.works === works.sha && !hasDraftChanges(state.draftOffer)) state.draftOffer = null;
}

/* ---------- изменения ---------- */
export function changes() {
  const siteChanged = ser(state.site) !== state.base.site;
  const worksChanged = ser(state.works) !== state.base.works;
  const newFiles = [...state.pending.keys()];
  const deletes = [...state.deletes];
  return { siteChanged, worksChanged, newFiles, deletes, count: (siteChanged ? 1 : 0) + (worksChanged ? 1 : 0) + newFiles.length + deletes.length };
}

/* ---------- файлы ---------- */
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function addPending(path, blob) {
  state.pending.set(path, blob);
  state.deletes.delete(path);
  state.blobUrls[path] = URL.createObjectURL(blob);
}

export function releasePath(path) {
  if (!path) return;
  if (state.pending.has(path)) {
    state.pending.delete(path);
    URL.revokeObjectURL(state.blobUrls[path]);
    delete state.blobUrls[path];
  } else if (state.files.some((f) => f.path === path)) {
    state.deletes.add(path);
  }
}

export const previewUrl = (path) => state.blobUrls[path] || (path ? new URL('../' + path, location.href).href : '');

export async function addImages(work, fileList) {
  const added = [];
  const errors = [];
  for (const file of fileList) {
    try {
      if (file.type.startsWith('video/')) {
        const v = await processVideo(file);
        const id = newId();
        const base = `assets/works/${work.slug}/u${id}`;
        addPending(`${base}.${v.ext}`, file);
        addPending(`${base}-poster.${v.poster.ext}`, v.poster.blob);
        added.push({ type: 'video', video: `${base}.${v.ext}`, poster: `${base}-poster.${v.poster.ext}`, w: v.w, h: v.h, alt: { ru: '', en: '' } });
      } else {
        const r = await processImage(file);
        const id = newId();
        const base = `assets/works/${work.slug}/u${id}`;
        addPending(`${base}-full.${r.full.ext}`, r.full.blob);
        addPending(`${base}-thumb.${r.thumb.ext}`, r.thumb.blob);
        added.push({ type: 'image', thumb: `${base}-thumb.${r.thumb.ext}`, full: `${base}-full.${r.full.ext}`, w: r.w, h: r.h, alt: { ru: '', en: '' } });
      }
    } catch (e) {
      errors.push(e.message || String(e));
    }
  }
  work.images.push(...added);
  if (!work.cover && added.length) setCover(work, added[0]);
  touched();
  return { added, errors };
}

export function setCover(work, im) {
  work.cover = im.type === 'video' ? im.poster : im.thumb;
  work.coverW = im.w; work.coverH = im.h;
}

export function removeImage(work, idx) {
  const [im] = work.images.splice(idx, 1);
  const paths = im.type === 'video' ? [im.video, im.poster] : [im.thumb, im.full];
  const usedElsewhere = (p) => work.images.some((o) => [o.thumb, o.full, o.video, o.poster].includes(p));
  paths.filter((p) => !usedElsewhere(p)).forEach((p) => {
    if (work.hero === p) work.hero = '';
    if (work.cover === p) work.cover = '';
    if (!usedElsewhere(p)) releasePath(p);
  });
  if (!work.cover && work.images[0]) setCover(work, work.images[0]);
  touched();
}

export function deleteWork(slug) {
  const i = state.works.works.findIndex((w) => w.slug === slug);
  if (i < 0) return;
  state.works.works.splice(i, 1);
  const prefix = `assets/works/${slug}/`;
  for (const p of [...state.pending.keys()]) if (p.startsWith(prefix)) releasePath(p);
  for (const f of state.files) if (f.path.startsWith(prefix)) state.deletes.add(f.path);
  touched();
}

export async function setPhoto(file) {
  const r = await processPhoto(file);
  const path = `assets/photo-${newId()}.${r.ext}`;
  if (state.site.person.photo) releasePath(state.site.person.photo);
  addPending(path, r.blob);
  state.site.person.photo = path;
  touched();
}

export function clearPhoto() {
  if (state.site.person.photo) releasePath(state.site.person.photo);
  state.site.person.photo = '';
  touched();
}

/* ---------- создание работ и категорий ---------- */
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export const slugify = (s) => String(s).toLowerCase().replace(/[а-яё]/g, (c) => TR[c] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

export function uniqueSlug(base, taken) {
  let s = slugify(base) || 'work';
  let n = 2;
  const root = s;
  while (taken.includes(s)) s = `${root}-${n++}`;
  return s;
}

export function newWork(title) {
  const slug = uniqueSlug(title, state.works.works.map((w) => w.slug));
  const order = Math.max(0, ...state.works.works.map((w) => w.order || 0)) + 1;
  const w = {
    id: slug, slug, category: state.works.categories[0]?.id || '', year: String(new Date().getFullYear()), order,
    visible: false, featured: false,
    client: { ru: '', en: '' }, badge: { ru: '', en: '' }, role: { ru: '', en: '' }, tags: [],
    title: { ru: title, en: '' }, summary: { ru: '', en: '' }, task: { ru: '', en: '' }, solution: { ru: '', en: '' },
    cover: '', hero: '', heroPos: '50% 30%', coverW: 0, coverH: 0, images: [],
  };
  state.works.works.push(w);
  touched();
  return w;
}

export function moveItem(arr, i, d) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return false;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return true;
}

export function renumber(list) { list.forEach((x, i) => { x.order = i + 1; }); }

/* ---------- черновик (IndexedDB) ---------- */
const DB = 'pf-admin';
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function kv(mode, fn) {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const tx = db.transaction('kv', mode);
      const out = fn(tx.objectStore('kv'));
      tx.oncomplete = () => res(out?.result);
      tx.onerror = () => rej(tx.error);
    });
  } catch { return undefined; }
}
const hasDraftChanges = (d) => ser(d.site) === state.base.site && ser(d.works) === state.base.works && !d.pending?.length && !d.deletes?.length;

async function saveDraft() {
  if (!state.site) return;
  const c = changes();
  if (!c.count) { await kv('readwrite', (s) => s.delete('draft')); return; }
  await kv('readwrite', (s) => s.put({ site: state.site, works: state.works, pending: [...state.pending], deletes: [...state.deletes], baseSha: state.shas, savedAt: Date.now() }, 'draft'));
}
async function readDraft() { return kv('readonly', (s) => s.get('draft')); }

export function restoreDraft() {
  const d = state.draftOffer;
  if (!d) return;
  state.site = d.site; state.works = d.works;
  for (const [p, b] of d.pending || []) addPending(p, b);
  state.deletes = new Set(d.deletes || []);
  state.draftOffer = null;
  touched();
}
export async function discardDraft() { state.draftOffer = null; await kv('readwrite', (s) => s.delete('draft')); }

export function revertAll() {
  state.site = JSON.parse(state.base.site);
  state.works = JSON.parse(state.base.works);
  for (const p of [...state.pending.keys()]) releasePath(p);
  state.deletes.clear();
  touched();
}

/* ---------- публикация ---------- */
export class RemoteChanged extends Error {}

export async function publish({ message, force = false, onProgress }) {
  const gh = state.gh;
  const c = changes();
  if (!c.count) throw new Error('Нечего публиковать.');

  if (!force) {
    const [s, w] = await Promise.all([gh.getText('data/site.json'), gh.getText('data/works.json')]);
    if (s.sha !== state.shas.site || w.sha !== state.shas.works) throw new RemoteChanged('Данные в репозитории изменились после того, как вы открыли админку.');
  }

  const files = [];
  if (c.siteChanged) files.push({ path: 'data/site.json', text: ser(state.site) });
  if (c.worksChanged) files.push({ path: 'data/works.json', text: ser(state.works) });
  for (const [path, blob] of state.pending) files.push({ path, blob });

  await gh.publish({ files, deletes: c.deletes, message: message || 'Обновление сайта через админку', onProgress });

  // фиксируем новое базовое состояние
  state.base = { site: ser(state.site), works: ser(state.works) };
  const [s, w, head] = await Promise.all([gh.getText('data/site.json'), gh.getText('data/works.json'), gh.getHead()]);
  state.shas = { site: s.sha, works: w.sha };
  state.files = await gh.listFiles(head.treeSha);
  state.pending.clear(); state.deletes.clear();
  await kv('readwrite', (st) => st.delete('draft'));
  touched();
}

/* ---------- предпросмотр ---------- */
export const previewPayload = () => ({ type: 'pf-preview', site: state.site, works: state.works, blobs: { ...state.blobUrls } });
