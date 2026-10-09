// Имитация GitHub REST API для локальной проверки админки без настоящего репозитория.
// node tools/mock-github.mjs <папка-песочница> [port]
// Токены: "good" — полный доступ, "readonly" — без права записи, любой другой — 401.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dir = path.resolve(process.argv[2] || '.');
const port = +process.argv[3] || 4180;
const sha = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

const blobs = new Map();   // sha → Buffer
const trees = new Map();   // sha → { path → blobSha }
const commits = new Map(); // sha → { tree, parent }
let head;

function walk(d, base = '') {
  const out = {};
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) Object.assign(out, walk(path.join(d, e.name), rel));
    else { const buf = fs.readFileSync(path.join(d, e.name)); const s = sha(buf); blobs.set(s, buf); out[rel] = s; }
  }
  return out;
}
function init() {
  const files = walk(dir);
  const ts = sha(JSON.stringify(files));
  trees.set(ts, files);
  head = sha('c0' + ts);
  commits.set(head, { tree: ts, parent: null });
}
init();

function syncToDisk(treeSha) {
  const files = trees.get(treeSha);
  const present = new Set(Object.keys(walk(dir)));
  for (const p of present) if (!files[p]) fs.rmSync(path.join(dir, p));
  for (const [p, s] of Object.entries(files)) {
    const f = path.join(dir, p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, blobs.get(s));
  }
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  res.end(obj === undefined ? '' : JSON.stringify(obj));
};

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const u = new URL(req.url, 'http://x');
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!['good', 'readonly'].includes(token)) return send(res, 401, { message: 'Bad credentials' });
  let body = '';
  for await (const c of req) body += c;
  const j = body ? JSON.parse(body) : {};
  const m = u.pathname.match(/^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!m) return send(res, 404, { message: 'Not Found' });
  const rest = m[3] || '';
  const cur = () => trees.get(commits.get(head).tree);

  if (rest === '') return send(res, 200, { full_name: `${m[1]}/${m[2]}`, permissions: { push: token === 'good' } });
  if (rest.startsWith('/contents/')) {
    const p = decodeURIComponent(rest.slice(10));
    const s = cur()[p];
    return s ? send(res, 200, { sha: s, content: blobs.get(s).toString('base64') }) : send(res, 404, { message: 'Not Found' });
  }
  if (rest === '/git/ref/heads/main') return send(res, 200, { object: { sha: head } });
  if (rest.startsWith('/git/commits/') && req.method === 'GET') return send(res, 200, { tree: { sha: commits.get(rest.slice(13)).tree } });
  if (rest.startsWith('/git/trees/') && req.method === 'GET') {
    const t = trees.get(rest.slice(11));
    return send(res, 200, { tree: Object.entries(t).map(([p, s]) => ({ path: p, type: 'blob', sha: s, size: blobs.get(s).length })) });
  }
  if (rest === '/git/blobs') {
    const buf = Buffer.from(j.content, j.encoding === 'base64' ? 'base64' : 'utf8');
    const s = sha(buf); blobs.set(s, buf);
    return send(res, 201, { sha: s });
  }
  if (rest === '/git/trees') {
    const base = { ...trees.get(j.base_tree) };
    for (const e of j.tree) { if (e.sha === null) delete base[e.path]; else base[e.path] = e.sha; }
    const s = sha(JSON.stringify(base) + Math.random()); trees.set(s, base);
    return send(res, 201, { sha: s });
  }
  if (rest === '/git/commits') {
    const s = sha(JSON.stringify(j) + Math.random());
    commits.set(s, { tree: j.tree, parent: j.parents[0] });
    return send(res, 201, { sha: s });
  }
  if (rest === '/git/refs/heads/main' && req.method === 'PATCH') {
    if (commits.get(j.sha).parent !== head) return send(res, 422, { message: 'Update is not a fast forward' });
    head = j.sha;
    syncToDisk(commits.get(head).tree);
    return send(res, 200, { object: { sha: head } });
  }
  if (rest === '/pages/builds/latest') return send(res, 200, { status: 'built', commit: head });
  return send(res, 404, { message: 'Not Found: ' + rest });
}).listen(port, () => console.log(`mock GitHub on http://localhost:${port} → ${dir}`));
