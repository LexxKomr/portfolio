import { fixPreviewLinks, loadData, applyTheme, t, esc, icon, url, renderHeader, bindLang, setMeta, visibleWorks, sorted, STAR_D } from './common.js';

const app = document.getElementById('app');
let data;
let intro = true;
let activeCat = 'all';

// какие направления из блока «Что я делаю» ведут в какую категорию работ
const ICON_CAT = { brand: 'brand', print: 'print', banner: 'digital', motion: 'motion', ui: 'uiux', stand: 'expo' };
const sparkle = (cls = '') => icon('star').replace('<svg', `<svg class="${cls}"`);

main();

async function main() {
  try {
    data = await loadData();
  } catch (e) {
    console.error(e);
    app.innerHTML = '<p class="state">Не удалось загрузить данные. Обновите страницу. / Couldn’t load the data. Please refresh.</p>';
    return;
  }
  applyTheme(data.site.theme);
  render();
}

function render() {
  const { site, works } = data;
  const list = visibleWorks(works);
  const s = site.sections;
  setMeta(site);

  app.innerHTML = `
    ${renderHeader(site, { home: true })}
    <main id="main"${intro ? ' class="intro"' : ''}>
      <div class="hero-band"><div class="wrap">${hero(site)}</div></div>
      <div class="lower"><div class="lower-in">
        ${s.about ? aboutBlock(site) : ''}
        ${s.work ? workPanel(site, works, list) : ''}
        ${s.cta ? ctaBlock(site) : ''}
        ${s.skills ? skillsPanel(site, works, list) : ''}
      </div></div>
      ${s.contact ? contactBand(site) : ''}
      <div class="thanks-band">${esc(t(site.contact.thanks))}</div>
    </main>`;

  intro = false;
  bindLang(render);
  bindWork();
  fixPreviewLinks();
}

/* ---------- первый экран ---------- */
function titleLine2(text) {
  const chars = [...text];
  const last = chars.pop() || '';
  if (!/[oOоО0]/.test(last)) return esc(text);
  return `${esc(chars.join(''))}<span class="o">${esc(last)}${sparkle()}</span>`;
}

function hero(site) {
  const h = site.hero;
  const p = site.person;
  const nameParts = t(p.name).trim().split(/\s+/);
  const nameHtml = nameParts.length > 1 ? `${esc(nameParts.slice(0, -1).join(' '))}<br>${esc(nameParts.at(-1))}` : esc(nameParts[0] || '');
  const photo = p.photo ? url(p.photo) : '';
  const asArch = p.photoMode === 'arch';
  return `
  <section class="hero" id="top">
    <div class="hero-copy">
      <h1 class="hero-title" aria-label="${esc(t(h.line1) + t(h.line2))}">
        <span class="ln" aria-hidden="true"><span>${esc(t(h.line1))}</span></span>
        <span class="ln" aria-hidden="true"><span>${titleLine2(t(h.line2))}</span></span>
      </h1>
      <div class="hero-meta">
        <span class="pill-role">${esc(t(p.role))}${icon('globe')}</span>
        <p class="script">${esc(t(h.tagline))}</p>
        ${site.sections.work ? `<a class="btn" href="#work">${esc(t(h.cta))}</a>` : ''}
      </div>
    </div>
    <div class="hero-art">
      <span class="dome"></span>
      <span class="arch">${photo && asArch ? `<img src="${esc(photo)}" alt="${esc(t(p.name))}" fetchpriority="high">` : ''}</span>
      <span class="quarter"></span>
      ${photo && !asArch ? `<img class="person" src="${esc(photo)}" alt="${esc(t(p.name))}" fetchpriority="high">` : ''}
      ${sparkle('spark')}${sparkle('spark small')}
      <span class="name-pill"><span>${nameHtml}</span>${sparkle()}</span>
    </div>
  </section>`;
}

/* ---------- обо мне ---------- */
function aboutBlock(site) {
  const a = site.about;
  return `
  <section class="about" id="about" aria-labelledby="about-h"><div class="about-in">
    <h2 class="sec-title" id="about-h">${esc(t(site.ui.menuAbout))}</h2>
    <p class="about-lead">${esc(t(a.title))}</p>
    <p class="about-text">${esc(t(a.text))}</p>
    <div class="pillars">
      ${a.pillars.map((p) => `<div class="pillar">${icon(p.icon)}<strong>${esc(t(p.title))}</strong><span>${esc(t(p.text))}</span></div>`).join('')}
    </div>
  </div></section>`;
}

