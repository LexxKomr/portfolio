// Экраны: первая настройка, вход, ошибки загрузки.
import { h, formDialog } from './ui.js';
import * as auth from './auth.js';
import { GH } from './github.js';

export function apiBase() {
  const q = new URLSearchParams(location.search).get('api');
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  return q && local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(q) ? q : 'https://api.github.com';
}

/** Пытается определить владельца и репозиторий по адресу GitHub Pages. */
export function detectRepo() {
  const m = location.hostname.match(/^([^.]+)\.github\.io$/);
  if (!m) return { owner: '', name: '' };
  const seg = location.pathname.split('/').filter(Boolean);
  const name = seg.length && seg[0] !== 'admin' ? seg[0] : `${m[1]}.github.io`;
  return { owner: m[1], name };
}

const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.7 6.6 4.9 10.8 12 12-7.1 1.2-11.3 5.4-12 12-.7-6.6-4.9-10.8-12-12C7.1 10.8 11.3 6.6 12 0z"/></svg>';
const brand = () => h('span', { class: 'brand-mark', html: star + '<span>Админка портфолио</span>' });

export function setupScreen(root) {
  return new Promise((resolve) => {
    const det = detectRepo();
    const f = {
      repo: h('input', { class: 'inp', value: det.owner ? `${det.owner}/${det.name}` : '', placeholder: 'ваш-логин/имя-репозитория', autocomplete: 'off' }),
      branch: h('input', { class: 'inp', value: 'main', autocomplete: 'off' }),
      token: h('input', { class: 'inp', type: 'password', placeholder: 'github_pat_…', autocomplete: 'off' }),
      login: h('input', { class: 'inp', autocomplete: 'username' }),
      pass: h('input', { class: 'inp', type: 'password', autocomplete: 'new-password' }),
      pass2: h('input', { class: 'inp', type: 'password', autocomplete: 'new-password' }),
    };
    const err = h('p', { class: 'err', role: 'alert' });
    const go = h('button', { class: 'btn primary', type: 'submit' }, 'Сохранить и войти');
    const fld = (label, el, hint) => h('label', { class: 'fld' }, h('span', { class: 'lbl' }, label), el, hint && h('span', { class: 'hint' }, hint));

    const form = h('form', { class: 'auth-card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const repoStr = f.repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
      const [owner, name] = repoStr.split('/');
      if (!owner || !name) return (err.textContent = 'Укажите репозиторий в формате «логин/репозиторий».');
      if (!f.token.value.trim()) return (err.textContent = 'Вставьте токен GitHub.');
      const v = auth.validate({ login: f.login.value, password: f.pass.value });
      if (v) return (err.textContent = v);
      if (f.pass.value !== f.pass2.value) return (err.textContent = 'Пароли не совпадают.');
      go.disabled = true; go.textContent = 'Проверяю доступ…';
      try {
        const repo = { owner, name, branch: f.branch.value.trim() || 'main' };
        const gh = new GH({ token: f.token.value.trim(), owner, repo: name, branch: repo.branch, apiBase: apiBase() });
        await gh.checkAccess();
        await auth.createAccount({ login: f.login.value, password: f.pass.value, token: f.token.value.trim(), repo });
        resolve(await auth.unlock(f.login.value, f.pass.value));
      } catch (ex) {
        err.textContent = ex.message;
        go.disabled = false; go.textContent = 'Сохранить и войти';
      }
    } },
      brand(),
      h('h1', {}, 'Первая настройка'),
      h('p', { class: 'lead' }, 'Админка меняет файлы сайта прямо в вашем репозитории GitHub. Для этого ей нужен личный токен доступа. Он сохранится в этом браузере в зашифрованном виде.'),
      h('ol', { class: 'steps' },
        h('li', {}, 'На GitHub откройте Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.'),
        h('li', {}, 'В Repository access выберите Only select repositories и отметьте репозиторий сайта.'),
        h('li', {}, 'В Permissions → Repository permissions поставьте Contents: Read and write (Pages: Read — по желанию, для статуса публикации).'),
        h('li', {}, 'Нажмите Generate token и скопируйте значение. GitHub покажет его один раз.')),
      fld('Репозиторий', f.repo, 'Например, ivan/portfolio'),
      fld('Ветка, из которой публикуется сайт', f.branch),
      fld('Токен GitHub', f.token),
      h('div', { class: 'pair' }, fld('Придумайте логин', f.login), h('span')),
      h('div', { class: 'pair' }, fld('Пароль (от 10 символов)', f.pass), fld('Повторите пароль', f.pass2)),
      h('div', { class: 'note', html: '<strong>Как устроена защита.</strong> GitHub Pages — статический хостинг без сервера, поэтому логин и пароль проверяются в вашем браузере: они расшифровывают сохранённый токен. Сама страница /admin видна всем, но без вашего токена из неё ничего нельзя изменить. Выберите длинный пароль и не давайте токен другим. На каждом новом устройстве настройку нужно пройти заново.' }),
      err, go);
    root.replaceChildren(h('div', { class: 'auth' }, form));
    f.repo.value ? f.token.focus() : f.repo.focus();
  });
}

export function loginScreen(root, { message = '' } = {}) {
  return new Promise((resolve) => {
    const login = h('input', { class: 'inp', autocomplete: 'username' });
    const pass = h('input', { class: 'inp', type: 'password', autocomplete: 'current-password' });
    const err = h('p', { class: 'err', role: 'alert' }, message);
    const go = h('button', { class: 'btn primary', type: 'submit' }, 'Войти');
    const form = h('form', { class: 'auth-card', onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      go.disabled = true; go.textContent = 'Проверяю…';
      try {
        resolve(await auth.unlock(login.value, pass.value));
      } catch (ex) {
        err.textContent = ex.message;
        go.disabled = false; go.textContent = 'Войти';
        pass.value = ''; pass.focus();
      }
    } },
      brand(), h('h1', {}, 'Вход'),
      h('label', { class: 'fld' }, h('span', { class: 'lbl' }, 'Логин'), login),
      h('label', { class: 'fld' }, h('span', { class: 'lbl' }, 'Пароль'), pass),
      err, go,
      h('button', { class: 'linkish', type: 'button', onClick: async () => {
        const { confirmBox } = await import('./ui.js');
        if (await confirmBox('Сохранённый токен и логин будут удалены из этого браузера. Сайт и репозиторий не пострадают. Потом можно настроить админку заново.', { ok: 'Сбросить', danger: true, title: 'Сбросить админку на этом устройстве?' })) { auth.wipe(); location.reload(); }
      } }, 'Забыли пароль? Сбросить настройку на этом устройстве'));
    root.replaceChildren(h('div', { class: 'auth' }, form));
    login.focus();
  });
}

export function errorScreen(root, title, text, actions = []) {
  root.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'auth-card' }, brand(), h('h1', {}, title), h('p', { class: 'lead' }, text),
    h('div', { class: 'dlg-actions' }, actions.map(([label, fn, cls]) => h('button', { class: `btn ${cls || 'primary'}`, onClick: fn }, label))))));
}

export { formDialog };
