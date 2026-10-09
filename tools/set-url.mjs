// Прописывает адрес сайта в мета-тегах (для превью ссылок в мессенджерах), sitemap.xml и robots.txt.
// node tools/set-url.mjs https://ваш-логин.github.io/имя-репозитория/
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
let base = process.argv[2];
if (!base || !/^https:\/\//.test(base)) { console.error('Укажите адрес сайта, например: node tools/set-url.mjs https://ivan.github.io/portfolio/'); process.exit(1); }
if (!base.endsWith('/')) base += '/';

for (const f of ['index.html', 'work.html']) {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${base}assets/og.jpg">`);
  s = s.replace(/\s*<meta property="og:url"[^>]*>/, '').replace(/\s*<link rel="canonical"[^>]*>/, '');
  if (f === 'index.html') s = s.replace('<link rel="icon"', `<meta property="og:url" content="${base}">\n  <link rel="canonical" href="${base}">\n  <link rel="icon"`);
  fs.writeFileSync(p, s);
}
const works = JSON.parse(fs.readFileSync(path.join(root, 'data/works.json'), 'utf8')).works.filter((w) => w.visible !== false);
const urls = [base, ...works.map((w) => `${base}work.html?slug=${encodeURIComponent(w.slug)}`)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
console.log('Готово:', base, '— страниц в sitemap:', urls.length);
