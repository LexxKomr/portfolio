// Вход в админку. Токен GitHub хранится в браузере только в зашифрованном виде:
// ключ получается из логина и пароля (PBKDF2 → AES-GCM). Без пароля токен не прочитать.
const KEY = 'pf_admin_v1';
const SESSION = 'pf_admin_session';
const ITER = 600_000;
const IDLE_MS = 60 * 60 * 1000;
export const MIN_PASSWORD = 10;

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(login, password, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', enc.encode(`${login.trim().toLowerCase()}\u0000${password}`), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function seal(login, password, payload) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(login, password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload))));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

export const hasAccount = () => !!localStorage.getItem(KEY);

export function validate({ login, password }) {
  if (!login || login.trim().length < 3) return 'Логин — не короче 3 символов.';
  if (!password || password.length < MIN_PASSWORD) return `Пароль — не короче ${MIN_PASSWORD} символов.`;
  return '';
}

/** Первый запуск: сохраняет зашифрованный токен и настройки репозитория. */
export async function createAccount({ login, password, token, repo }) {
  const err = validate({ login, password });
  if (err) throw new Error(err);
  const box = await seal(login, password, { token, repo });
  localStorage.setItem(KEY, JSON.stringify(box));
  localStorage.removeItem(KEY + '_fails');
  return { token, repo };
}

/** Вход: бросает ошибку при неверной паре логин/пароль. */
export async function unlock(login, password) {
  const lock = lockedFor();
  if (lock > 0) throw new Error(`Слишком много попыток. Повторите через ${Math.ceil(lock / 1000)} с.`);
  const raw = localStorage.getItem(KEY);
  if (!raw) throw new Error('Админка ещё не настроена на этом устройстве.');
  const box = JSON.parse(raw);
  try {
    const key = await deriveKey(login, password, unb64(box.salt), box.iter || ITER);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
    const data = JSON.parse(dec.decode(pt));
    localStorage.removeItem(KEY + '_fails');
    startSession(data);
    return data;
  } catch {
    registerFail();
    throw new Error('Неверный логин или пароль.');
  }
}

export async function changeCredentials({ login, password, newLogin, newPassword }) {
  const data = await unlock(login, password);
  const err = validate({ login: newLogin, password: newPassword });
  if (err) throw new Error(err);
  localStorage.setItem(KEY, JSON.stringify(await seal(newLogin, newPassword, data)));
}

export async function updateSecret({ login, password, patch }) {
  const data = { ...(await unlock(login, password)), ...patch };
  localStorage.setItem(KEY, JSON.stringify(await seal(login, password, data)));
  startSession(data);
  return data;
}

export function wipe() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY + '_fails');
  sessionStorage.removeItem(SESSION);
}

/* ----- сессия: живёт, пока открыта вкладка; блокируется после часа бездействия ----- */
function startSession(data) {
  sessionStorage.setItem(SESSION, JSON.stringify({ data, t: Date.now() }));
}
export function resume() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION) || 'null');
    if (!s || Date.now() - s.t > IDLE_MS) { sessionStorage.removeItem(SESSION); return null; }
    return s.data;
  } catch { return null; }
}
export function touch() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION) || 'null');
    if (s) { s.t = Date.now(); sessionStorage.setItem(SESSION, JSON.stringify(s)); }
  } catch { /* ignore */ }
}
export function idleExpired() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION) || 'null');
    return !s || Date.now() - s.t > IDLE_MS;
  } catch { return true; }
}
export const logout = () => sessionStorage.removeItem(SESSION);

/* ----- замедление подбора пароля ----- */
function registerFail() {
  const f = JSON.parse(localStorage.getItem(KEY + '_fails') || '{"n":0,"t":0}');
  f.n += 1; f.t = Date.now();
  localStorage.setItem(KEY + '_fails', JSON.stringify(f));
}
function lockedFor() {
  const f = JSON.parse(localStorage.getItem(KEY + '_fails') || '{"n":0,"t":0}');
  if (f.n < 4) return 0;
  const wait = Math.min(15 * 60_000, 2 ** (f.n - 3) * 1000);
  return Math.max(0, f.t + wait - Date.now());
}
