// Обработка загружаемых файлов в браузере: сжатие в webp (полная версия + превью), постер для видео.
const MAX_VIDEO_MB = 25;

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

async function encode(canvas, q) {
  let blob = await toBlob(canvas, 'image/webp', q);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', Math.min(q + 0.06, 0.92)); // Safari без webp
  return { blob, ext: blob.type === 'image/webp' ? 'webp' : 'jpg' };
}

function draw(bitmap, w, h, { alpha = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!alpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return c;
}

function fit(w, h, maxW, maxH) {
  const s = Math.min(1, maxW / w, maxH / h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

export async function processImage(file) {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.type)) throw new Error(`«${file.name}»: формат не поддерживается. Загрузите JPG, PNG или WebP.`);
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const wide = bmp.width / bmp.height > 3;
  const [fw, fh] = fit(bmp.width, bmp.height, wide ? 2400 : 1800, 3200);
  const [tw, th] = fit(bmp.width, bmp.height, 900, 100000);
  const full = await encode(draw(bmp, fw, fh), 0.82);
  const thumb = await encode(draw(bmp, tw, th), 0.74);
  bmp.close?.();
  return { full, thumb, w: fw, h: fh };
}

/** Фото в первом экране: сохраняем прозрачность (для вырезанной фигуры), до 1600px по большей стороне. */
export async function processPhoto(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const [w, h] = fit(bmp.width, bmp.height, 1600, 1600);
  const c = draw(bmp, w, h, { alpha: true });
  let blob = await toBlob(c, 'image/webp', 0.88);
  let out;
  if (blob && blob.type === 'image/webp') out = { blob, ext: 'webp' };
  else out = { blob: await toBlob(c, 'image/png'), ext: 'png' }; // браузер без webp: PNG тоже хранит прозрачность
  bmp.close?.();
  return out;
}

export async function processVideo(file) {
  if (!/^video\/(mp4|webm)$/i.test(file.type)) throw new Error(`«${file.name}»: для видео подходят MP4 и WebM.`);
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`«${file.name}»: видео больше ${MAX_VIDEO_MB} МБ. Сожмите его перед загрузкой.`);
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error(`«${file.name}»: не удалось прочитать видео.`)); });
    v.currentTime = Math.min(1, (v.duration || 1) / 2);
    await new Promise((res) => { v.onseeked = res; setTimeout(res, 1500); });
    const [pw, ph] = fit(v.videoWidth, v.videoHeight, 1200, 100000);
    const poster = await encode(draw(v, pw, ph), 0.8);
    return { poster, w: v.videoWidth, h: v.videoHeight, ext: file.type === 'video/webm' ? 'webm' : 'mp4' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
