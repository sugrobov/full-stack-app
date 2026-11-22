# 📋 СОСТОЯНИЕ ПРОЕКТА: full-stack-app

**Дата checkpoint:** 22.11.2026
**Рабочий каталог:** `D:\work\practice\full-stack-app`
**Ветка:** `main`, синхронизирована с `origin/main` = `5a2e96b`
**CI:** 🟢 зелёный
**Тесты:** сервер **101/101** ✅, клиент **297/297** ✅
**Живой стек:** работает (`/shop` показывает 6 товаров)

---

## 1. Стек и структура

- **Фронт:** React 18 + Vite + React Router 6 + Redux Toolkit + framer-motion
- **Бэк:** Node.js + Express **5** (`^5.2.1`, мажор!) + mysql2 + JWT + bcryptjs + multer + sharp
- **БД:** MySQL 8.0 в Docker (`full-stack-app-db-1`, `healthy`, порт `3306`)
- **Тесты:** Vitest + Testing Library (клиент), Jest + Supertest (сервер), Cypress 15 (E2E)
- **Инструменты:** Husky 9 + lint-staged 16, ESLint 9 (flat config), GitHub Actions
- **Docker:** `docker-compose.yml` — сервисы `db`, `server`, `client`, `migrate`

**Структура:** `client/`, `server/`, `cypress/`, `.github/`, `.husky/`, `scripts/`, `screenshots/`

**Корневые файлы:** `package.json`, `docker-compose.yml`, `cypress.config.js`, `README.md`, `.gitignore`, `.env` (local, git-ignored)

---

## 2. Локальное окружение (поднять с нуля)

```powershell
cd D:\work\practice\full-stack-app
npm run install-all                  # root + client + server

# Docker Desktop должен быть запущен
docker compose up -d db
Start-Sleep -Seconds 30
docker compose ps                    # ждём STATUS: Up (healthy)

cd server
node migrate.cjs                     # создаёт таблицы в store_db
node seed.cjs                        # 1 категория + 6 товаров
cd ..

# Запуск в двух окнах:
npm run server                       # окно 1, ждём "Connected to MySQL database" + "Server is running on port 5000"
npm run client                       # окно 2, ждём "Local: http://localhost:5173/"
```

**Открывать:** `http://localhost:5173` или `http://127.0.0.1:5173` (оба разрешены в CORS).

**Тесты:**

```powershell
cd server;  npm test                 # 101/101
cd ..\client; npm test               # 297/297
```

---

## 3. Переменные окружения (все git-ignored)

### Корневой `.env` (для docker-compose)

```dotenv
MYSQL_ROOT_PASSWORD=<your-password>
MYSQL_DATABASE=store_db
```

