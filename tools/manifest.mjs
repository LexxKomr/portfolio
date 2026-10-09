// Начальный набор работ: откуда брать исходники и как их подписать.
// Запускается один раз (npm run seed). Дальше работами управляет data/works.json (и админка).
export const SRC = 'C:/Users/Admin/Desktop/Портфолио';
export const STAGING = 'D:/Claude works/portfolio/_staging';

export const categories = [
  { id: 'brand',    title: { ru: 'Бренд и события',        en: 'Brand & events' } },
  { id: 'uiux',     title: { ru: 'UI/UX',                  en: 'UI/UX' } },
  { id: 'digital',  title: { ru: 'Digital и баннеры',      en: 'Digital & banners' } },
  { id: 'motion',   title: { ru: 'Моушн',                  en: 'Motion' } },
  { id: 'print',    title: { ru: 'Полиграфия',             en: 'Print' } },
  { id: 'expo',     title: { ru: 'Выставки и упаковка',    en: 'Exhibition & packaging' } },
  { id: 'greetings',title: { ru: 'Открытки и иллюстрации', en: 'Cards & illustration' } },
];

const brand = { ru: 'Работа в штате · Группа «Борлас»', en: 'In-house · Borlas Group' };

// i: изображение (src относительно SRC, либо абсолютный путь в STAGING), v: видео
export const works = [
  {
    slug: 'cae-day', heroIndex: 0, heroCrop: { left: 0, top: 740, width: 1520, height: 1900 }, category: 'brand', year: '2025', featured: true,
    client: { ru: 'Группа «Борлас» × Fidesys', en: 'Borlas Group × Fidesys' }, badge: brand,
    role: { ru: 'Айдентика мероприятия, digital-материалы, адаптации', en: 'Event identity, digital assets, adaptations' },
    tags: ['Photoshop', 'Illustrator', 'After Effects'],
    title: { ru: 'CAE Day 2025', en: 'CAE Day 2025' },
    summary: { ru: 'Визуальная система отраслевой конференции по инженерному анализу.', en: 'Visual system for an engineering-analysis industry conference.' },
    task: {
      ru: 'Собрать единый узнаваемый образ конференции для баннеров на сайтах-партнёрах, рассылок, рекламных модулей и всплывающих окон, при этом сохранить бренды двух компаний.',
      en: 'Build one recognisable look for the conference across partner-site banners, newsletters, ad modules and pop-ups while keeping both company brands intact.',
    },
    solution: {
      ru: 'Диагональ делит композицию на тёплую и холодную половины: оранжевый бренда Борлас встречается с бирюзово-синим Fidesys. В центре — расчётная модель турбины, она же визуально объясняет тему события. Тот же приём масштабируется от баннера 840×200 до рекламного модуля на полосу.',
      en: 'A diagonal splits the layout into a warm and a cool half: the Borlas orange meets the Fidesys teal-blue. A turbine simulation model sits at the centre and explains the topic at a glance. The same device scales from an 840×200 banner to a full-page ad module.',
    },
    images: [
      { src: 'CAE Day баннер САПР/Макет модуля/Рекламный модуль САПР на всю страницу.png', alt: { ru: 'Рекламный модуль CAE Day на всю полосу', en: 'CAE Day full-page ad module' } },
      { src: 'CAE Day баннер САПР/Баннер на сайт/Баннер (1200х800).jpg', alt: { ru: 'Баннер CAE Day 1200×800', en: 'CAE Day banner 1200×800' } },
      { src: 'CAE Day для TAdviser/В рассылку (1000х200)/Баннер 1400х400.jpg', alt: { ru: 'Баннер для рассылки', en: 'Newsletter banner' } },
      { src: 'PopUp для CAE Day/PopUP-для-CAE-Day.png', alt: { ru: 'Всплывающее окно CAE Day', en: 'CAE Day pop-up' } },
    ],
  },
  {
    slug: 'bi-system', category: 'uiux', year: '2026', featured: true,
    client: { ru: 'Аналитическая BI-система', en: 'Analytics BI system' }, badge: { ru: 'Интерфейс', en: 'Interface' },
    role: { ru: 'UX-структура, UI-дизайн 20+ экранов', en: 'UX structure, UI design for 20+ screens' },
    tags: ['UI/UX', 'Dashboard', 'Data viz'],
    title: { ru: 'BI-система для аналитиков внешней торговли', en: 'BI system for foreign-trade analysts' },
    summary: { ru: 'Четыре предметные области, сквозные фильтры и три уровня детализации на каждом экране.', en: 'Four subject areas, shared filters and three levels of detail on every screen.' },
    task: {
      ru: 'Дать аналитикам один вход в разрозненные данные: итоги ВЭД, мировую торговлю, экспортный потенциал и торговлю услугами. Экран должен помогать сравнивать, а не просто показывать цифры.',
      en: 'Give analysts a single entry point into scattered data: foreign-trade results, world trade, export potential and services trade. Each screen should help compare, not just display numbers.',
    },
    solution: {
      ru: 'Каждый раздел устроен одинаково: «Свод», «Детализация», «Исходные данные». Фильтры живут сверху и сохраняются как шаблоны, показатели собраны в крупные плитки, карта и графики отвечают на один вопрос за раз. Цвет кодирует регион, размер — объём.',
      en: 'Every section works the same way: Summary, Detail, Source data. Filters sit on top and can be saved as templates, key figures are large tiles, and the map and charts each answer one question. Colour encodes region, size encodes volume.',
    },
    images: [
      { src: 'ui_ux/bi-система 2/2. Главная страница (разводящая).png', alt: { ru: 'Главная страница BI-системы', en: 'BI system home page' } },
      { src: 'ui_ux/bi-система 2/4. Мировая торговля (свод).png', alt: { ru: 'Раздел «Мировая торговля», свод', en: 'World trade section, summary' } },
      { src: 'ui_ux/bi-система 2/1. Страница авторизации.png', alt: { ru: 'Страница авторизации', en: 'Sign-in page' } },
      { src: 'ui_ux/bi-система 2/3. Итоги ВЭД участников (свод).png', alt: { ru: 'Итоги ВЭД участников, свод', en: 'Foreign-trade results, summary' } },
      { src: 'ui_ux/bi-система 2/5. Экспортный потенциал (свод).png', alt: { ru: 'Экспортный потенциал, свод', en: 'Export potential, summary' } },
      { src: 'ui_ux/bi-система 2/6. Торговля услугами (свод).png', alt: { ru: 'Торговля услугами, свод', en: 'Services trade, summary' } },
      { src: 'ui_ux/bi-система 2/7. Шаблоны фильтров (вэд).png', alt: { ru: 'Шаблоны фильтров', en: 'Filter templates' } },
    ],
  },
  {
    slug: 'fidesys-promo', heroIndex: 1, category: 'digital', year: '2026', featured: true,
    client: { ru: 'Группа «Борлас» × Fidesys', en: 'Borlas Group × Fidesys' }, badge: brand,
    role: { ru: 'Баннеры в трёх форматах', en: 'Banners in three formats' },
    tags: ['Photoshop', 'Adaptive layout'],
    title: { ru: 'Акция «Определи свой уровень прочности»', en: 'Promo “Find your strength level”' },
    summary: { ru: 'Один макет, три формата: горизонтальный, вертикальный и широкая шапка.', en: 'One layout, three formats: landscape, portrait and a wide header.' },
    task: { ru: 'Запустить акцию на экранах, в соцсетях и на сайте партнёра. Форматы разные, а акцию должны узнавать везде.', en: 'Launch a promo on screens, social media and a partner site. Formats differ, but the promo has to be recognised everywhere.' },
    solution: { ru: 'Крупная оранжевая плашка с заголовком держит композицию, серая — срок проведения. Фоновые полосы дают динамику и перестраиваются под каждый формат без потери иерархии.', en: 'A large orange panel carries the headline and a grey one holds the dates. Background stripes add movement and re-flow for each format without losing hierarchy.' },
    images: [
      { src: 'Акция Fidesys/Баннер 1920х1080 (С лого Борлас).jpg', alt: { ru: 'Баннер акции 1920×1080', en: 'Promo banner 1920×1080' } },
      { src: 'Акция Fidesys/Баннер 1080х1920 (книжная)(С лого Борлас).jpg', alt: { ru: 'Баннер акции 1080×1920', en: 'Promo banner 1080×1920' } },
      { src: 'Акция Fidesys/САПР и графика (2427х300).jpg', alt: { ru: 'Широкий баннер 2427×300', en: 'Wide banner 2427×300' } },
      { src: 'Иллюстрация Преферентум/Иллюстрация продвижение Преферентум.jpg', alt: { ru: 'Иллюстрация для продвижения «Преферентум»', en: 'Promo illustration for “Preferentum”' } },
    ],
  },
  {
    slug: 'motion-banners', coverStack: true, category: 'motion', year: '2025', featured: true,
    client: { ru: 'Группа «Борлас»', en: 'Borlas Group' }, badge: brand,
    role: { ru: 'Анимация, подбор ритма, оптимизация веса', en: 'Animation, pacing, file-size optimisation' },
    tags: ['After Effects', 'GIF / MP4'],
    title: { ru: 'Анимированные баннеры', en: 'Animated banners' },
    summary: { ru: 'Лёгкие петли для сайтов-партнёров: заметны, но не раздражают и весят меньше мегабайта.', en: 'Light loops for partner sites: noticeable without being annoying, under a megabyte each.' },
    task: { ru: 'Привлечь внимание на площадке с жёстким лимитом веса и без звука.', en: 'Catch attention on a placement with a strict weight limit and no sound.' },
    solution: { ru: 'Короткие циклы с одним акцентным движением, отдельные версии под разные размеры и с рекламой / без неё. Формат подбирался под площадку: GIF с узорным дизерингом или MP4.', en: 'Short loops with one accent move, separate versions for different sizes, with and without the ad. The format fit the placement: GIF with pattern dithering or MP4.' },
    images: [
      { v: 'CAE Day баннер САПР/CAE Day баннер на сайт (GIF)/GIF/CAE Day версия 2.mp4', alt: { ru: 'Анимация CAE Day, версия 2', en: 'CAE Day animation, version 2' } },
      { v: 'CAE Day баннер САПР/CAE Day баннер на сайт (GIF)/GIF/CAE Day версия 3.mp4', alt: { ru: 'Анимация CAE Day, версия 3', en: 'CAE Day animation, version 3' } },
      { v: 'CAE Day баннер САПР/CAE Day баннер на сайт (GIF)/GIF/CAE Day версия 1.mp4', alt: { ru: 'Анимация CAE Day, версия 1', en: 'CAE Day animation, version 1' } },
      { v: 'CAE Day для TAdviser/Баннер (гифка)/Гифка ver.1.mp4', alt: { ru: 'Анимированный баннер для TAdviser', en: 'Animated banner for TAdviser' } },
    ],
  },
  {
    slug: 'tflex-migration', category: 'digital', year: '2026',
    client: { ru: 'Группа «Борлас»', en: 'Borlas Group' }, badge: brand,
    role: { ru: 'Инфографика, рекламный модуль, one-pager', en: 'Infographic, ad module, one-pager' },
    tags: ['Illustrator', 'Infographic'],
    title: { ru: 'Переход на T-FLEX PLM', en: 'Migration to T-FLEX PLM' },
    summary: { ru: 'Сложную тему миграции PLM-систем нужно было показать на одной полосе.', en: 'A complex PLM-migration topic had to fit on one page.' },
    task: { ru: 'Объяснить за несколько секунд, от чего уходят, куда идут и что получают. Модуль идёт в отраслевое издание, а one-pager — клиентам.', en: 'Explain in seconds what is being left behind, where to and what is gained. The module runs in an industry publication, the one-pager goes to clients.' },
    solution: { ru: 'Композиция читается слева направо: проблемы старой системы, стрелки перехода, выгоды новой. Иконки одного стиля и цвета бренда собирают тезисы в узнаваемые группы.', en: 'The layout reads left to right: problems of the old system, transition arrows, benefits of the new one. Icons in a single style and brand colour group the points.' },
    images: [
      { src: 'OnePage. T-Flex PLM/Рекламный модуль для САПР/Миграция на T-FLEX PLM_сапр и графика_рекламный модуль [половина страницы].jpg', alt: { ru: 'Рекламный модуль «Переход на T-FLEX PLM»', en: '“Migration to T-FLEX PLM” ad module' } },
      { src: STAGING_P('tflex_one_p1.png'), alt: { ru: 'One-pager по миграции на T-FLEX PLM', en: 'One-pager on T-FLEX PLM migration' } },
      { src: 'OnePage. T-Flex PLM/Иллюстрация Tadviser/Иллюстрация Миграция на T-FLEX PLM.jpg', alt: { ru: 'Иллюстрация для TAdviser', en: 'Illustration for TAdviser' } },
    ],
  },
  {
    slug: 'leaflets', category: 'print', year: '2025–2026',
    client: { ru: 'Группа «Борлас»', en: 'Borlas Group' }, badge: brand,
    role: { ru: 'Макеты, инфографика, подготовка к печати', en: 'Layouts, infographics, print preparation' },
    tags: ['InDesign', 'Illustrator', 'Photoshop'],
    title: { ru: 'Листовки и one-pager’ы', en: 'Leaflets and one-pagers' },
    summary: { ru: 'Серия материалов для выставок и продаж: от услуг техподдержки до промышленной автоматизации.', en: 'A series for trade shows and sales: from technical support to industrial automation.' },
    task: { ru: 'Упаковать плотный технический контент в листовки, которые читают на стенде за минуту.', en: 'Pack dense technical content into leaflets that people can read at a stand within a minute.' },
    solution: { ru: 'Крупные заголовки, блоки с цифрами и цветные плашки задают порядок чтения. Лучше всего получилась листовка выставки ДЦС: цвет делит смысловые блоки, цифры вынесены на первый план.', en: 'Large headings, number blocks and colour panels set the reading order. The strongest is the DCS exhibition leaflet: colour separates the meaning blocks and the numbers come first.' },
    images: [
      { src: 'Листовка. Выставка ДЦС/Листовка. ДЦС. Лист 1.jpg', alt: { ru: 'Листовка выставки ДЦС', en: 'DCS exhibition leaflet' } },
      { src: 'Листовка. Тех Поддержка Борлас/Листовка Тех поддержка Лист 1.jpg', alt: { ru: 'Листовка «Центр технической поддержки»', en: 'Leaflet “Technical support centre”' } },
      { src: 'Листовка. Сервис ЦТП/Листовка JPEG Лист 1.jpg', alt: { ru: 'Листовка сервиса ЦТП', en: 'CTP service leaflet' } },
      { src: 'Листовка. Борлас ДПК/Листовка ДПК лист 1.jpg', alt: { ru: 'Листовка «Управление жизненным циклом изделий»', en: 'Leaflet “Product lifecycle management”' } },
      { src: 'Листовка. Направление 1С/Листовка. 1С. Лист 1.jpg', alt: { ru: 'Листовка «Центр цифровой трансформации на 1С»', en: 'Leaflet “Digital transformation centre on 1C”' } },
    ],
  },
  {
    slug: 'greetings', heroIndex: 0, category: 'greetings', year: '2025–2026', featured: true,
    client: { ru: 'Группа «Борлас»', en: 'Borlas Group' }, badge: brand,
    role: { ru: 'Концепция, иллюстрация, вёрстка', en: 'Concept, illustration, layout' },
    tags: ['Photoshop', 'Illustration'],
    title: { ru: 'Праздничные открытки', en: 'Holiday greeting cards' },
    summary: { ru: 'Корпоративные поздравления, которые хочется переслать: у каждой открытки своя тема и своё настроение.', en: 'Corporate greetings worth forwarding: every card has its own subject and mood.' },
    task: { ru: 'Поздравлять сотрудников, партнёров и клиентов, не повторяясь и оставаясь в рамках фирменного стиля.', en: 'Greet staff, partners and clients without repeating yourself and while staying within the brand.' },
    solution: { ru: 'Для каждой даты — своя среда: зимний городок на катке, ночной офис в лесу, письма и газеты военных лет, химическая лаборатория. Бренд присутствует через цвет и логотип, а не через шаблон.', en: 'Each date gets its own world: a winter town with a rink, an office glowing in a night forest, wartime letters and newspapers, a chemistry lab. The brand is carried by colour and logo, not by a template.' },
    images: [
      { src: 'Открытки/Эдит_Про_Вариант_2.jpg', alt: { ru: 'Новогодняя открытка Borlas Edit', en: 'New Year card for Borlas Edit' } },
      { src: 'Открытки/Вариант_1.jpg', alt: { ru: 'Новогодняя открытка Борлас', en: 'New Year card for Borlas' } },
      { src: 'Открытки/Открытка 9 мая.jpg', alt: { ru: 'Открытка ко Дню Победы', en: 'Victory Day card' } },
      { src: 'Открытки/Открытка день Химика.jpg', alt: { ru: 'Открытка ко Дню химика', en: 'Chemist’s Day card' } },
      { src: 'Открытки/Открытка день эколога_2.jpg', alt: { ru: 'Открытка ко Дню эколога', en: 'Ecologist’s Day card' } },
    ],
  },
  {
    slug: 'expo-stand', category: 'expo', year: '2025',
    client: { ru: 'Borlas Edit', en: 'Borlas Edit' }, badge: brand,
    role: { ru: 'Концепция и макеты выставочного стенда, лифлета и упаковки', en: 'Concept and artwork for stand, leaflet and packaging' },
    tags: ['Illustrator', 'Large format'],
    title: { ru: 'Выставочный стенд и упаковка Borlas Edit', en: 'Borlas Edit exhibition stand and packaging' },
    summary: { ru: 'Стенд, лифлет с двумя фальцами и фирменная упаковка в одном стиле.', en: 'A stand, a double-fold leaflet and branded packaging in one style.' },
    task: { ru: 'Показать компетенции центра цифровой трансформации, партнёрские статусы и проекты в формате, который читается с расстояния и вблизи.', en: 'Present the digital-transformation centre’s expertise, partner statuses and projects in a format that reads from afar and up close.' },
    solution: { ru: 'Три смысловые зоны стенда: компетенции, ключевые цифры и контакты со статусами партнёра. Тёмно-синий фон усиливает оранжевые акценты, иконки и изометрия объясняют направления без текста. Тот же язык переходит на лифлет и пакет.', en: 'The stand has three zones: expertise, key figures, and contacts with partner statuses. A deep-blue ground lifts the orange accents, while icons and isometric drawings explain directions without text. The same language carries over to the leaflet and the bag.' },
    images: [
      { src: 'Макет стенда Эдит Про/Стены 1-9.png', alt: { ru: 'Развёртка стен выставочного стенда', en: 'Exhibition stand wall layout' } },
      { src: 'Макет лифлета А4 (2 фальца) для Эдит Про/Внеш. сторона (нумерованная).jpg', alt: { ru: 'Лифлет, внешняя сторона', en: 'Leaflet, outside' } },
      { src: 'Макет лифлета А4 (2 фальца) для Эдит Про/Внутр. сторона (нумерованная).jpg', alt: { ru: 'Лифлет, внутренняя сторона', en: 'Leaflet, inside' } },
      { src: 'Макет пакета 25х35см/Макет пакета (пример).jpg', alt: { ru: 'Макет фирменного пакета', en: 'Branded bag artwork' } },
    ],
  },
  {
    slug: 'server-cabinet', heroIndex: 0, heroPos: '50% 58%', category: 'expo', year: '2026',
    client: { ru: 'Борлас × НПЦ БАС ЯО', en: 'Borlas × NPC BAS YaO' }, badge: brand,
    role: { ru: 'Графика брендинга серверного шкафа', en: 'Server-cabinet branding artwork' },
    tags: ['Illustrator', 'Large format'],
    title: { ru: 'Брендинг серверного шкафа', en: 'Server cabinet branding' },
    summary: { ru: 'Тёмная графика с дроном и сетью точек превращает техническое оборудование в витрину проекта.', en: 'Dark artwork with a drone and a node network turns hardware into a project showcase.' },
    task: { ru: 'Оформить серверный шкаф проекта беспилотных систем региона так, чтобы он выглядел как экспонат, а не как стойка в серверной.', en: 'Brand a server cabinet for a regional unmanned-systems project so it looks like an exhibit and not just a rack.' },
    solution: { ru: 'Линейный дрон на графитовом фоне и тонкая сеть связей говорят о теме без лишних слов. Герб и логотипы собраны по вертикальной оси, а оранжевая линия отделяет партнёров от основной композиции.', en: 'A line-art drone on graphite and a fine network of links speak to the theme in few words. The coat of arms and logos run along a vertical axis, and an orange line separates the partners from the main composition.' },
    images: [
      { src: 'Макет брендинга серверного шкафа/Макет дизайна серверного шкафа_Широкая сторона.png', alt: { ru: 'Макет широкой стороны шкафа', en: 'Wide side artwork' } },
      { src: 'Макет брендинга серверного шкафа/Пример1.jpg', alt: { ru: 'Пример применения на шкафу', en: 'Cabinet mockup' } },
      { src: 'Макет брендинга серверного шкафа/Пример.jpg', alt: { ru: 'Пример применения на шкафу, вид 2', en: 'Cabinet mockup, view 2' } },
    ],
  },
  {
    slug: 'cards-certificates', category: 'brand', year: '2025–2026',
    client: { ru: 'Группа «Борлас»', en: 'Borlas Group' }, badge: brand,
    role: { ru: 'Визитки, шаблон сертификата', en: 'Business cards, certificate template' },
    tags: ['Illustrator', 'InDesign'],
    title: { ru: 'Визитки и сертификат', en: 'Business cards and certificate' },
    summary: { ru: 'Небольшие носители бренда, из которых складывается впечатление о компании.', en: 'Small brand carriers that shape the impression of a company.' },
    task: { ru: 'Сделать визитки для компании и совместного проекта с партнёром, а также сертификат об аттестации инженеров с подписями двух сторон.', en: 'Create business cards for the company and a joint partner project, plus a certificate of engineer attestation signed by both sides.' },
    solution: { ru: 'Визитки: спокойный светлый вариант со светящимися волнами и тёмная версия с крупным слоганом. Сертификат: орнаментальная рамка в цветах бренда и крупная гарнитура с засечками для имени получателя.', en: 'Cards: a calm light version with glowing waves and a dark one with a large slogan. Certificate: an ornamental frame in brand colours and a large serif for the recipient’s name.' },
    images: [
      { src: 'Сертификаты/Сертификат Сейлам/Сертификат_1.png', alt: { ru: 'Сертификат об аттестации', en: 'Attestation certificate' } },
      { src: 'Визитки/Визитка Fabrica One/Вариант 4.png', alt: { ru: 'Визитка Борлас × Bering Pro', en: 'Business card Borlas × Bering Pro' } },
      { src: STAGING_P('visitka_p1.png'), alt: { ru: 'Визитка компании', en: 'Company business card' } },
    ],
  },
];

function STAGING_P(f) { return `@staging/${f}`; }
