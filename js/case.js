import { fixPreviewLinks, loadData, applyTheme, t, esc, icon, url, renderHeader, bindLang, setMeta, visibleWorks } from './common.js';

const app = document.getElementById('app');
const slug = new URLSearchParams(location.search).get('slug');
let data;
let lbIndex = 0;
let lbItems = [];

main();

async function main() {
  try {
    data = await loadData();
  } catch (e) {
    console.error(e);
    app.innerHTML = '<p class="state">Не удалось загрузить данные. / Couldn’t load the data.</p>';
    return;
  }
  applyTheme(data.site.theme);
  render();
}

function render() {
  const { site, works } = data;
  const list = visibleWorks(works);
  const idx = list.findIndex((w) => w.slug === slug);
  const w = list[idx];
  const head = renderHeader(site);

  if (!w) {
    setMeta(site);
    app.innerHTML = `${head}<main id="main" class="page"><p class="state">${esc(t(site.ui.notFound))}</p><p style="text-align:center"><a class="btn" href="index.html#work">${esc(t(site.ui.back))}</a></p></main>`;
    bindLang(render);
    return;
  }

  const ui = site.ui;
  const cat = works.categories.find((c) => c.id === w.category);
  const next = list[(idx + 1) % list.length];
  setMeta(site, { title: t(w.title), description: t(w.summary), image: url(w.cover) });

  lbItems = w.images.filter((i) => i.type !== 'video');

  app.innerHTML = `
    ${head}
    <main id="main" class="page case">
      <div class="case-top">
        <a class="back" href="index.html#work">${icon('back')}${esc(t(ui.back))}</a>
        ${t(w.badge) ? `<span class="case-badge">${esc(t(w.badge))}</span>` : ''}
        <h1 class="case-title">${esc(t(w.title))}</h1>
        <p class="case-summary">${esc(t(w.summary))}</p>
        <dl class="meta">
          <div><dt>${esc(t(ui.client))}</dt><dd>${esc(t(w.client))}</dd></div>
          <div><dt>${esc(t(ui.role))}</dt><dd>${esc(t(w.role))}</dd></div>
          <div><dt>${esc(t(ui.year))}</dt><dd>${esc(w.year)}</dd></div>
          <div><dt>${esc(t(ui.tools))}</dt><dd>${esc((w.tags || []).join(', '))}</dd></div>
        </dl>
      </div>

      <div class="gallery">${layout(w.images).map(([im, cls], i) => fig(im, i, cls)).join('')}</div>

      <div class="story">
        <section><h2>${esc(t(ui.task))}</h2><p>${esc(t(w.task))}</p></section>
        <section><h2>${esc(t(ui.solution))}</h2><p>${esc(t(w.solution))}</p></section>
      </div>

      ${next && next.slug !== w.slug ? `<a class="next" href="work.html?slug=${encodeURIComponent(next.slug)}"><small>${esc(t(ui.next))}</small><strong>${esc(t(next.title))}</strong></a>` : ''}
    </main>
    ${lightboxShell(ui)}`;

  bindLang(render);
  bindGallery();
  bindVideos();
  fixPreviewLinks();
}

// Портретные кадры идут парами, одиночный портрет ставится по центру.
function layout(images) {
  const portrait = (im) => im.w / im.h < 1.1;
  return images.map((im, i) => {
    if (im.type === 'video' && im.w <= 800) return [im, 'third']; // мелкие баннеры не растягиваем
    if (!portrait(im)) return [im, ''];
    const prev = i > 0 && portrait(images[i - 1]);
    const next = i < images.length - 1 && portrait(images[i + 1]);
    // пара формируется только из двух подряд идущих портретов
    const idxInRun = (() => { let k = 0; while (i - k - 1 >= 0 && portrait(images[i - k - 1])) k++; return k; })();
    const hasPartner = idxInRun % 2 === 0 ? next : prev;
    return [im, hasPartner ? 'half' : 'solo'];
  });
}

function fig(im, i, cls = '') {
  const half = cls === 'half';
  if (im.type === 'video') {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<figure class="fig is-video${cls ? ' ' + cls : ''}"><button type="button" tabindex="-1" aria-hidden="true" style="aspect-ratio:${im.w}/${im.h}"><video src="${esc(url(im.video))}" poster="${esc(url(im.poster))}" ${reduce ? 'controls' : 'autoplay'} muted loop playsinline preload="metadata" width="${im.w}" height="${im.h}" aria-label="${esc(t(im.alt))}"></video></button></figure>`;
  }
  const n = lbItems.indexOf(im);
  return `<figure class="fig${cls ? ' ' + cls : ''}"><button type="button" data-lb="${n}" aria-label="${esc(t(im.alt))}"><img src="${esc(url(half ? im.thumb : im.full))}" alt="${esc(t(im.alt))}" width="${im.w}" height="${im.h}" ${i > 1 ? 'loading="lazy"' : ''} decoding="async"></button></figure>`;
}

function bindVideos() {
  const vids = [...document.querySelectorAll('video[autoplay]')];
  if (!vids.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.25 });
  vids.forEach((v) => io.observe(v));
}

/* ---------- лайтбокс ---------- */
function lightboxShell(ui) {
  return `
  <div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="${esc(t(ui.gallery))}">
    <div class="lb-stage" id="lb-stage"><img id="lb-img" alt=""></div>
    <div class="lb-bar"><span id="lb-cap"></span><span id="lb-count"></span></div>
    <button class="lb-btn lb-close" type="button" aria-label="${esc(t(ui.close))}">${icon('x')}</button>
    <button class="lb-btn lb-prev" type="button" aria-label="${esc(t(ui.prev))}">${icon('back')}</button>
    <button class="lb-btn lb-next" type="button" aria-label="${esc(t(ui.nextImg))}">${icon('next')}</button>
  </div>`;
}

let lastFocus;
function bindGallery() {
  const lb = document.getElementById('lb');
  const open = (i) => { lastFocus = document.activeElement; show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); };
  const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; lastFocus?.focus?.(); };
  const step = (d) => show((lbIndex + d + lbItems.length) % lbItems.length);

  document.querySelectorAll('[data-lb]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.lb)));
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.id === 'lb-stage') close(); });
  document.onkeydown = (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') { // фокус остаётся внутри окна
      const f = [...lb.querySelectorAll('button')];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  };
}

function show(i) {
  lbIndex = i;
  const im = lbItems[i];
  const img = document.getElementById('lb-img');
  const stage = document.getElementById('lb-stage');
  const fresh = img.cloneNode(false); // перезапуск анимации появления
  fresh.src = url(im.full);
  fresh.alt = t(im.alt);
  img.replaceWith(fresh);
  stage.classList.toggle('tall', im.h / im.w > 1.25);
  stage.scrollTop = 0;
  document.getElementById('lb-cap').textContent = t(im.alt);
  document.getElementById('lb-count').textContent = `${i + 1} / ${lbItems.length}`;
  const nb = lbItems[(i + 1) % lbItems.length];
  if (nb) new Image().src = url(nb.full);
}
