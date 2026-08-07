# Robinzone Design System

Единый свод правил фронтенда. Источник истины — основной продукт robinzone.ai
(`prod_robinzone_ai`). Любое изменение UI в этом проекте сверяется с этим документом.

Исключение: `SiteHeader`, `SiteFooter` и `MobileBottomNav` (MenuBarNav) уже приведены
к оригиналу 1:1 — их не менять.

Проект на Tailwind v4: токены живут в `src/styles.css` (`:root` + `@theme inline`),
кастомные утилиты — через `@utility`. `tailwind.config.js` не используется.

## 1. Цвет

| Токен | Значение |
| --- | --- |
| background | `hsl(232 18% 9%)` |
| foreground | `hsl(228 55% 95%)` |
| card | `hsl(232 16% 14%)` |
| popover | `hsl(232 18% 12%)` |
| secondary | `hsl(232 14% 21%)` |
| muted | `hsl(232 12% 26%)` |
| muted-foreground | `hsl(228 18% 68%)` |
| border | `hsl(230 20% 14%)` |
| input | `hsl(232 18% 12%)` |
| primary / accent / ring | `hsl(72 100% 50%)` (volt `#C8FF00`) |
| primary-foreground | `hsl(84 100% 4%)` (`#0a1100`) |
| success | `hsl(150 100% 60%)` |
| destructive | `hsl(4 100% 60%)` |
| surface-elevated / surface-hover | `hsl(232 16% 17%)` / `hsl(232 14% 24%)` |

Акцентные тона — всегда тройкой «цвет + dim 10% + border 22%»:
volt `#C8FF00` (hover `#D8FF44`), sky `#00C2FF` (hover `#33CEFF`),
plasma/violet `#9F6EFF` (hover `#B389FF`), coral `#FF4D3D`, lime `#39FF88`.

Текстовая шкала: `--t0 #ffffff`, `--t1 #e2e6f4`, `--t2 #9098b8`, `--t3 #5c6280`, `--t4 #363d56`.

Градиент бренда `linear-gradient(135deg, #C8FF00 0%, #00C2FF 100%)` — только для лого/бренда
(`.text-gradient-volt-sky`, `.bg-gradient-brand`). В контенте градиентных заливок нет:
шкалы, полоски прогресса и бейджи — сплошной `var(--volt)`.
`.text-gradient` = volt → plasma (как в оригинале).

Запрещено: `text-white`, `bg-black`, `bg-[#...]` и любые хардкод-цвета в компонентах —
используем токены и утилиты ниже.

## 2. Типографика

- Интерфейс: **Plus Jakarta Sans** (`font-sans`, `font-display`, `font-serif` — все на неё).
- Моно: **JetBrains Mono** — только код и мета-подписи.
- Body: 15px / 1.55 / weight 400, `font-feature-settings: "rlig" 1, "calt" 1, "ss01" 1`.
- Заголовки секций: `font-display font-extrabold uppercase`, `tracking-[-0.02em]`,
  `leading-[0.9]` (крупные) / `leading-[0.95]` (секционные), размер через clamp:
  `text-[clamp(2rem,6vw,3.75rem)]` и `text-[clamp(1.5rem,5.5vw,2.75rem)]`, плюс `[text-wrap:balance]`.
- Акцент в заголовке — только вертикальное затухание:
  `bg-gradient-to-b from-white to-white/40` (или `from-volt to-volt/60`) + `bg-clip-text`.
- Eyebrow: 10px, `font-extrabold`, uppercase, tracking `0.25em`. Бейджи `.badge-*`: 10px, 700, tracking `0.1em`.
- Мета-подписи: `.button-meta` (JetBrains Mono, 11px, uppercase, tracking `0.08em`).
- Курсив в заголовках не используется.

## 3. Кнопки, бейджи, интерактив

- Все кнопки — `rounded-full`, 14px, weight 600, transition 150ms,
  `active:translate-y-[0.5px]`, disabled `opacity-45`.
- Высоты: sm 36 / default 40 / lg 48; icon 40, icon-sm 32. CTA в шапке — 44.
- Главный CTA — `.button-cta` (volt фон, тёмный текст, свечение, hover `-1px`, active `.97`).
- Вторичный — `.button-sky`. Утилитарный — `.button-utility` (pill, `border-white/10`, `bg-secondary`).
- Бейджи — `.badge-volt` / `.badge-sky` / `.badge-plasma` / `.badge-coral` / `.badge-lime` / `.badge-violet`:
  10px, 700, uppercase, tracking `0.1em`, padding `3px 9px`, pill, прозрачная заливка + контур тона.
- Тач-устройства (`pointer: coarse`): минимальная зона нажатия 44×44.

## 4. Поверхности и сетка

- Радиусы: `--radius: 0.625rem`; панели — `rounded-2xl`, мелкие карточки — `rounded-xl`,
  промо-секции — `rounded-t-[28px] md:rounded-t-[48px] lg:rounded-t-[72px]`.
- Базовая поверхность: `.glass` = `border border-white/10 bg-card`.
- Горизонтальные отступы страницы: `.page-shell`
  (`px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12` + safe-area).
- Вертикальный ритм секции: `py-12 sm:py-16 md:py-20`, внутренние `px-4 sm:px-8 md:px-12`.
- Стек промо-секций: `.section-card-stack` — каждая следующая наезжает на предыдущую
  (`-20px`, от md `-32px`), контур тона сверху, свечение — радиальные градиенты
  сверху по центру, без blur-фильтров.
- Тени: `shadow-card-hover`, свечения `.glow-volt`, `.glow-volt-btn`, `.glow-sky`, `.glow-plasma`.

## 5. Каркас (справочно, не менять)

- Шапка 64px (`--header-height`), sticky, полупрозрачная с блюром; `--header-total` учитывает safe-area.
- Мобильный таб-бар: `.mobile-bottom-nav-space` = `60px + safe-area + var(--vv-bottom)`, отключается от 768px.
- Брейкпоинты: mobile <768, tablet 768–1023, desktop ≥1024.

## 6. Мобильный инвариант

- `html/body/#root`: ширина 100%, `overflow-x: clip` (fallback `hidden`).
  Никогда `overflow: hidden` на body — ломает скролл в iOS Safari.
- <768px или coarse pointer: сброс ширины/паддингов, `min-inline-size: 0` для всех элементов,
  `font-size: 16px` у инпутов (иначе iOS зумит).
- Высоты экрана: только `min(100dvh, var(--vvh, 100dvh))` (`.h-screen-safe`, `.min-h-screen-safe`).

## 7. Анимации

- `.animate-fade-up` (0.5s `cubic-bezier(.16,1,.3,1)`), `.animate-page-in` (0.3s),
  `.animate-marquee` (48s linear), `.animate-glow-volt` / `.animate-glow-volt-pulse`,
  `.animate-blink`, `.animate-scale-in`.
- Глобально уважается `prefers-reduced-motion: reduce`.
- Скроллбар 4px, thumb `rgba(255,255,255,0.10)`, pill; `.scrollbar-hide` для лент.

## 8. Legal-типографика

`.legal-prose`: h2 `1.35rem`/700, h3 `1.05rem`/600, абзацы `margin-bottom: 1rem`,
ссылки — volt с подчёркиванием (`text-underline-offset: 3px`),
TOC — `border white/8`, `radius 10px`, фон `white/2%`.
