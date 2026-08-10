# Убрать robinzone.ai и лишние страницы

Внешний вид, вёрстка, типографика и адаптивность не меняются. Меняется только то, куда (и ведут ли вообще) ведут ссылки, плюс удаляются неиспользуемые страницы.

## 1. Ссылки на robinzone.ai — становятся неактивными

Все пункты остаются на своих местах и выглядят точно так же, но перестают куда-либо вести:

- Шапка: Models, Assist, Studio, Pricing, мега-меню, Dashboard/Settings, Login.
- Футер: Models, Studio, Pricing, Help Center, Careers, Contact, а также Terms/Privacy/Cookies/Billing/Refund — все становятся неактивными (внутренние legal-страницы не подключаем, как вы просили).
- Мобильный таб-бар: Home, Assist, Create, Creations, Profile.
- Виджет баланса кредитов, попап обратной связи, карточки и логотип — те же правила.
- Внешние адреса (help.robinzone.ai, mailto на robinzone.ai) тоже убираются.

Технически: `<a href>` заменяется на `<span>`/`<button type="button">` с теми же классами и стилями, добавляется `aria-disabled` и курсор по умолчанию; ховер-состояния остаются, чтобы верстка не «поехала». Файл `src/lib/site-links.ts` удаляется вместе со всеми импортами.

## 2. Метаданные

Из `__root.tsx` и метаданных страниц убираются упоминания домена и бренда robinzone.ai: `author`, canonical/OG-ссылки на домен, если есть. Тексты заголовков/описаний остаются осмысленными для Color Grading, без внешнего домена.

## 3. Удаляемые страницы

Удаляются файлы маршрутов, из-за чего URL перестают существовать:

- `src/routes/admin.emails.tsx`
- `src/routes/admin.errors.tsx`
- `src/routes/admin.login.tsx`
- `src/routes/cancel-subscription.tsx`
- `src/routes/_gated.history.tsx`
- `src/routes/_gated.report.tsx`
- `src/routes/login.tsx`

Компоненты Virality Predictor (`src/components/virality/**`, стор анализов) остаются в проекте — удаляются только маршруты, как вы выбрали.

## 4. Код, ставший ненужным

Удаляется только то, что использовалось исключительно удалёнными админ-страницами:

- `src/components/admin/AdminNav.tsx`
- `src/lib/admin-auth.functions.ts`, `src/lib/admin-auth.server.ts`
- `src/lib/admin-emails.functions.ts`, `src/lib/admin-errors.functions.ts`

Серверный приём отчётов об ошибках (`/api/public/errors/report`) и логирование остаются работать.

## 5. Проверки

- Ссылки на `/login`, `/report`, `/history`, `/cancel-subscription`, `/admin/*` в коде убираются (кнопки, меню, редиректы после действий заменяются на переход на главную или удаляются).
- Поиск по проекту на `robinzone.ai` — в коде не остаётся ни одного вхождения (архивные файлы планов в `.lovable/plan/` не трогаем).
- Проверка типов, production build и клик по оставшейся навигации в превью (главная и 404).
