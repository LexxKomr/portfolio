// Описание редактируемых текстов сайта (data/site.json): группы, поля, подписи.
export const ICONS = [
  ['system', 'Фигуры'], ['format', 'Форматы'], ['print', 'Печать'], ['brand', 'Звезда'],
  ['banner', 'Баннер'], ['motion', 'Видео'], ['ui', 'Интерфейс'], ['stand', 'Стенд'],
];

export const DEFAULT_THEME = { paper: '#FCE8D6', ink: '#3A1F40', orange: '#F0957B', teal: '#1E5B50', cobalt: '#6B3F73', peach: '#F7C3AA', ice: '#F3D3BF' };

export const THEME_LABELS = {
  paper: 'Фон страницы (кремовый)',
  ink: 'Основной тёмный: сливовый (текст, нижний блок, кнопки)',
  orange: 'Акцент: коралловый (арка, «ФОЛИО», блок контактов)',
  teal: 'Бирюзовый (плашка профессии, блок «Что я делаю»)',
  cobalt: 'Цвет наведения кнопок и рамки фокуса',
  peach: 'Персиковый (плитки работ, арка «Давайте создадим»)',
  ice: 'Фон под изображениями (подложка)',
};

export const SECTION_LABELS = {
  about: 'Обо мне',
  work: 'Избранные работы',
  cta: 'Арка «Давайте создадим что-то»',
  skills: 'Что я делаю',
  contact: 'Контакты',
};

