// Готовит ассеты и data/works.json из исходной папки "Портфолио".
// Запуск: npm run seed   (исходники не изменяются)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { SRC, STAGING, categories, works } from './manifest.mjs';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'assets', 'works');

const resolveSrc = (s) => (s.startsWith('@staging/') ? path.join(STAGING, s.slice(9)) : path.join(SRC, s));

async function processImage(srcPath, dir, n) {
  const img = sharp(srcPath, { limitInputPixels: false });
  const meta = await img.metadata();
  const wide = meta.width / meta.height > 3;
  const maxW = wide ? 2400 : 1800;
  const full = `${n}-full.webp`;
  const thumb = `${n}-thumb.webp`;
  const fi = await sharp(srcPath, { limitInputPixels: false })
    .flatten({ background: '#ffffff' })
    .resize({ width: maxW, height: 3200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(path.join(dir, full));
  await sharp(srcPath, { limitInputPixels: false })
    .flatten({ background: '#ffffff' })
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 74, effort: 5 })
    .toFile(path.join(dir, thumb));
  return { thumb, full, w: fi.width, h: fi.height };
}

function processVideo(srcPath, dir, n) {
  const mp4 = `${n}.mp4`;
  const poster = `${n}-poster.png`;
  const r = spawnSync(ffmpeg, ['-y', '-i', srcPath, '-an', '-vf', 'scale=min(1280\\,iw):-2', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(dir, mp4)], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg encode failed: ' + srcPath + '\n' + r.stderr.slice(-400));
  spawnSync(ffmpeg, ['-y', '-ss', '1', '-i', path.join(dir, mp4), '-frames:v', '1', path.join(dir, poster)], { encoding: 'utf8' });
  return { mp4, poster };
}

const outWorks = [];
let order = 0;
for (const w of works) {
  const dir = path.join(OUT, w.slug);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const images = [];
  let n = 0;
  for (const it of w.images) {
    n++;
    const id = String(n).padStart(2, '0');
    if (it.v) {
      const p = resolveSrc(it.v);
      const { mp4, poster } = processVideo(p, dir, id);
      const pm = await sharp(path.join(dir, poster)).metadata();
      const pw = await sharp(path.join(dir, poster)).webp({ quality: 80 }).toFile(path.join(dir, `${id}-poster.webp`));
      fs.rmSync(path.join(dir, poster));
      images.push({ type: 'video', video: `assets/works/${w.slug}/${mp4}`, poster: `assets/works/${w.slug}/${id}-poster.webp`, w: pm.width, h: pm.height, alt: it.alt });
    } else {
      const p = resolveSrc(it.src);
      if (!fs.existsSync(p)) throw new Error('Missing source: ' + p);
      const r = await processImage(p, dir, id);
      images.push({ type: 'image', thumb: `assets/works/${w.slug}/${r.thumb}`, full: `assets/works/${w.slug}/${r.full}`, w: r.w, h: r.h, alt: it.alt });
    }
    process.stdout.write('.');
  }
  let cover = images[0];
  let coverPath = cover.type === 'video' ? cover.poster : cover.thumb;
  if (w.coverStack) { // обложка-«стопка» из постеров: ультраширокие баннеры иначе обрезаются
    const W = 1200, H = 900, gap = 26, iw = 1040;
    const bufs = [];
    for (const im of images) bufs.push(await sharp(path.join(ROOT, im.type === 'video' ? im.poster : im.thumb)).resize({ width: iw }).png().toBuffer());
    const metas = await Promise.all(bufs.map((b) => sharp(b).metadata()));
    const total = metas.reduce((n, m) => n + m.height, 0) + gap * (bufs.length - 1);
    let y = Math.round((H - total) / 2);
    const comps = bufs.map((b, i) => { const c = { input: b, left: (W - iw) / 2, top: y }; y += metas[i].height + gap; return c; });
    await sharp({ create: { width: W, height: H, channels: 3, background: '#0D1B2A' } }).composite(comps).webp({ quality: 82 }).toFile(path.join(dir, 'cover.webp'));
    coverPath = `assets/works/${w.slug}/cover.webp`;
    cover = { w: W, h: H };
  }
  const heroImg = w.heroIndex !== undefined ? images[w.heroIndex] : null;
  const hero = heroImg ? (heroImg.type === 'video' ? heroImg.poster : heroImg.thumb) : '';
  outWorks.push({
    id: w.slug, slug: w.slug, category: w.category, year: w.year, order: ++order,
    visible: true, featured: !!w.featured,
    client: w.client, badge: w.badge, role: w.role, tags: w.tags,
    title: w.title, summary: w.summary, task: w.task, solution: w.solution,
    cover: coverPath,
    hero,
    heroW: heroImg ? heroImg.w : 0, heroH: heroImg ? heroImg.h : 0,
    coverW: cover.w, coverH: cover.h,
    images,
  });
  console.log(' ' + w.slug);
}

const data = {
  categories: categories.map((c, i) => ({ ...c, order: i + 1 })),
  works: outWorks,
};
fs.writeFileSync(path.join(ROOT, 'data', 'works.json'), JSON.stringify(data, null, 2));
console.log('works.json written:', outWorks.length, 'works');
