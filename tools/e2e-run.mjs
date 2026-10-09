// Запуск сквозной проверки админки с нуля: свежая песочница, имитация GitHub, два статических сервера.
// npm run e2e
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SB = path.join(ROOT, '_staging/sandbox');
fs.rmSync(SB, { recursive: true, force: true });
fs.mkdirSync(SB, { recursive: true });
for (const f of ['index.html', 'work.html', '404.html', 'admin', 'assets', 'css', 'js', 'data', '.nojekyll', 'robots.txt']) {
  fs.cpSync(path.join(ROOT, f), path.join(SB, f), { recursive: true });
}
const procs = [
  spawn(process.execPath, ['tools/serve.mjs', '4173'], { cwd: ROOT, stdio: 'ignore' }),
  spawn(process.execPath, ['tools/serve.mjs', '4174', SB], { cwd: ROOT, stdio: 'ignore' }),
  spawn(process.execPath, ['tools/mock-github.mjs', SB, '4180'], { cwd: ROOT, stdio: 'ignore' }),
];
await new Promise((r) => setTimeout(r, 1500));
const r = spawnSync(process.execPath, ['tools/e2e-admin.mjs'], { cwd: ROOT, stdio: 'inherit' });
procs.forEach((p) => p.kill());
process.exit(r.status ?? 1);
