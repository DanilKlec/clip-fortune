# Шапка, подвал и шрифты — 1:1 с robinzone.ai

Цель: посетитель не должен замечать, что Virality Predictor — отдельное приложение. Шапка, подвал, шрифты и цветовые токены копируются с основного сайта.

## Шрифты

Подключаем те же семейства, что и на robinzone.ai:
- Plus Jakarta Sans (400/500/600/700/800) — весь текст
- JetBrains Mono (300/400/500) — моно-акценты, цифры, бейджи

Токены `--font-sans` / `--font-display` = Plus Jakarta Sans, `--font-mono` = JetBrains Mono. Базовый размер body — 15px, как на основном сайте.

## Цветовые токены

Приводим к палитре основного сайта:
- фон приложения `#06080f`, фон подвала `#03131a`
- volt (primary) — лаймовый акцент основного сайта
- sky — голубой акцент (`#00C2FF`), используется в подвале
- границы `rgba(255,255,255,0.06)`

Точные значения снимаются с продакшн-стилей robinzone.ai при реализации, чтобы не подгонять на глаз.

## Шапка

Стиль повторяется пиксель в пиксель, контент остаётся наш:
- `sticky top-0`, высота 64px, фон `rgba(6,8,15,0.88)`, `backdrop-blur 32px` + `saturate 150%`, нижняя граница `white/6`
- слева логотип: плитка 36×36, радиус 10px, фон volt с мягким свечением, внутри тот же знак; рядом «Robinzone» — font-display, 20px, extra-bold, tracking `-0.04em`
- под/рядом сохраняем подпись продукта «Virality Predictor» в стиле основного сайта
- справа остаются наши элементы (email, History, Log out), оформленные как пилюли основного сайта: высота 36px, радиус full, фон `rgba(13,15,26,0.6)`, граница `white/8`
- меню Image/Video/AI Models/Assist/Studio/Pricing и кнопку Sign In не добавляем

## Подвал

Полная копия подвала robinzone.ai:
- фон `#03131a`, верхняя граница `sky/20`, три радиальных голубых свечения поверх фона
- блок бренда: логотип-плитка 34px + «Robinzone» (20px, extra-bold) и подпись «Your AI content creation basecamp. Hundreds of models, one subscription.» (13px)
- 4 колонки (2 на мобиле): Product (AI Models, Creation Studio, Pricing), Resources (Help Center), Company (About, Careers + бейдж Hiring, Contact), Legal (Terms of Use, Privacy Policy, Cookie Policy, Billing Terms, Refund Policy)
- заголовки колонок: 11px, bold, uppercase, tracking `0.16em`, цвет sky; ссылки 13px `sky-100/80`, hover → sky
- нижняя полоса: «© 2026 Robinzone · ONLYAPPS LTD., Makariou III, 228, Agios Pavlos Court A, 7th floor, Flat/Office 712, 3030 Limassol, Cyprus» (11px)
- ссылки Product/Resources/Company ведут на соответствующие страницы robinzone.ai
- ссылки Legal открывают наши существующие overlay-модалки (тексты уже загружены в проект), а не внешние страницы
- старые блоки Support/Cancel Subscription и плашки способов оплаты из подвала убираются (страница `/cancel-subscription` остаётся доступной по прямой ссылке)

## Технические детали

- `src/routes/__root.tsx` — подключение Google Fonts (Plus Jakarta Sans + JetBrains Mono)
- `src/styles.css` — токены цветов, `--font-*`, базовый размер/вес текста, утилита свечения логотипа
- `src/components/virality/site/SiteHeader.tsx` — переверстка шапки
- `src/components/virality/site/SiteFooter.tsx` — переверстка подвала (удаление payment-badges и колонки Support)
- `src/lib/site-links.ts` — добавление ссылок на models / creation-studio / pricing / help-center / about / careers / contact

Проверка: скриншот шапки и подвала нашего приложения сверяется с эталонными скриншотами robinzone.ai на 1280px и на мобильной ширине.