### `server/.env` (для локального запуска)

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your-password>
DB_NAME=store_db
PORT=5000
JWT_SECRET=<64-char hex, сгенерирован>
CLIENT_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
CONTACT_EMAIL=contact@example.com
```

### `server/.env.test` (в git, для Jest — пустой пароль, чтобы совпадало с CI)

```dotenv
NODE_ENV=test
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=store_db_test
PORT=5000
```

### `server/.env.test.local` (**не** в git, локальный override)

```dotenv
DB_PASSWORD=<your-password>
JWT_SECRET=test-secret-for-jest
```

> ⚠️ **Как работает override:** `server.js` (строки 1–13) и `test-setup.js` (строки 6–12) загружают `.env.test`, затем `.env.test.local` с `override: true`. Это перезаписывает `DB_PASSWORD=` (пустой) на `<your-password>` и добавляет `JWT_SECRET`. В CI `.env.test.local` отсутствует (git-ignored), поэтому тесты используют `.env.test` как есть (пустой пароль), а MySQL-сервис в workflow настроен на пустой root — это и есть причина «зелёного CI».

---

## 4. Что было исправлено (по файлам) — уже в git

### `server/server.js` — коммит `5192298`

1. **`dotenv.config()` в самом начале** (строки 1–13), до `require('./auth')`. Иначе `auth.js` читает пустой `JWT_SECRET`.
2. **Загрузка `.env.test.local` с `override: true`** в test-режиме (строки 8–13). Иначе тесты подключались к MySQL без пароля.
3. **CORS allowlist** — добавлен `'http://127.0.0.1:5173'` (строка ~33). Иначе браузер с `127.0.0.1` получал CORS-ошибку.
4. **`acquireTimeout: 10000`** закомментирован в `mysql.createPool`.
5. **ENOENT-логи** заглушены в двух местах (`DELETE /api/admin/products/:id`, `DELETE /api/admin/products/:productId/images`).
6. **Дублирующийся `dotenv.config`** (старые строки 20–24) и `const dotenv = require(...)` закомментированы.

### `server/auth.js` — коммит `5192298` (переписан)

1. **Убрано логирование полного JWT-токена** — было `console.log('Authorization header:', authHeader, ...)`, теперь `console.log('Auth:', method, url, 'hasToken:', bool)` только в dev.
2. **`getSecret()` вместо константы** на module-load — устойчиво к порядку импортов.
3. **`requireAdmin` различает 401/403** — 401 без `req.user`, 403 если не админ.

### `server/__tests__/test-setup.js` — коммит `5192298`

- **`require('../migrate.cjs')`** вместо `require('../migrate')` (файл переименован).
- **Добавлена загрузка `.env.test.local`** с `override: true` (строки 7–10).

### `server/seed.cjs` — коммит `5192298`

- **Удалён блок `INSERT INTO product_images`**. Причина: картинки `/images/category1/*.jpg` в `client/public/` физически отсутствуют, seed писал несуществующие URL → 404. Теперь `images: []`, ProductCard рисует fallback.

### `.gitignore` — коммит `d977224`

- **Убран UTF-16 мусор и NUL-байты** в конце файла (pre-existing баг из `origin/main`, из-за него git считал `.gitignore` бинарным).
- **Добавлены** `.env.local`, `.env.test.local`, `*.test.local`.
- **Убраны дубли** (`client/public/images/**` — хватает `client/public/images/`, `PROJECT_STRUCTURE.md` / `PROJECT_SUMMARY.md` — были дважды).

### `docker-compose.yml` — коммит `5192298`

- **`command: node migrate.cjs`** вместо `migrate.js` в секции `migrate:`.

---

## 5. База данных

- **`store_db`** (рабочая): мигрирована, засеяна. Таблицы: `categories`, `products`, `product_images`, `users`, `orders`, `order_items`, `reviews`.
- **`store_db_test`** (тестовая): создаётся/удаляется автоматически `test-setup.js` через `resetDatabase()` → `DROP/CREATE DATABASE` → `require('../migrate.cjs')`.

**Seed наполнение:** 1 категория «Одежда», 6 товаров (Футболка, Джинсы, Куртка, Кроссовки, Шапка, Рюкзак). Без картинок.

**Docker том:** `full-stack-app_mysql_data`. `docker compose down -v` **удалит все данные** — восстанавливать через `migrate.cjs` + `seed.cjs`.

---

## 6. Что осталось в TODO

### 🔴 Высокий приоритет

1. **`DELETE /api/reviews/:id` — баг пересчёта рейтинга.** Сейчас: `product_id` берётся подзапросом **после** `DELETE`, возвращает `NULL`, рейтинг не пересчитывается. Фикс: получить `product_id` до удаления. Тестами не покрыто.
2. **`DELETE /api/admin/products/:id` — FK на `order_items`.** Если у товара есть строки в `order_items` → `ER_ROW_IS_REFERENCED_2` → 500. Решение: **вернуть 409 Conflict** с понятным сообщением. Тестами не покрыто.
3. **`server/migrate.cjs`: `try/finally` для `db.end()`.** Если `CREATE TABLE` упадёт — соединение не закроется, процесс зависнет. Косметика.

### 🟡 Средний приоритет

4. **Роль из JWT vs БД.** Разжалованный админ сохраняет доступ 7 дней (в токене `role: 'admin'`). Решение: в `requireAdmin` сходить в БД и проверить роль. Средний рефакторинг.
5. **Аудит уязвимостей npm:** 18/20/28 (root/client/server). **Не запускать `audit fix --force`** — снесёт Express 5 / React.
6. **Картинки товаров.** Нет файлов в `client/public/images/category1/*.jpg`. picsum.photos отдаёт Geoblocked. `scripts/generate-images.js` создаёт 1000 бесполезных файлов (не те id), `generate-images-node.js` — PPM (нужен Python-конвертер). Варианты: локальные SVG-заглушки, эндпоинт `/api/products/:id/placeholder`, оставить fallback ProductCard.

### 🟢 Низкий приоритет

7. **Корневой `package.json`:**
   - нет `"private": true`;
   - нет `"engines": { "node": ">=18" }`;
   - дубли клиентских/серверных deps в корне (`react`, `react-dom`, `express`, `mysql2`, `nodemailer`, `nodemon`, `cors`, `dotenv`, `localforage`);
   - `"test": "echo \"No tests specified\" && exit 0"` — заглушка.
8. **Windows-поведение `lint-staged`.** Команда `client/node_modules/.bin/eslint ...` — работает ли на Windows? Проверить `git commit` (любой без `--no-verify`). Серверные `.js` **не линтуются** (паттерн только `client/src/**/*.{js,jsx}`) — расширить.
9. **Тестовый шум:** React Router future flags, `whileInView` от framer-motion (`HomePage.jsx`), `Cannot read properties of undefined (reading 'data')` в `Reviews.jsx` (строки 38, 52 — тест проходит, но ошибка в stderr), `Not implemented: scrollTo/alert` — jsdom-особенности.

### 📝 Известные ограничения (by design)

- Картинок товаров нет (fallback).
- `EMAIL_*` — заглушки, contact-форма шлёт на Ethereal (dev) или логирует.
- CORS — только `localhost:5173` и `127.0.0.1:5173`.
- Rate limits — 200/15min general, 10/15min auth, 5/1h contact (в тестах отключены).

---

## 7. Что уже отревьюено / не отревьюено

| Файл | Статус |
|---|---|
| `package.json` (корень) | ✅ ревью, TODO по чистке |
| `docker-compose.yml` | ✅ ревью, применён `migrate.cjs` |
| `.env`, `server/.env`, `server/.env.test`, `server/.env.test.local` | ✅ ревью, заполнены |
| `server/server.js` | ✅ ревью, применены 6 фиксов, 2 бага в TODO |
| `server/auth.js` | ✅ ревью, переписан |
| `server/migrate.cjs` | ✅ ревью, `try/finally` в TODO |
| `server/seed.cjs` | ✅ ревью, вариант А (без картинок) |
| `server/__tests__/test-setup.js` | ✅ ревью |
| `.gitignore` | ✅ ревью, почищен |
| `server/__tests__/api.test.js` (1441 строка) | ❌ не смотрели |
| `server/package.json` | ❌ не смотрели |
| `server/.env.example`, `server/eslint.config.mjs`, `server/jest.config.cjs` | ❌ не смотрели |
| `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf` | ❌ не смотрели |
| **Всё в `client/`** | ❌ не смотрели (297 тестов зелёные) |
| `cypress/` | ❌ не смотрели |
| `.github/workflows/main.yml` | ❌ не смотрели (CI зелёный, значит работает) |

**План ревью клиента:**

1. `client/package.json`, `client/vite.config.js`, `client/vitest.config.js`, `client/setupTests.js`, `client/eslint.config.js`
2. `client/src/main.jsx`, `client/src/App.jsx`, `client/src/routes/index.jsx`
3. `client/src/utils/axiosConfig.js`, `cartStorage.js`, `dateUtils.js`
4. Слайсы: `authSlice.js`, `cartSlice.js`, `productsSlice.js`, `favoritesSlice.js`, `cartPersist.js`, `store/store.js`
5. Компоненты: `Header`, `ProductCard`, `ProductSearch`, `Filters`, `Pagination`, `Reviews`, `ProtectedRoute`, `AdminRoute`, `ErrorBoundary`, `PageTransition`, `Breadcrumb`, `UI/*`
6. Страницы: `HomePage`, `ShopPage`, `ProductPage`, `CartPage`, `CheckoutPage`, `Login`, `Register`, `ProfilePage`, `FavoritesPage`, `SearchPage`, `ContactPage`, `NewsPage`, `NewsDetailPage`, `NotFoundPage`, `Admin/*`

---

## 8. Ключевые решения и договорённости

- **Node-версия:** не зафиксирована (TODO `engines`).
- **Express 5** — принят как есть. Wildcard `app.use('/api/*', ...)` — корректный синтаксис Express 5.
- **BOM в `.env`** — избегаем через `[System.IO.File]::WriteAllText(...UTF8Encoding $false)`.
- **`localhost` vs `127.0.0.1`** — оба в CORS. В `.env.test` — `127.0.0.1` (надёжнее на Windows).
- **`.env.test` в git** — с пустым `DB_PASSWORD=` (совместимость с CI). Локальный пароль в `.env.test.local` (git-ignored).
- **Тестовая БД — отдельная** (`store_db_test`), сбрасывается на каждом прогоне Jest.
- **Картинки — fallback**, не блокируем.
- **`npm audit fix --force` не запускать** — сломает Express 5 / React.
- **PowerShell vs CMD:**
  - `cd D:\path` (без `/d`)
  - `dir /a` → `ls -Force`
  - `type file` → `Get-Content file`
  - `timeout /t N` → `Start-Sleep -Seconds N`
  - **`>` и `>>` в PS 5.1 пишут в UTF-16!** Для `.env`, `.gitignore`, `.js` использовать `[System.IO.File]::WriteAllText(...)` с `UTF8Encoding $false`.

---

## 9. Как продолжить в новом чате

1. Прикрепи этот документ (или его текст).
2. Скажи: «Продолжаем по PROJECT_STATE.md. Следующий шаг — [X]».
3. Приложи запрошенный файл(ы).

**Первый шаг следующей сессии — на выбор:**

**Вариант 1 (рекомендую):** клиентское ревью — 4 файла за один заход:
- `client/package.json`
- `client/vite.config.js`
- `client/vitest.config.js`
- `client/setupTests.js`

**Вариант 2:** серверные TODO — 10 минут:
- `DELETE /api/reviews/:id` (пересчёт рейтинга);
- `migrate.cjs` `try/finally`;
- `DELETE /api/admin/products/:id` → 409 Conflict.

**Вариант 3:** картинки — SVG-заглушки + `ProductCard.jsx`.

---

## 10. История коммитов (последние)

```text
5a2e96b (HEAD -> main, origin/main) docs: add PROJECT_STATE.md with checkpoint, TODO, and next steps
5192298 fix(server): load dotenv first + .env.test.local override, allow 127.0.0.1 in CORS, drop JWT logging, use migrate.cjs in tests, seed without images
d977224 chore(gitignore): remove UTF-16 corruption, add .env.test.local and *.test.local
582bab4 Fix checkout validation tests: use beforeEach and ensure cart is populated
789d7e0 test: clear prefilled checkout fields and fix validation contradiction
13d77b2 test: use SPA navigation to reach checkout in validation flow
```

---

**Конец checkpoint.**