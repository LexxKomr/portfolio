// Работа с GitHub REST API: чтение файлов и атомарная публикация одним коммитом (Git Data API).
export class GitHubError extends Error {
  constructor(message, status, kind) { super(message); this.status = status; this.kind = kind; }
}

const b64ToBytes = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
export const bytesToB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export class GH {
  constructor({ token, owner, repo, branch = 'main', apiBase = 'https://api.github.com' }) {
    Object.assign(this, { token, owner, repo, branch, apiBase });
  }

  get repoPath() { return `/repos/${this.owner}/${this.repo}`; }

  async req(method, path, body) {
    let res;
    try {
      res = await fetch(this.apiBase + path, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch (e) {
      throw new GitHubError('Нет соединения с GitHub. Проверьте интернет и повторите.', 0, 'network');
    }
    if (res.ok) return res.status === 204 ? null : res.json();
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch { /* тело не JSON */ }
    if (res.status === 401) throw new GitHubError('GitHub не принял токен: он неверный или истёк. Создайте новый и сохраните его в настройках.', 401, 'auth');
    if (res.status === 403 || res.status === 429) {
      const limited = res.headers.get('x-ratelimit-remaining') === '0' || /rate limit/i.test(detail);
      throw new GitHubError(limited ? 'Достигнут лимит запросов GitHub. Подождите несколько минут.' : 'У токена нет прав на запись в этот репозиторий (нужно Contents: Read and write).', res.status, limited ? 'rate' : 'perm');
    }
    if (res.status === 404) throw new GitHubError('Репозиторий или ветка не найдены, либо токен не имеет к ним доступа.', 404, 'notfound');
    if (res.status === 409 || res.status === 422) throw new GitHubError('Репозиторий изменился во время публикации. Повторите попытку. ' + detail, res.status, 'conflict');
    throw new GitHubError(`Ошибка GitHub ${res.status}. ${detail}`, res.status, 'other');
  }

  /** Проверка токена и прав: возвращает сведения о репозитории. */
  async checkAccess() {
    const info = await this.req('GET', this.repoPath);
    if (!info.permissions?.push) throw new GitHubError('У токена нет права записи в репозиторий (Contents: Read and write).', 403, 'perm');
    return info;
  }

  async getText(path) {
    const f = await this.req('GET', `${this.repoPath}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(this.branch)}`);
    return { text: new TextDecoder().decode(b64ToBytes(f.content)), sha: f.sha };
  }

  async getHead() {
    const ref = await this.req('GET', `${this.repoPath}/git/ref/heads/${encodeURIComponent(this.branch)}`);
    const commit = await this.req('GET', `${this.repoPath}/git/commits/${ref.object.sha}`);
    return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
  }

  /** Список всех файлов репозитория (path → sha). */
  async listFiles(treeSha) {
    const tree = await this.req('GET', `${this.repoPath}/git/trees/${treeSha}?recursive=1`);
    return tree.tree.filter((n) => n.type === 'blob').map((n) => ({ path: n.path, sha: n.sha, size: n.size }));
  }

  /**
   * Публикация одним коммитом.
   * files: [{ path, text } | { path, blob: Blob }]; deletes: [path]
   */
  async publish({ files, deletes = [], message, onProgress = () => {} }) {
    const head = await this.getHead();
    const entries = [];
    let done = 0;
    const total = files.length;
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        let body;
        if (f.text !== undefined) body = { content: f.text, encoding: 'utf-8' };
        else body = { content: bytesToB64(new Uint8Array(await f.blob.arrayBuffer())), encoding: 'base64' };
        const blob = await this.req('POST', `${this.repoPath}/git/blobs`, body);
        entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
        onProgress(++done, total);
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, total) || 1 }, worker));
    for (const p of deletes) entries.push({ path: p, mode: '100644', type: 'blob', sha: null });

    const tree = await this.req('POST', `${this.repoPath}/git/trees`, { base_tree: head.treeSha, tree: entries });
    const commit = await this.req('POST', `${this.repoPath}/git/commits`, { message, tree: tree.sha, parents: [head.commitSha] });
    await this.req('PATCH', `${this.repoPath}/git/refs/heads/${encodeURIComponent(this.branch)}`, { sha: commit.sha, force: false });
    return commit.sha;
  }

  /** Состояние последней сборки GitHub Pages: 'built' | 'building' | 'errored' | 'unknown' */
  async pagesStatus() {
    try {
      const b = await this.req('GET', `${this.repoPath}/pages/builds/latest`);
      return { status: b.status, commit: b.commit, error: b.error?.message };
    } catch {
      return { status: 'unknown' };
    }
  }
}
