// Нарезка длинного скриншота: node tools/crop.mjs in.png outPrefix [partHeight]
import sharp from 'sharp';
const [inp, pre, h = '1100'] = process.argv.slice(2);
const m = await sharp(inp).metadata();
const H = +h; let i = 0;
for (let y = 0; y < m.height; y += H) {
  await sharp(inp).extract({ left: 0, top: y, width: m.width, height: Math.min(H, m.height - y) }).resize({ width: 1100 }).png().toFile(`${pre}_${++i}.png`);
}
console.log(m.width, m.height, i, 'parts');
