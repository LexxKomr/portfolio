import { fixPreviewLinks, loadData, applyTheme, t, esc, icon, url, renderHeader, bindLang, setMeta, visibleWorks, sorted, getLang } from './common.js';

const app = document.getElementById('app');
let data;
let intro = true;
let slideTimer;
let activeCat = 'all';

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
  setMeta(site);
  clearInterval(slideTimer);

  app.innerHTML = `
    ${renderHeader(site, { home: true })}
    <main id="main" class="page${intro ? ' intro' : ''}">
      ${hero(site, list)}
      ${site.sections.work ? workPanel(site, works, list) : ''}
      ${site.sections.about ? aboutPanel(site, works, list) : ''}
      ${site.sections.skills ? skillsPanel(site) : ''}
      ${site.sections.testimonials && site.testimonials.items.length ? quotesPanel(site) : ''}
      ${site.sections.contact ? contactPanel(site) : ''}
      <p class="thanks">${esc(t(site.contact.thanks))}</p>
    </main>`;

  intro = false;
  bindLang(render);
  bindFilters(list);
  startSlides(site, list);
  fixPreviewLinks();
}

/* ---------- hero ---------- */
function hero(site, list) {
  const h = site.hero;
  const slides = list.filter((w) => w.hero);
  const first = slides[0];
  return `
  <section class="hero" id="top">
    <div class="hero-copy">
      <h1 class="hero-title" aria-label="${esc(t(h.line1) + t(h.line2))}">
        <span class="ln" aria-hidden="true"><span>${esc(t(h.line1))}${icon('star').replace('<svg', '<svg class="star"')}</span></span>
        <span class="ln" aria-hidden="true"><span>${esc(t(h.line2))}</span></span>
      </h1>
      <div class="hero-meta">
        <span class="pill-role">${esc(t(site.person.role))}${icon('globe')}</span>
        <p class="script">${esc(t(h.tagline))}</p>
        ${site.sections.work ? `<a class="btn" href="#work">${esc(t(h.cta))}</a>` : ''}
      </div>
    </div>
    <div class="hero-art">
      <span class="disc"></span><span class="quarter"></span><span class="ring"></span>
      <a class="arch" id="arch" href="${first ? 'work.html?slug=' + encodeURIComponent(first.slug) : '#work'}" aria-live="off">
        ${site.person.photo ? `<img class="slide is-active" src="${esc(url(site.person.photo))}" alt="" style="--pos:50% 20%">` : slides.map((w, i) => `<img class="slide${i === 0 ? ' is-active' : ''}" src="${esc(url(w.hero))}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} style="--pos:${esc(w.heroPos || '50% 30%')}">`).join('')}
        ${first && !site.person.photo ? `<span class="arch-cap"><small>${esc(t(site.ui.currentWork))}</small><strong id="arch-title">${esc(t(first.title))}</strong></span>` : ''}
      </a>
      <span class="name-pill">${icon('star')}${esc(t(site.person.name))}</span>
    </div>
  </section>`;
}

function startSlides(site, list) {
  const slides = list.filter((w) => w.hero);
  const imgs = [...document.querySelectorAll('#arch .slide')];
  if (site.person.photo || imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  const arch = document.getElementById('arch');
  slideTimer = setInterval(() => {
    imgs[i].classList.remove('is-active');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('is-active');
    arch.href = 'work.html?slug=' + encodeURIComponent(slides[i].slug);
    const tt = document.getElementById('arch-title');
    if (tt) tt.textContent = t(slides[i].title);
  }, 4200);
}

/* ---------- работы ---------- */
function workPanel(site, works, list) {
  const cats = sorted(works.categories).filter((c) => list.some((w) => w.category === c.id));
  return `
  <section class="panel panel-work" id="work" aria-labelledby="work-h">
    <div class="work-head">
      <h2 id="work-h">${esc(t(site.work.title))}${icon('star').replace('<svg', '<svg class="star"')}</h2>
      <div class="chips" role="group" aria-label="${esc(t(site.work.title))}">
        <button class="chip" type="button" data-cat="all" aria-pressed="${activeCat === 'all'}">${esc(t(site.work.all))}</button>
        ${cats.map((c) => `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="${activeCat === c.id}">${esc(t(c.title))}</button>`).join('')}
      </div>
    </div>
    <div class="grid" id="grid">${cards(works, list)}</div>
    <p class="work-note">${esc(t(site.work.note))}</p>
  </section>`;
}

function cards(works, list) {
  const cat = (id) => works.categories.find((c) => c.id === id);
  return list
    .filter((w) => activeCat === 'all' || w.category === activeCat)
    .map((w) => {
      const r = Math.min(1.9, Math.max(0.7, (w.coverW || 4) / (w.coverH || 3)));
      return `
      <a class="card" href="work.html?slug=${encodeURIComponent(w.slug)}">
        <span class="card-media" style="aspect-ratio:${r.toFixed(3)}">
          <img src="${esc(url(w.cover))}" alt="${esc(t(w.title))}" loading="lazy" decoding="async">
          <span class="card-chip">${esc(t(cat(w.category)?.title))}</span>
        </span>
        <span class="card-cap"><strong>${esc(t(w.title))}</strong><span>${esc(t(w.client))}, ${esc(w.year)}</span></span>
      </a>`;
    })
    .join('');
}

function bindFilters(list) {
  const grid = document.getElementById('grid');
  document.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      activeCat = b.dataset.cat;
      document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      grid.innerHTML = cards(data.works, list);
    }),
  );
}

/* ---------- обо мне ---------- */
function aboutPanel(site, works, list) {
  const a = site.about;
  const dirs = new Set(list.map((w) => w.category)).size;
  const mats = list.reduce((n, w) => n + w.images.length, 0);
  return `
  <section class="panel panel-about" id="about" aria-labelledby="about-h">
    <div>
      <h2 id="about-h">${esc(t(a.title))}</h2>
      <p class="about-text">${esc(t(a.text))}</p>
      <div class="pillars">
        ${a.pillars.map((p) => `<div class="pillar">${icon(p.icon)}<strong>${esc(t(p.title))}</strong><span>${esc(t(p.text))}</span></div>`).join('')}
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>${list.length}</b><span>${esc(t(a.statLabels.cases))}</span></div>
      <div class="stat"><b>${dirs}</b><span>${esc(t(a.statLabels.directions))}</span></div>
      <div class="stat"><b>${mats}</b><span>${esc(t(a.statLabels.materials))}</span></div>
    </div>
  </section>`;
}

/* ---------- навыки ---------- */
function skillsPanel(site) {
  const s = site.skills;
  return `
  <section class="panel panel-skills" id="skills" aria-labelledby="skills-h">
    <h2 id="skills-h">${esc(t(s.title))}</h2>
    <div class="skills">
      ${s.items.map((i) => `<div class="skill">${icon(i.icon)}<strong>${esc(t(i.title))}</strong><span>${esc(t(i.text))}</span></div>`).join('')}
    </div>
    <div class="tools"><h3>${esc(t(s.toolsTitle))}</h3>${s.tools.map((x) => `<span class="tool">${esc(x)}</span>`).join('')}</div>
  </section>`;
}

/* ---------- отзывы ---------- */
function quotesPanel(site) {
  const q = site.testimonials;
  return `
  <section class="panel panel-quotes" id="testimonials" aria-labelledby="q-h">
    <h2 id="q-h">${esc(t(q.title))}</h2>
    <div class="quotes">
      ${q.items.map((i) => `<blockquote class="quote"><p>${esc(t(i.text))}</p><footer>${esc(t(i.author))}</footer></blockquote>`).join('')}
    </div>
  </section>`;
}

/* ---------- контакты ---------- */
function contactPanel(site) {
  const c = site.contact;
  const rows = [];
  if (c.email) rows.push(`<li><a href="mailto:${esc(c.email)}">${icon('mail')}${esc(c.email)}</a></li>`);
  if (c.telegram) rows.push(`<li><a href="https://t.me/${esc(c.telegram.replace(/^@/, ''))}" rel="noopener">${icon('telegram')}${esc(c.telegram.startsWith('@') ? c.telegram : '@' + c.telegram)}</a></li>`);
  if (c.phone) rows.push(`<li><a href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${icon('phone')}${esc(c.phone)}</a></li>`);
  if (c.behance) rows.push(`<li><a href="${esc(c.behance)}" rel="noopener">${icon('behance')}${esc(c.behance.replace(/^https?:\/\//, ''))}</a></li>`);
  if (t(c.location)) rows.push(`<li><div>${icon('pin')}${esc(t(c.location))}</div></li>`);
  return `
  <section class="panel panel-contact" id="contact" aria-labelledby="contact-h">
    <div>
      <h2 class="h2" id="contact-h">${esc(t(c.title))}</h2>
      <p class="contact-text">${esc(t(c.text))}</p>
      ${c.email ? `<a class="btn on-orange" href="mailto:${esc(c.email)}">${esc(t(c.button))}</a>` : ''}
    </div>
    <ul class="contact-list">${rows.join('')}</ul>
  </section>`;
}
