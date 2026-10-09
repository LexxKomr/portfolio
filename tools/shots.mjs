// Снимки сайта в трёх ширинах: node tools/shots.mjs (сервер на 4173 должен работать)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
const OUT = path.resolve(import.meta.dirname, '../_staging/shots');
fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
const targets = [['home', 'http://localhost:4173/'], ['case', 'http://localhost:4173/work.html?slug=expo-stand&lang=en']];
for (const [w, h, name] of [[390, 844, 'mobile'], [820, 1100, 'tablet'], [1440, 900, 'desktop']]) {
  for (const [id, url] of targets) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1800));
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: path.join(OUT, `${name}-${id}.png`), fullPage: true });
    console.log(name, id, 'горизонтальное переполнение:', over, 'px');
    await p.close();
  }
}
await b.close();