/* ---------- работы ---------- */
function workPanel(site, works, list) {
  const cats = sorted(works.categories).filter((c) => list.some((w) => w.category === c.id));
  return `
  <section class="panel-work" id="work" aria-labelledby="work-h">
    <h2 class="sec-title" id="work-h">${sparkle()}${esc(t(site.work.title))}</h2>
    <div class="chips" role="group" aria-label="${esc(t(site.work.title))}">
      <button class="chip" type="button" data-cat="all" aria-pressed="${activeCat === 'all'}">${esc(t(site.work.all))}</button>
      ${cats.map((c) => `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="${activeCat === c.id}">${esc(t(c.title))}</button>`).join('')}
    </div>
    <div class="wgrid" id="grid">${cards(works, list)}</div>
    <p class="work-note">${esc(t(site.work.note))}</p>
  </section>`;
}

function cards(works, list) {
  const cat = (id) => works.categories.find((c) => c.id === id);
  return list
    .filter((w) => activeCat === 'all' || w.category === activeCat)
    .map((w) => `
      <a class="card" href="work.html?slug=${encodeURIComponent(w.slug)}">
        <span class="tile"><img src="${esc(url(w.cover))}" alt="${esc(t(w.title))}" loading="lazy" decoding="async"${w.coverW ? ` width="${w.coverW}" height="${w.coverH}"` : ''}></span>
        <span class="cap"><strong>${esc(t(w.title))}</strong><span>${esc(t(cat(w.category)?.title))}, ${esc(w.year)}</span></span>
      </a>`)
    .join('');
}

function setCategory(id, { scroll = false } = {}) {
  activeCat = id;
  document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cat === id)));
  document.getElementById('grid').innerHTML = cards(data.works, visibleWorks(data.works));
  fixPreviewLinks();
  if (scroll) document.getElementById('work').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindWork() {
  document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => setCategory(b.dataset.cat)));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => setCategory(b.dataset.go, { scroll: true })));
}

/* ---------- призыв ---------- */
function ctaBlock(site) {
  const c = site.cta;
  return `
  <section class="cta" aria-label="${esc(t(c.title))}">
    <a class="cta-arch" href="#contact">
      <span class="badge-ico">${icon('sun')}</span>
      <h3>${esc(t(c.title))}</h3>
      <span class="script">${esc(t(c.script))}</span>
      <p>${esc(t(c.text))}</p>
      ${sparkle('spark')}
    </a>
  </section>`;
}

/* ---------- услуги ---------- */
function skillsPanel(site, works, list) {
  const s = site.skills;
  const has = (id) => list.some((w) => w.category === id) && works.categories.some((c) => c.id === id);
  return `
  <section class="panel-skills" id="skills" aria-labelledby="skills-h">
    <h2 class="sec-title center" id="skills-h">${esc(t(s.title))}</h2>
    <div class="skills">
      ${s.items.map((i) => {
        const cat = ICON_CAT[i.icon];
        return `<div class="skill">${icon(i.icon)}<strong>${esc(t(i.title))}</strong><span class="d">${esc(t(i.text))}</span>${cat && has(cat) && site.sections.work ? `<button type="button" data-go="${cat}">${esc(t(s.cta))}</button>` : ''}</div>`;
      }).join('')}
    </div>
    <div class="tools"><h3>${esc(t(s.toolsTitle))}</h3>${s.tools.map((x) => `<span class="tool">${esc(x)}</span>`).join('')}</div>
  </section>`;
}

/* ---------- контакты ---------- */
function contactBand(site) {
  const c = site.contact;
  const rows = [];
  if (c.email) rows.push(`<li><a href="mailto:${esc(c.email)}">${icon('mail')}${esc(c.email)}</a></li>`);
  if (c.telegram) rows.push(`<li><a href="https://t.me/${esc(c.telegram.replace(/^@/, ''))}" rel="noopener">${icon('telegram')}${esc(c.telegram.startsWith('@') ? c.telegram : '@' + c.telegram)}</a></li>`);
  if (c.phone) rows.push(`<li><a href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${icon('phone')}${esc(c.phone)}</a></li>`);
  if (c.behance) rows.push(`<li><a href="${esc(c.behance)}" rel="noopener">${icon('behance')}${esc(c.behance.replace(/^https?:\/\//, ''))}</a></li>`);
  if (t(c.location)) rows.push(`<li><div>${icon('pin')}${esc(t(c.location))}</div></li>`);
  const badge = t(c.badge);
  return `
  <section class="contact-band" id="contact" aria-labelledby="contact-h"><div class="wrap contact-in">
    <div>
      <h2 id="contact-h">${esc(t(c.title))}</h2>
      <p class="contact-text">${esc(t(c.text))}</p>
      ${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">${esc(t(c.button))}</a>` : ''}
    </div>
    <ul class="contact-list">${rows.join('')}</ul>
    ${badge ? `<svg class="seal" viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id="seal-path" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>
      <text><textPath href="#seal-path" textLength="468" lengthAdjust="spacing">${esc(badge)}</textPath></text>
      <g transform="translate(100 100) scale(2.4) translate(-12 -12)"><path class="star" d="${STAR_D}"/></g>
    </svg>` : ''}
  </div></section>`;
}
