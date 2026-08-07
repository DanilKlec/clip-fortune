# Дизайн-система Robinzone: свод правил из основного проекта

Проанализировал прод-проект (`index.css`, `tailwind.config.ts`, `ui/button.tsx`, `home/SectionCard.tsx`, промо-секции). Ниже — правила, которые станут единым стандартом и для этого проекта. Они будут зафиксированы в файле `DESIGN_SYSTEM.md` (плюс краткая ссылка из `AGENTS.md`), чтобы все будущие изменения сверялись с ним.

**Границы работы:** шапка, подвал и MenuBarNav (нижний таб-бар) уже соответствуют оригиналу и не трогаются — ни сейчас, ни при последующем применении правил. Правила действуют на весь остальной контент страниц.

## 1. Цвет

- База тёмная, менять нельзя: background `232 18% 9%`, foreground `228 55% 95%`, card `232 16% 14%`, popover `232 18% 12%`, secondary `232 14% 21%`, muted `232 12% 26%`, muted-foreground `228 18% 68%`, border `230 20% 14%`, input `232 18% 12%`.
- Акцент один — volt `#C8FF00` (primary, accent, ring). Текст на volt всегда тёмный `#0a1100` (`primary-foreground` `84 100% 4%`).
- Вторичные акценты: sky `#00C2FF`, plasma/violet `#9F6EFF`, coral `#FF4D3D`, lime `#39FF88`. Каждый идёт в тройке: цвет + `dim` (10% заливка) + `border` (22% контур).
- Текстовая шкала: `--t0 #ffffff`, `--t1 #e2e6f4`, `--t2 #9098b8`, `--t3 #5c6280`, `--t4 #363d56`.
- Градиент бренда всегда `135deg, #C8FF00 → #00C2FF`. Никаких фиолетово-синих градиентов «по умолчанию».
- Запрещены хардкод-классы `text-white` / `bg-black` / `bg-[#...]` в компонентах — только токены.

## 2. Шрифты и текст

- Единственный шрифт интерфейса — **Plus Jakarta Sans** (sans, display, serif — все указывают на него). Моно — **JetBrains Mono** только для кода и «мета»-подписей.
- Body: 15px, line-height 1.55, weight 400, `font-feature-settings: "rlig","calt","ss01"`, антиалиасинг включён.
- Заголовки: `letter-spacing: -0.025em`, `line-height: 1.05`, h1 = 800, h2/h3 = 700.
- Eyebrow/бейдж-текст: 10–11px, weight 700, uppercase, tracking 0.1–0.18em.
- Мета-подписи (`.button-meta`): JetBrains Mono, 11px, uppercase, tracking 0.08em.
- Заголовки секций часто с «затухающим» градиентом текста `from-white to-white/40`; акцентные — `.text-gradient` (volt → sky).

## 3. Кнопки и интерактив

- Все кнопки — **полностью скруглённые** (`rounded-full`), 14px, weight 600, переход 150ms, `active:translate-y-[0.5px]`, disabled — opacity 45%.
- Размеры: sm 36px / default 40px / lg 48px; icon 40px, icon-sm 32px. В шапке CTA — 44px.
- Главный CTA — класс `.button-cta`: фон `#C8FF00`, текст `#0a1100`, свечение `0 0 20px rgba(200,255,0,.22)` + внутренний блик; hover `#D8FF44` и `translateY(-1px)`; active `scale(.97)`.
- Вторичный CTA — `.button-sky`; утилитарные — `.button-utility` (контур white/10 на secondary, pill).
- Бейджи — `.badge-volt` / `-sky` / `-coral` / `-lime` / `-violet`: 10px, 700, uppercase, tracking 0.1em, padding 3px 9px, pill, прозрачная заливка тона + контур тона.
- На тач-устройствах минимальная зона нажатия 44×44 (только при `pointer: coarse`).

## 4. Поверхности, карточки, отступы

