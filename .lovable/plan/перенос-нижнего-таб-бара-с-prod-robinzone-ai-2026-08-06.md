# Перенос нижнего таб-бара с prod_robinzone_ai

## Название

Компонент называем **MobileBottomNav** («нижний таб-бар») — так же, как в основном проекте. Файл: `src/components/layout/MobileBottomNav.tsx`.

## Что переносим

Код копируется 1:1 из `src/components/layout/MobileBottomNav.tsx` основного проекта: те же 5 вкладок, размеры (высота 72px), фон `rgba(13,14,28,0.92)` с блюром, тень, safe-area паддинги, лаймовая «Create»-кнопка с градиентом и свечением, активное состояние (лаймовая иконка с заливкой + подсветка), скрытие при открытых модалках. Виден только на мобильных (`md:hidden`).

## Навигация — на основной продукт

Так как это отдельный поддомен, все вкладки ведут на robinzone.ai:

- Home → `https://www.robinzone.ai/`
- Assist → `/assist` (если не залогинен — `/login`)
- Create → `/create` (центральная выделенная кнопка)
- Creations → `/dashboard?tab=creations` (если не залогинен — `/create`)
- Profile → `/dashboard` (если не залогинен — `/login`)

Логин-состояние берётся из нашего `getAuthState`, а не из `AuthContext` основного сайта. Активная вкладка на нашем поддомене не подсвечивается ни одна (наши страницы не входят в эти маршруты) — это соответствует поведению оригинала.

## Технические детали

- `src/components/layout/MobileBottomNav.tsx` — новый файл; `react-router-dom` `Link/useLocation/useSearchParams` заменяются на внешние `<a href>` с абсолютными URL из `src/lib/site-links.ts`; `useAuth` → `useQuery(["auth-state"])`, как в `SiteHeader`.
- Хук `useDialogOpen` (наблюдение за `data-scroll-locked` на `<body>`) переносится вместе с компонентом.
- Логика скрытия при открытой клавиатуре в Assist не переносится (у нас нет Assist), остальное — без изменений.
- `src/routes/__root.tsx` — рендер `<MobileBottomNav />` после футера.
- Резерв места снизу на мобильных (спейсер высотой `72px + safe-area`), чтобы бар не перекрывал контент футера — как в `MainLayout` оригинала.
- В `src/lib/site-links.ts` добавляются `create` и `creations`.
