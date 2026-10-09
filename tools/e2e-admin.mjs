// Сквозная проверка админки в настоящем браузере (Edge) против имитации GitHub.
// Запуск: npm run e2e  (поднимает песочницу, имитацию GitHub и сервера сам)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const SB = path.join(ROOT, '_staging/sandbox');
const OUT = path.join(ROOT, '_staging/e2e');
fs.mkdirSync(OUT, { recursive: true });
const ADMIN = 'http://localhost:4173/admin/?api=http://localhost:4180';
const PASS = 'correct horse battery';
const log = (m) => console.log('  ✓', m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true, protocolTimeout: 60000, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1280, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/401/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', (d) => d.accept());
const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
const text = () => page.evaluate(() => document.body.innerText);
const click = async (sel, txt) => {
  const ok = await page.evaluate((sel, txt) => {
    const el = [...document.querySelectorAll(sel)].find((e) => !txt || e.textContent.trim().includes(txt));
    if (!el) return false; el.click(); return true;
  }, sel, txt);
  assert.ok(ok, `нет элемента ${sel} «${txt || ''}»`);
};
const fill = async (el, v) => {
  await el.click();
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await el.type(v);
};

try {
  console.log('вход и настройка');
  await page.goto(ADMIN);
  await page.waitForSelector('.auth-card');
  await shot('01-setup');
  const ins = await page.$$('.auth-card input');
  for (const [i, v] of [[0, 'tester/portfolio'], [1, 'main'], [2, 'badtoken'], [3, 'master'], [4, PASS], [5, PASS]]) await fill(ins[i], v);
  await click('button[type=submit]');
  await page.waitForFunction(() => document.querySelector('.err')?.textContent.length > 0, { timeout: 8000 });
  assert.match(await page.$eval('.err', (e) => e.textContent), /токен/i); log('неверный токен → понятная ошибка');
  await fill(ins[2], 'good');
  await click('button[type=submit]');
  await page.waitForSelector('.shell', { timeout: 15000 });
  log('первая настройка и вход'); await shot('02-works');
  assert.ok((await text()).includes('Все изменения опубликованы'));

  console.log('работы');
  const rows = await page.$$eval('.row', (r) => r.length); assert.equal(rows, 10); log('в списке 10 работ');
  await click('.row .btn', 'Править');
  await page.waitForSelector('.media-grid');
  await shot('03-work-edit');
  const titleRu = (await page.$$('.card .pair input'))[0];
  await fill(titleRu, 'CAE Day 2025 (правка)');
  assert.match(await text(), /Неопубликованных изменений: 1/); log('правка названия отмечена как изменение');

  console.log('категории');
  await page.goto(ADMIN + '#/categories'); await page.waitForSelector('.card');
  await click('button', 'Добавить категорию');
  await page.waitForSelector('dialog input'); await page.type('dialog input', 'Айдентика'); await click('dialog .btn.primary');
  await sleep(300);
  assert.equal(await page.$$eval('.card', (c) => c.length), 8); log('категория добавлена');

  console.log('новая работа с загрузкой файлов');
  await page.evaluate(() => { location.hash = '#/works'; });
  await page.waitForSelector('.row');
  await click('button', 'Добавить работу');
  await page.waitForSelector('dialog input'); await page.type('dialog input', 'Тестовая работа'); await click('dialog .btn.primary');
  await page.waitForSelector('.drop input');
  const up = await page.$('.drop input');
  await up.uploadFile(path.join(ROOT, 'assets/works/cae-day/02-full.webp'), path.join(ROOT, 'assets/works/leaflets/01-full.webp'), path.join(ROOT, 'assets/works/motion-banners/01.mp4'));
  await page.waitForFunction(() => document.querySelectorAll('.media').length >= 3, { timeout: 20000 });
  await shot('04-uploaded');
  assert.equal(await page.$$eval('.media', (m) => m.length), 3); log('загружены 2 изображения и видео (сжатие в браузере)');
  assert.equal(await page.evaluate(() => document.querySelector('.flags span')?.textContent), 'обложка'); log('первая загрузка стала обложкой');
  await (await page.$('.card input[type=checkbox]')).click();
  await fill((await page.$$('.card .pair input'))[0], 'Тестовая работа');

  console.log('тексты и оформление');
  await page.goto(ADMIN + '#/texts/hero'); await page.waitForSelector('.card .pair');
  await fill((await page.$$('.card .pair textarea'))[0], 'Новый слоган из админки.');
  await page.goto(ADMIN + '#/design'); await page.waitForSelector('.color');
  await page.$eval('.color', (c) => { c.value = '#112233'; c.dispatchEvent(new Event('input', { bubbles: true })); });
  log('тексты и цвет изменены');

  console.log('предпросмотр');
  await click('.bar button', 'Предпросмотр');
  await page.waitForSelector('dialog.preview iframe');
  await sleep(2500);
  const fr = page.frames().find((f) => f.url().includes('index.html') && f.url().includes('preview'));
  assert.ok(fr, 'iframe предпросмотра не найден');
  await fr.waitForSelector('.hero-meta .script', { timeout: 8000 });
  assert.equal(await fr.$eval('.hero-meta .script', (e) => e.textContent), 'Новый слоган из админки.'); log('предпросмотр показывает неопубликованный текст');
  assert.equal(await fr.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()), '#112233'); log('предпросмотр применяет новый цвет');
  assert.equal(await fr.$$eval('.wgrid .card', (c) => c.length), 11); log('в предпросмотре появилась новая работа (11 карточек)');
  await shot('05-preview');
  await click('dialog.preview .btn', 'Закрыть');

  console.log('публикация');
  await page.goto(ADMIN + '#/publish'); await page.waitForSelector('.changes');
  await shot('06-publish');
  const changeText = await text();
  assert.match(changeText, /site\.json/); assert.match(changeText, /works\.json/); assert.match(changeText, /Новых файлов: 6/);
  await click('.btn.primary', 'Опубликовать на сайте');
  await page.waitForSelector('.ok-box', { timeout: 30000 });
  log('публикация прошла'); await shot('07-published');
  assert.ok((await text()).includes('Все изменения опубликованы'));
  const siteJson = JSON.parse(fs.readFileSync(path.join(SB, 'data/site.json'), 'utf8'));
  assert.equal(siteJson.hero.tagline.ru, 'Новый слоган из админки.');
  assert.equal(siteJson.theme.paper, '#112233');
  const worksJson = JSON.parse(fs.readFileSync(path.join(SB, 'data/works.json'), 'utf8'));
  const nw = worksJson.works.find((w) => w.title.ru === 'Тестовая работа');
  assert.ok(nw && nw.visible && nw.images.length === 3);
  assert.ok(worksJson.works[0].title.ru.includes('(правка)'));
  for (const im of nw.images) for (const k of ['thumb', 'full', 'video', 'poster']) if (im[k]) assert.ok(fs.existsSync(path.join(SB, im[k])), 'нет файла ' + im[k]);
  assert.ok(worksJson.categories.some((c) => c.title.ru === 'Айдентика'));
  log('в репозитории обновились data/*.json и добавились все файлы');

  console.log('опубликованный сайт');
  const pub = await browser.newPage();
  await pub.goto('http://localhost:4174/', { waitUntil: 'networkidle0' });
  assert.equal(await pub.$$eval('.wgrid .card', (c) => c.length), 11);
  assert.equal(await pub.$eval('.hero-meta .script', (e) => e.textContent), 'Новый слоган из админки.');
  const broken = await pub.$$eval('img', (is) => is.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  assert.deepEqual(broken, []); log('на сайте 11 работ, новый текст, все картинки грузятся');
  await pub.goto(`http://localhost:4174/work.html?slug=${nw.slug}`, { waitUntil: 'networkidle0' });
  assert.equal(await pub.$$eval('.fig', (f) => f.length), 3);
  assert.equal(await pub.$$eval('video', (v) => v.length), 1); log('страница новой работы: 2 изображения и видео');
  await pub.close(); await page.bringToFront();

  console.log('удаление');
  await page.evaluate((s) => { location.hash = '#/works/' + s; }, nw.slug);
  await page.waitForSelector('.card .btn.ghost.danger-text');
  await click('.card .btn.ghost.danger-text', 'Удалить работу');
  await page.waitForSelector('dialog .btn.danger'); await click('dialog .btn.danger');
  await page.goto(ADMIN + '#/publish'); await page.waitForSelector('.changes');
  await click('.btn.primary', 'Опубликовать на сайте');
  await page.waitForSelector('.ok-box', { timeout: 30000 });
  const dir = path.join(SB, 'assets/works', nw.slug);
  assert.deepEqual(fs.existsSync(dir) ? fs.readdirSync(dir) : [], []);
  assert.equal(JSON.parse(fs.readFileSync(path.join(SB, 'data/works.json'), 'utf8')).works.length, 10); log('работа и все её файлы удалены из репозитория');

  console.log('блокировка');
  await click('.side a', 'Выйти');
  await page.waitForSelector('.auth-card'); assert.ok((await text()).includes('Вход'));
  await sleep(500);
  const li = await page.$$('.auth-card input');
  await li[0].type('master'); await li[1].type('wrong-pass-123');
  await page.evaluate(() => document.querySelector('button[type=submit]').click());
  await page.waitForFunction(() => document.querySelector('.err')?.textContent.includes('Неверный'), { timeout: 15000 }); log('неверный пароль отклонён');
  const li2 = await page.$$('.auth-card input');
  await fill(li2[0], 'MASTER');
  await fill(li2[1], PASS);
  await page.evaluate(() => document.querySelector('button[type=submit]').click());
  await page.waitForSelector('.shell', { timeout: 20000 }); log('вход с верным паролем (логин без учёта регистра)');
  await shot('08-after-login');
} catch (e) {
  console.error('\n✗ ПРОВАЛ:', e.message);
  await page.screenshot({ path: path.join(OUT, 'fail.png') });
  console.error((await text()).slice(0, 600));
  process.exitCode = 1;
} finally {
  if (errors.length) { console.log('\nОшибки в консоли страницы:'); errors.forEach((x) => console.log(' -', x)); }
  await browser.close();
}
