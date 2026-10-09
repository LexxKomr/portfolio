// Общие утилиты: данные, язык, тема, иконки, шапка.
export const BASE = new URL('../', import.meta.url); // корень сайта (работает и в подкаталоге GitHub Pages)
// Предпросмотр из админки: данные и ещё не опубликованные картинки приходят через postMessage.
export const isPreview = new URLSearchParams(location.search).has('preview') && window.parent !== window;
let pfBlobs = {};
export const url = (p) => (p ? pfBlobs[p] || new URL(p, BASE).href : '');

function waitForPreview() {
  return new Promise((resolve) => {
    const onMsg = (e) => {
      if (e.origin !== location.origin || e.data?.type !== 'pf-preview') return;
      window.removeEventListener('message', onMsg);
      pfBlobs = e.data.blobs || {};
      resolve({ site: e.data.site, works: e.data.works });
    };
    window.addEventListener('message', onMsg);
    parent.postMessage({ type: 'pf-ready' }, location.origin);
  });
}

/** В режиме предпросмотра внутренние ссылки остаются в предпросмотре. */
export function fixPreviewLinks() {
  if (!isPreview) return;
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel):/.test(href)) return;
    const u = new URL(href, location.href);
    if (u.origin !== location.origin) return;
    u.searchParams.set('preview', '1');
    a.setAttribute('href', u.pathname.split('/').pop() + u.search + u.hash);
  });
}

export async function loadData() {
  if (isPreview) return waitForPreview();
  const get = async (f) => {
    const r = await fetch(url(f), { cache: 'no-cache' });
    if (!r.ok) throw new Error(f + ' ' + r.status);
    return r.json();
  };
  const [site, works] = await Promise.all([get('data/site.json'), get('data/works.json')]);
  return { site, works };
}

// ---------- язык ----------
let lang = 'ru';
try {
  const q = new URLSearchParams(location.search).get('lang');
  const saved = localStorage.getItem('lang');
  if (q === 'en' || q === 'ru') { lang = q; localStorage.setItem('lang', q); }
  else if (saved === 'en' || saved === 'ru') lang = saved;
  else lang = (navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
} catch { /* localStorage может быть недоступен */ }
document.documentElement.lang = lang;
export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  document.documentElement.lang = l;
}
export const t = (o) => (o && typeof o === 'object' ? o[lang] || o.ru || o.en || '' : o ?? '');

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- тема ----------
export function applyTheme(theme = {}) {
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries(theme)) if (/^#[0-9a-f]{3,8}$/i.test(v)) r.setProperty('--' + k, v);
}

// ---------- иконки (24×24, линейные) ----------
export const STAR_D = 'M12 0c.7 6.6 4.9 10.8 12 12-7.1 1.2-11.3 5.4-12 12-.7-6.6-4.9-10.8-12-12C7.1 10.8 11.3 6.6 12 0z';
const I = {
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_D}"/></svg>`,
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  mail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.500 7l8.500 6 8.500-6"/></svg>',
  telegram: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4L3 11l5.500 2L10 19l3-4 4.500 3.500z"/><path d="M8.500 13L21 4"/></svg>',
  phone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
  pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.100 7-11a7 7 0 10-14 0c0 4.900 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/></svg>',
  behance: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h6a3 3 0 010 6H3zm0 6h7a3 3 0 010 6H3zM14 9h6M14 15a3 3 0 006 0 3 3 0 00-6 0z"/></svg>',
  // направления
  sun: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16a6 6 0 0112 0M12 5V3M5.2 9.2L3.8 7.8M18.8 9.2l1.4-1.4M2 16h20M7 20h10"/></svg>',
  system: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.500"/><rect x="14" y="3" width="7" height="7" rx="3.500"/><path d="M3 21l3.500-7L10 21zM14 14h7v7h-7z"/></svg>',
  format: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="12" height="9" rx="1.500"/><rect x="9" y="11" width="12" height="9" rx="1.500"/></svg>',
  print: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4v-7a2 2 0 012-2h12a2 2 0 012 2v7h-3"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>',
  brand: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.600 5.600 6.100.8-4.500 4.200 1.200 6L12 16.600 6.600 19.600l1.200-6L3.300 9.400l6.100-.8z"/></svg>',
  banner: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 12h6M6 14.500h3"/><circle cx="17" cy="12" r="1.800"/></svg>',
  motion: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.500l5.500 3.500-5.500 3.500z"/></svg>',
  ui: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/></svg>',
  stand: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6"/></svg>',
};
export const icon = (n) => I[n] || I.star;

// ---------- шапка ----------
export function renderHeader(site, { home = false } = {}) {
  const ui = site.ui;
  const prefix = home ? '' : url('index.html');
  const name = t(site.person.name);
  const nav = [];
  if (site.sections.work) nav.push(`<a href="${prefix}#work">${esc(t(ui.menuWork))}</a>`);
  if (site.sections.about) nav.push(`<a href="${prefix}#about">${esc(t(ui.menuAbout))}</a>`);
  if (site.sections.skills) nav.push(`<a href="${prefix}#skills">${esc(t(ui.menuSkills))}</a>`);
  if (site.sections.contact) nav.push(`<a href="${prefix}#contact">${esc(t(ui.menuContact))}</a>`);
  return `
  <a class="skip" href="#main">${esc(t(ui.skip))}</a>
  <div class="topbar-wrap"><header class="topbar">
    <a class="brand" href="${home ? '#top' : url('index.html')}">${icon('star')}<span>${esc(name)}</span></a>
    <nav class="nav" aria-label="Main">${nav.join('')}
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="ru" aria-pressed="${getLang() === 'ru'}">RU</button>
        <button type="button" data-lang="en" aria-pressed="${getLang() === 'en'}">EN</button>
      </div>
    </nav>
  </header></div>`;
}

export function bindLang(onChange) {
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.lang === getLang()) return;
      setLang(b.dataset.lang);
      onChange();
    }),
  );
}

export function setMeta(site, extra = {}) {
  const title = extra.title ? `${extra.title} — ${t(site.person.name)}` : t(site.meta.title);
  const desc = extra.description || t(site.meta.description);
  document.title = title;
  const set = (sel, attr, val) => document.head.querySelector(sel)?.setAttribute(attr, val);
  set('meta[name="description"]', 'content', desc);
  set('meta[property="og:title"]', 'content', title);
  set('meta[property="og:description"]', 'content', desc);
  if (extra.image) set('meta[property="og:image"]', 'content', extra.image);
}

export const sorted = (arr) => [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
export const visibleWorks = (works) => sorted(works.works.filter((w) => w.visible !== false));
