# Шапка, подвал и Legal-ссылки — доводка под robinzone.ai

## 1. Подвал: убрать лишнюю высоту

Сейчас верхние и нижние отступы больше, чем на основном сайте. Приводим к эталону:
- верхний блок с логотипом и подписью: паддинги сверху/снизу уменьшаются (`pt-10 pb-8` → `pt-8 pb-5`, на sm `pt-[52px] pb-10` → `pt-10 pb-6`)
- нижний отступ блока колонок сокращается (`pb-10 / sm:pb-11` → `pb-8`)
- отступ под подписью бренда уменьшается

Итог: подвал становится компактнее и по вертикали совпадает с robinzone.ai.

## 2. Логотип и название в шапке — к краю экрана

На основном сайте логотип прижат к самому краю окна, без центрального контейнера. Убираем `mx-auto max-w-6xl` у внутреннего контейнера шапки: он становится во всю ширину, логотип уходит к левому краю, блок с email / History / Log out — к правому. Горизонтальные паддинги остаются небольшими (как на основном сайте).

## 3. Legal-ссылки ведут на основной сайт

Колонка Legal в подвале перестаёт открывать модалки. Пять пунктов становятся обычными ссылками:
- Terms of Use → https://www.robinzone.ai/legal/terms
- Privacy Policy → https://www.robinzone.ai/legal/privacy
- Cookie Policy → https://www.robinzone.ai/legal/cookies
- Billing Terms → https://www.robinzone.ai/legal/billing
- Refund Policy → https://www.robinzone.ai/legal/refund

Модалки на других страницах (например, на экране входа) не трогаем.

## Технические детали

- `src/components/virality/site/SiteHeader.tsx` — убрать `mx-auto max-w-6xl`
- `src/components/virality/site/SiteFooter.tsx` — уменьшить вертикальные паддинги, заменить `useLegalModal` кнопки на `<a href>` с внешними ссылками
- `src/lib/site-links.ts` — legal-ссылки указывают на абсолютные URL robinzone.ai