// t: i18n | i18n-long | text | email | list | strings | photo
export const TEXT_GROUPS = [
  {
    id: 'hero', title: 'Главный экран',
    fields: [
      { path: 'person.name', t: 'i18n', label: 'Ваше имя' },
      { path: 'person.role', t: 'i18n', label: 'Специальность (зелёная пилюля)' },
      { path: 'hero.eyebrow', t: 'i18n', label: 'Короткая строка над заголовком' },
      { path: 'hero.line1', t: 'i18n', label: 'Крупный заголовок, строка 1' },
      { path: 'hero.line2', t: 'i18n', label: 'Крупный заголовок, строка 2 (оранжевая)' },
      { path: 'hero.tagline', t: 'i18n-long', label: 'Рукописный слоган' },
      { path: 'hero.cta', t: 'i18n', label: 'Текст кнопки' },
      { path: 'person.photo', t: 'photo', label: 'Ваше фото', hint: 'Для вырезанной фигуры загрузите PNG или WebP с прозрачным фоном. Сейчас стоит картинка-заглушка.' },
      { path: 'person.photoMode', t: 'select', label: 'Как показывать фото', options: [['cutout', 'Вырезанная фигура на фоне арки (нужен прозрачный фон)'], ['arch', 'Обычное фото внутри арки']] },
    ],
  },
  {
    id: 'about', title: 'Обо мне',
    fields: [
      { path: 'about.title', t: 'i18n', label: 'Заголовок' },
      { path: 'about.text', t: 'i18n-long', label: 'Текст' },
      {
        path: 'about.pillars', t: 'list', label: 'Три тезиса', addLabel: 'тезис',
        create: () => ({ icon: 'system', title: { ru: '', en: '' }, text: { ru: '', en: '' } }),
        item: [{ k: 'icon', t: 'icon', label: 'Значок' }, { k: 'title', t: 'i18n', label: 'Название' }, { k: 'text', t: 'i18n', label: 'Пояснение' }],
        itemTitle: (it) => it.title?.ru || 'Тезис',
      },
    ],
  },
  {
    id: 'work', title: 'Раздел «Работы»',
    fields: [
      { path: 'work.title', t: 'i18n', label: 'Заголовок раздела' },
      { path: 'work.all', t: 'i18n', label: 'Название фильтра «Все»' },
      { path: 'work.note', t: 'i18n-long', label: 'Примечание под сеткой работ', hint: 'Например, об авторских правах заказчиков.' },
    ],
  },
  {
    id: 'skills', title: 'Что я делаю',
    fields: [
      { path: 'skills.title', t: 'i18n', label: 'Заголовок раздела' },
      {
        path: 'skills.items', t: 'list', label: 'Направления', addLabel: 'направление',
        create: () => ({ icon: 'brand', title: { ru: '', en: '' }, text: { ru: '', en: '' } }),
        item: [{ k: 'icon', t: 'icon', label: 'Значок' }, { k: 'title', t: 'i18n', label: 'Название' }, { k: 'text', t: 'i18n-long', label: 'Описание' }],
        itemTitle: (it) => it.title?.ru || 'Направление',
      },
      { path: 'skills.cta', t: 'i18n', label: 'Текст кнопки у каждого направления', hint: 'Кнопка ведёт к работам этой категории.' },
      { path: 'skills.toolsTitle', t: 'i18n', label: 'Подпись к инструментам' },
      { path: 'skills.tools', t: 'strings', label: 'Инструменты' },
    ],
  },
  {
    id: 'cta', title: 'Арка «Давайте создадим»',
    fields: [
      { path: 'cta.title', t: 'i18n', label: 'Заголовок' },
      { path: 'cta.script', t: 'i18n', label: 'Рукописное слово' },
      { path: 'cta.text', t: 'i18n-long', label: 'Короткий текст' },
    ],
  },
  {
    id: 'contact', title: 'Контакты',
    fields: [
      { path: 'contact.title', t: 'i18n', label: 'Заголовок' },
      { path: 'contact.text', t: 'i18n-long', label: 'Текст' },
      { path: 'contact.button', t: 'i18n', label: 'Текст кнопки' },
      { path: 'contact.email', t: 'text', label: 'E-mail', type: 'email' },
      { path: 'contact.telegram', t: 'text', label: 'Telegram', hint: 'Например, @username. Можно оставить пустым.' },
      { path: 'contact.phone', t: 'text', label: 'Телефон', hint: 'Можно оставить пустым.' },
      { path: 'contact.behance', t: 'text', label: 'Ссылка на Behance или другое портфолио', hint: 'Можно оставить пустым.' },
      { path: 'contact.location', t: 'i18n', label: 'Город' },
      { path: 'contact.badge', t: 'i18n', label: 'Текст по кругу на печати справа', hint: 'Лучше 30–40 символов. Если оставить пустым, печать скроется.' },
      { path: 'contact.thanks', t: 'i18n', label: 'Подпись в самом низу' },
    ],
  },
  {
    id: 'meta', title: 'Название и описание сайта',
    fields: [
      { path: 'meta.title', t: 'i18n', label: 'Название во вкладке и в поиске' },
      { path: 'meta.description', t: 'i18n-long', label: 'Описание для поиска и соцсетей', hint: 'Лучше уложиться в 150 символов.' },
    ],
  },
  {
    id: 'ui', title: 'Подписи кнопок и меню',
    fields: [
      ['menuWork', 'Меню: работы'], ['menuAbout', 'Меню: обо мне'], ['menuSkills', 'Меню: навыки'], ['menuContact', 'Меню: контакты'],
      ['skip', 'Ссылка «К содержимому»'], ['back', 'Кнопка «Назад ко всем работам»'], ['next', 'Подпись «Следующий кейс»'],
      ['client', 'Строка «Заказчик»'], ['role', 'Строка «Задачи»'], ['year', 'Строка «Год»'], ['tools', 'Строка «Инструменты»'],
      ['task', 'Заголовок «Задача»'], ['solution', 'Заголовок «Решение»'], ['gallery', 'Название галереи'],
      ['close', 'Кнопка «Закрыть»'], ['prev', 'Кнопка «Назад»'], ['nextImg', 'Кнопка «Вперёд»'],
      ['currentWork', 'Подпись над названием работы на главном экране'], ['notFound', 'Сообщение: кейс не найден'],
    ].map(([k, label]) => ({ path: `ui.${k}`, t: 'i18n', label })),
  },
];
