// Описание редактируемых текстов сайта (data/site.json): группы, поля, подписи.
export const ICONS = [
  ['system', 'Фигуры'], ['format', 'Форматы'], ['print', 'Печать'], ['brand', 'Звезда'],
  ['banner', 'Баннер'], ['motion', 'Видео'], ['ui', 'Интерфейс'], ['stand', 'Стенд'],
];

export const DEFAULT_THEME = { paper: '#EEF3F0', ink: '#0D1B2A', orange: '#FF7B1C', teal: '#0B7F6F', cobalt: '#2B4C9B', peach: '#FFD9BD', ice: '#D3E6E0' };

export const THEME_LABELS = {
  paper: 'Фон страницы',
  ink: 'Основной тёмный (текст, раздел «Обо мне»)',
  orange: 'Акцентный оранжевый (контакты, акценты)',
  teal: 'Бирюзовый (раздел «Что я делаю», плашки)',
  cobalt: 'Синий (фокус, наведение)',
  peach: 'Персиковый (раздел «Работы»)',
  ice: 'Светлый бирюзовый (подложки изображений)',
};

export const SECTION_LABELS = {
  work: 'Работы',
  about: 'Обо мне',
  skills: 'Что я делаю',
  testimonials: 'Отзывы (покажутся, только если добавлен хотя бы один)',
  contact: 'Контакты',
};

// t: i18n | i18n-long | text | email | list | strings | photo
export const TEXT_GROUPS = [
  {
    id: 'hero', title: 'Главный экран',
    fields: [
      { path: 'person.name', t: 'i18n', label: 'Ваше имя' },
      { path: 'person.role', t: 'i18n', label: 'Специальность (зелёная пилюля)' },
      { path: 'hero.line1', t: 'i18n', label: 'Крупный заголовок, строка 1' },
      { path: 'hero.line2', t: 'i18n', label: 'Крупный заголовок, строка 2 (оранжевая)' },
      { path: 'hero.tagline', t: 'i18n-long', label: 'Рукописный слоган' },
      { path: 'hero.cta', t: 'i18n', label: 'Текст кнопки' },
      { path: 'person.photo', t: 'photo', label: 'Ваше фото', hint: 'Если загрузить фото, оно заменит смену работ на главном экране.' },
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
      { path: 'about.statLabels.cases', t: 'i18n', label: 'Подпись к числу кейсов', hint: 'Числа считаются сами по опубликованным работам.' },
      { path: 'about.statLabels.directions', t: 'i18n', label: 'Подпись к числу направлений' },
      { path: 'about.statLabels.materials', t: 'i18n', label: 'Подпись к числу материалов' },
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
      { path: 'skills.toolsTitle', t: 'i18n', label: 'Подпись к инструментам' },
      { path: 'skills.tools', t: 'strings', label: 'Инструменты' },
    ],
  },
  {
    id: 'testimonials', title: 'Отзывы',
    fields: [
      { path: 'testimonials.title', t: 'i18n', label: 'Заголовок раздела' },
      {
        path: 'testimonials.items', t: 'list', label: 'Отзывы', addLabel: 'отзыв',
        create: () => ({ text: { ru: '', en: '' }, author: { ru: '', en: '' } }),
        item: [{ k: 'text', t: 'i18n-long', label: 'Текст отзыва' }, { k: 'author', t: 'i18n', label: 'Автор (имя, должность)' }],
        itemTitle: (it) => it.author?.ru || 'Отзыв',
        hint: 'Добавляйте только настоящие отзывы. Раздел появится на сайте, когда будет хотя бы один.',
      },
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
