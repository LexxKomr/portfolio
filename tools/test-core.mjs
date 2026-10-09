// Проверка ядра админки: шифрование токена и публикация через GitHub API (на имитации).
// node tools/test-core.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

// ---- заглушки браузерных хранилищ ----
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = mem();
globalThis.sessionStorage = mem();
const auth = await import('../admin/auth.js');
const { GH, GitHubError } = await import('../admin/github.js');

let passed = 0;
const ok = (name) => { passed++; console.log('  ✓', name); };

console.log('auth');
assert.equal(auth.hasAccount(), false);
assert.ok(auth.validate({ login: 'ab', password: 'x' }));
assert.equal(auth.validate({ login: 'master', password: 'long-enough-pass' }), '');
await auth.createAccount({ login: 'Master', password: 'correct horse battery', token: 'good', repo: { owner: 'o', name: 'r', branch: 'main' } });
assert.ok(auth.hasAccount()); ok('создание аккаунта');
const stored = localStorage.getItem('pf_admin_v1');
assert.ok(!stored.includes('good') && !stored.includes('"token"')); ok('токен не лежит в открытом виде');
const d = await auth.unlock('master', 'correct horse battery');
assert.equal(d.token, 'good'); assert.equal(d.repo.owner, 'o'); ok('вход (логин не чувствителен к регистру)');
await assert.rejects(auth.unlock('master', 'wrong password!!'), /Неверный логин или пароль/); ok('неверный пароль отклонён');
await assert.rejects(auth.unlock('other', 'correct horse battery'), /Неверный логин или пароль/); ok('неверный логин отклонён');
await assert.rejects(auth.unlock('master', 'wrong password 2'), /Неверный/);
await assert.rejects(auth.unlock('master', 'wrong password 3'), /Неверный/);
await assert.rejects(auth.unlock('master', 'correct horse battery'), /Слишком много попыток/); ok('после серии ошибок вход замедляется');
localStorage.removeItem('pf_admin_v1_fails');
await auth.changeCredentials({ login: 'master', password: 'correct horse battery', newLogin: 'boss', newPassword: 'another long pass' });
await assert.rejects(auth.unlock('master', 'correct horse battery'), /Неверный/);
localStorage.removeItem('pf_admin_v1_fails');
assert.equal((await auth.unlock('boss', 'another long pass')).token, 'good'); ok('смена логина и пароля');
assert.ok(auth.resume()); auth.logout(); assert.equal(auth.resume(), null); ok('сессия: вход и выход');
auth.wipe(); assert.equal(auth.hasAccount(), false); ok('сброс на устройстве');

console.log('github');
const sandbox = path.resolve('_staging/sandbox-core');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
fs.mkdirSync(path.join(sandbox, 'assets/works/a'), { recursive: true });
fs.writeFileSync(path.join(sandbox, 'data/site.json'), '{"name":"Тест"}\n');
fs.writeFileSync(path.join(sandbox, 'data/works.json'), '{"works":[]}\n');
fs.writeFileSync(path.join(sandbox, 'assets/works/a/old.webp'), 'OLD');
const srv = spawn(process.execPath, ['tools/mock-github.mjs', sandbox, '4181'], { stdio: 'pipe' });
await new Promise((r) => srv.stdout.once('data', r));
try {
  const api = 'http://localhost:4181';
  const bad = new GH({ token: 'nope', owner: 'o', repo: 'r', apiBase: api });
  await assert.rejects(bad.checkAccess(), (e) => e instanceof GitHubError && e.kind === 'auth'); ok('неверный токен → понятная ошибка');
  const ro = new GH({ token: 'readonly', owner: 'o', repo: 'r', apiBase: api });
  await assert.rejects(ro.checkAccess(), (e) => e.kind === 'perm'); ok('токен без записи → понятная ошибка');
  const gh = new GH({ token: 'good', owner: 'o', repo: 'r', apiBase: api });
  const info = await gh.checkAccess(); assert.equal(info.permissions.push, true); ok('проверка прав');
  const f = await gh.getText('data/site.json'); assert.equal(JSON.parse(f.text).name, 'Тест'); ok('чтение файла (utf-8)');
  const head = await gh.getHead();
  const list = await gh.listFiles(head.treeSha); assert.equal(list.length, 3); ok('список файлов репозитория');
  let progress = 0;
  await gh.publish({
    files: [
      { path: 'data/site.json', text: '{"name":"Новое имя ✓"}\n' },
      { path: 'assets/works/a/new.bin', blob: new Blob([new Uint8Array([0, 1, 2, 250, 255])]) },
    ],
    deletes: ['assets/works/a/old.webp'],
    message: 'test',
    onProgress: () => progress++,
  });
  assert.equal(progress, 2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(sandbox, 'data/site.json'), 'utf8')).name, 'Новое имя ✓');
  assert.deepEqual([...fs.readFileSync(path.join(sandbox, 'assets/works/a/new.bin'))], [0, 1, 2, 250, 255]);
  assert.equal(fs.existsSync(path.join(sandbox, 'assets/works/a/old.webp')), false);
  assert.equal(fs.readFileSync(path.join(sandbox, 'data/works.json'), 'utf8'), '{"works":[]}\n');
  ok('публикация: правка + бинарный файл + удаление одним коммитом, остальное не тронуто');
  const ps = await gh.pagesStatus(); assert.equal(ps.status, 'built'); ok('статус сборки Pages');
} finally {
  srv.kill();
}
console.log(`\nВсе проверки пройдены: ${passed}`);
