// Контактный лист для быстрой проверки: node tools/contact-sheet.mjs <slug> <out.png>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const [slug, out] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/works.json'), 'utf8'));
const works = slug === 'all' ? data.works : data.works.filter((w) => w.slug === slug);
const T = 360, cols = 4;
const tiles = [];
for (const w of works) for (const im of w.images) tiles.push(im.type === 'video' ? im.poster : im.thumb);
const rows = Math.ceil(tiles.length / cols);
const comps = [];
for (let i = 0; i < tiles.length; i++) {
  const b = await sharp(path.join(root, tiles[i])).resize(T - 8, T - 8, { fit: 'contain', background: '#dddddd' }).toBuffer();
  comps.push({ input: b, left: (i % cols) * T + 4, top: Math.floor(i / cols) * T + 4 });
}
await sharp({ create: { width: cols * T, height: rows * T, channels: 3, background: '#888' } }).composite(comps).png().toFile(out);
console.log(tiles.length, 'tiles ->', out);
