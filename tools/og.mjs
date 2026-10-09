// Картинка для превью ссылки (og:image): node tools/og.mjs
import sharp from 'sharp';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const W = 1200, H = 630;
const round = (w, h, r) => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}"/></svg>`);
const tile = async (file, w, h, pos = 'top') =>
  sharp(path.join(root, file)).resize(w, h, { fit: 'cover', position: pos }).composite([{ input: round(w, h, 28), blend: 'dest-in' }]).png().toBuffer();
const a = await tile('assets/works/cae-day/hero.webp', 330, 470);
const b = await tile('assets/works/greetings/01-thumb.webp', 420, 380, 'centre');
const c = await tile('assets/works/server-cabinet/01-thumb.webp', 300, 400);
await sharp({ create: { width: W, height: H, channels: 3, background: '#EEF3F0' } })
  .composite([
    { input: Buffer.from(`<svg width="${W}" height="${H}"><circle cx="1010" cy="120" r="260" fill="#FF7B1C"/><circle cx="170" cy="560" r="170" fill="#0B7F6F"/></svg>`), left: 0, top: 0 },
    { input: a, left: 90, top: 80 }, { input: b, left: 450, top: 200 }, { input: c, left: 840, top: 110 },
  ])
  .jpeg({ quality: 86 }).toFile(path.join(root, 'assets/og.jpg'));
console.log('og.jpg ok');
