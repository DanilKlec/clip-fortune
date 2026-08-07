# Синхронизация шрифтов с prod_robinzone_ai

Подключение шрифтов уже совпадает: тот же запрос Google Fonts (Plus Jakarta Sans 200–800 + курсивы, JetBrains Mono 300–500), те же семейства в токенах `sans / display / serif / mono`, тот же базовый текст (15px / 1.55 / `rlig, calt, ss01`). Расходится глобальная типографика заголовков и моноширинных элементов.

## Что не совпадает

| Правило | Оригинал | У нас |
| --- | --- | --- |
| Заголовки | `h1–h6`: Plus Jakarta Sans, `letter-spacing: -0.025em`, `line-height: 1.05`, `font-weight: 700`; `h1` — 800 | только `h1, h2, h3, .display`: `font-weight: 500`, `letter-spacing: -0.02em`, без `line-height`; `h4–h6` не заданы |
| `.font-display` / `.font-body` | явные CSS-классы с Plus Jakarta Sans | `.font-body` отсутствует |
| `code, kbd, pre, samp` | JetBrains Mono | правила нет — используется системный моношрифт |
| Поля ввода на мобильном | `font-size: 16px` для input/select/textarea (без зума в iOS) | правила нет |

Из-за этого наши заголовки заметно легче и с другим межстрочным интервалом, а моноширинный текст рендерится другим шрифтом.

## Что сделаю

В `src/styles.css`, в блоке `@layer base`, привести типографику к оригиналу один-в-один:

1. Заменить текущее правило заголовков на набор из оригинала: `h1–h6` — Plus Jakarta Sans, `-0.025em`, `line-height: 1.05`, `font-weight: 700`, отдельно `h1 { font-weight: 800 }`.
2. Добавить классы `.font-display` и `.font-body` с Plus Jakarta Sans.
3. Добавить `code, kbd, pre, samp { font-family: "JetBrains Mono", monospace }`.
4. Добавить медиа-правило для coarse-указателей: `font-size: 16px` у input/select/textarea.

Затем сверю в браузере на 393 / 768 / 1280 px вычисленные `font-family`, `font-weight`, `font-size`, `letter-spacing` и `line-height` заголовков и текста нашей главной страницы против www.robinzone.ai.

## Технические детали

- Правки только в `src/styles.css` (секция `@layer base`), компоненты не трогаю.
- Классы вида `.font-display` в Tailwind v4 уже генерируются из токена `--font-display`; явные CSS-правила из оригинала добавляются как дубль-страховка и для `.font-body`, которого в токенах нет.