- Радиусы: базовый `--radius: 0.625rem`; панели и шеллы — `rounded-2xl`, мелкие карточки — `rounded-xl`, промо-секции — `rounded-t-[28px] / md:48px / lg:72px`.
- Стандартная поверхность: `border border-white/10 bg-card` (паттерны `.glass`, `.studio-shell`, `.studio-panel`, `.assist-card-lite`).
- Горизонтальные отступы страницы — `.page-shell`: `px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12` с учётом safe-area.
- Вертикальные отступы секции: `py-12 sm:py-16 md:py-20`, внутренние `px-4 sm:px-8 md:px-12`.
- Промо-секции — стек карточек: каждая следующая наезжает на предыдущую (`-20px` мобайл / `-32px` от md), контур тона сверху, свечение — радиальные градиенты сверху по центру (без blur-фильтров).
- Тени: `card-hover` `0 12px 40px rgba(0,0,0,.6)`, свечения `glow-volt` / `glow-sky` / `glow-plasma`.

## 5. Каркас страницы (шапка/бар — только как справка, не меняем)

- Высота шапки 64px (`--header-height`), фиксированная, полупрозрачная с блюром; `--header-total` учитывает safe-area.
- Мобильный таб-бар: отступ контента `.mobile-bottom-nav-space` = `60px + safe-area + --vv-bottom`, отключается от 768px.
- Брейкпоинты: mobile <768, tablet 768–1023, desktop ≥1024. Контейнер — полная ширина с padding-ами 1rem/1.5rem/2rem/2.5rem/3rem.

## 6. Мобильный инвариант (не нарушать)

- `html/body/#root`: 100% ширины, `overflow-x: clip` (fallback `hidden`), никогда `overflow: hidden` на body.
- На <768px или coarse-pointer — жёсткий сброс ширины/паддингов, `min-inline-size: 0` для всех элементов, размер шрифта инпутов 16px (иначе iOS зумит).
- Высоты экранов — только `min(100dvh, var(--vvh))`.

## 7. Анимации

- Стандартные: `fade-up` (0.5s, cubic-bezier(.16,1,.3,1)), `animate-page-in` (0.3s), marquee 48s linear, `glow-volt-pulse` 2.5–3s, `blink-dot` 2s, `kenburns`, `otp-shake`.
- Глобально уважается `prefers-reduced-motion: reduce` — все анимации и переходы гасятся.
- Скроллбар: 4px, thumb `rgba(255,255,255,.10)`, pill; `.scrollbar-hide` для лент.

## 8. Legal-типографика

- `.legal-prose`: h2 1.35rem/700, h3 1.05rem/600, абзацы с margin 1rem, ссылки — volt с подчёркиванием (offset 3px), блок TOC — контур white/8, radius 10px, фон white/2%.

## Технические детали реализации в этом проекте

- Прод на Tailwind v3 (`tailwind.config.ts` + HSL-переменные без обёртки), у нас Tailwind v4 (`@theme inline` в `src/styles.css`). Правила переносятся по значениям, а не копированием конфига; в документе для каждого правила указывается v4-эквивалент.
- Создаётся `DESIGN_SYSTEM.md` в корне + ссылка на него в `AGENTS.md`.
- Отдельно фиксируется список расхождений, которые нужно будет закрыть следующим шагом: у нас нет утилит `.page-shell`, `.section-card-stack`, `.glass`, `.badge-*`, `.button-sky`, `.button-utility`, `.glow-*`, `.mobile-bottom-nav-space`, набора keyframes (`fade-up`, `marquee`, `glow-volt-pulse`, `blink-dot`), блока `prefers-reduced-motion`, правил тач-зоны 44px, токенов `--surface-elevated/--surface-hover`, `--success`, `volt-h/dim/bdr`, а `--plasma` указывает на `#00C2FF` вместо `#9F6EFF`, и radius-шкала расширена нестандартными значениями.
- Перенос этих утилит и токенов в `src/styles.css` выполняется в рамках этой задачи, чтобы документ и код совпадали. Компоненты в этом шаге не переписываются.
