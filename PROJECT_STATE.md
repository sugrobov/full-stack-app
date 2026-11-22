📋 СОСТОЯНИЕ ПРОЕКТА: full-stack-app
Дата checkpoint: 22.11.2026
Рабочий каталог: D:\work\practice\full-stack-app
Ветка: main, синхронизирована с origin/main = 5192298
CI: 🟢 зелёный (GitHub Actions после push)
Тесты: сервер 101/101 ✅, клиент 297/297 ✅
Живой стек: работает (/shop показывает 6 товаров)

1. Стек и структура
Фронт: React 18 + Vite + React Router 6 + Redux Toolkit + framer-motion

Бэк: Node.js + Express 5 (^5.2.1, мажор!) + mysql2 + JWT + bcryptjs + multer + sharp

БД: MySQL 8.0 в Docker (full-stack-app-db-1, healthy, порт 3306)

Тесты: Vitest + Testing Library (клиент), Jest + Supertest (сервер), Cypress 15 (E2E)

Инструменты: Husky 9 + lint-staged 16, ESLint 9 (flat config), GitHub Actions

Docker: docker-compose.yml — сервисы db, server, client, migrate

Структура: client/, server/, cypress/, .github/, .husky/, scripts/, screenshots/
Корневые файлы: package.json, docker-compose.yml, cypress.config.js, README.md, .gitignore, .env (local, git-ignored)

2. Локальное окружение (поднять с нуля)
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

Открывать: http://localhost:5173 или http://127.0.0.1:5173 (оба разрешены в CORS).

Тесты:

cd server;  npm test                 # 101/101
cd ..\client; npm test               # 297/297

3. Переменные окружения (все git-ignored)
Корневой .env (для docker-compose):

MYSQL_ROOT_PASSWORD=<your-password>
MYSQL_DATABASE=store_db

server/.env (для локального запуска):

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

server/.env.test (в git, для Jest — пустой пароль, чтобы совпадало с CI):

NODE_ENV=test
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=store_db_test
PORT=5000

server/.env.test.local (не в git, локальный override):

DB_PASSWORD=<your-password>
JWT_SECRET=test-secret-for-jest

⚠️ Как работает override: server.js (строки 1–13) и test-setup.js (строки 6–12) загружают .env.test, затем .env.test.local с override: true. Это перезаписывает DB_PASSWORD= пустой → <your-password> и добавляет JWT_SECRET. В CI .env.test.local отсутствует (git-ignored), поэтому тесты используют .env.test как есть (пустой пароль), а MySQL-сервис в workflow настроен на пустой root — это и есть причина «зелёного CI».

4. Что было исправлено (по файлам) — уже в git
server/server.js — коммит 5192298
dotenv.config() в самом начале (строки 1–13), до require('./auth'). Иначе auth.js читает пустой JWT_SECRET.

Загрузка .env.test.local с override: true в test-режиме (строки 8–13). Иначе тесты подключались к MySQL без пароля.

CORS allowlist — добавлен 'http://127.0.0.1:5173' (строка ~33). Иначе браузер с 127.0.0.1 получал CORS-ошибку.

acquireTimeout: 10000 закомментирован в mysql.createPool.

ENOENT-логи заглушены в двух местах (DELETE /api/admin/products/:id, DELETE /api/admin/products/:productId/images).

Дублирующийся dotenv.config (старые строки 20–24) и const dotenv = require(...) закомментированы.

server/auth.js — коммит 5192298 (переписан)
Убрано логирование полного JWT-токена — было console.log('Authorization header:', authHeader, ...), теперь console.log('Auth:', method, url, 'hasToken:', bool) только в dev.

getSecret() вместо константы на module-load — устойчиво к порядку импортов.

requireAdmin различает 401/403 — 401 без req.user, 403 если не админ.

server/__tests__/test-setup.js — коммит 5192298
require('../migrate.cjs') вместо require('../migrate') (файл переименован).

Добавлена загрузка .env.test.local с override: true (строки 7–10).

server/seed.cjs — коммит 5192298
Удалён блок INSERT INTO product_images. Причина: картинки /images/category1/*.jpg в client/public/ физически отсутствуют, seed писал несуществующие URL → 404. Теперь images: [], ProductCard рисует fallback.

.gitignore — коммит d977224
Убран UTF-16 мусор и NUL-байты в конце файла (pre-existing баг из origin/main, из-за него git считал .gitignore бинарным).

Добавлены .env.local, .env.test.local, *.test.local.

Убраны дубли (client/public/images/** — хватает client/public/images/, PROJECT_STRUCTURE.md / PROJECT_SUMMARY.md — были дважды).

docker-compose.yml — коммит 5192298
command: node migrate.cjs вместо migrate.js в секции migrate:.

5. База данных
store_db (рабочая): мигрирована, засеяна. Таблицы: categories, products, product_images, users, orders, order_items, reviews.
store_db_test (тестовая): создаётся/удаляется автоматически test-setup.js через resetDatabase() → DROP/CREATE DATABASE → require('../migrate.cjs').

Seed наполнение: 1 категория «Одежда», 6 товаров (Футболка, Джинсы, Куртка, Кроссовки, Шапка, Рюкзак). Без картинок.

Docker том: full-stack-app_mysql_data. docker compose down -v удалит все данные — восстанавливать через migrate.cjs + seed.cjs.

6. Что осталось в TODO
🔴 Высокий приоритет
DELETE /api/reviews/:id — баг пересчёта рейтинга. Сейчас: product_id берётся подзапросом после DELETE, возвращает NULL, рейтинг не пересчитывается. Фикс: получить product_id до удаления. Тестами не покрыто.

DELETE /api/admin/products/:id — FK на order_items. Если у товара есть строки в order_items → ER_ROW_IS_REFERENCED_2 → 500. Решение: вернуть 409 Conflict с понятным сообщением. Тестами не покрыто (в тестах order_items заранее чистят).

server/migrate.cjs: try/finally для db.end(). Если CREATE TABLE упадёт — соединение не закроется, процесс зависнет. Косметика.

🟡 Средний приоритет
Роль из JWT vs БД. Разжалованный админ сохраняет доступ 7 дней (в токене role: 'admin'). Решение: в requireAdmin сходить в БД и проверить роль. Средний рефакторинг (прокинуть db в auth.js).

Аудит уязвимостей npm: 18/20/28 (root/client/server). Не запускать audit fix --force — снесёт Express 5 / React.

Картинки товаров. Нет файлов в client/public/images/category1/*.jpg. picsum.photos отдаёт Geoblocked. scripts/generate-images.js создаёт 1000 бесполезных файлов (не те id), generate-images-node.js — PPM (нужен Python-конвертер). Варианты: локальные SVG-заглушки, эндпоинт /api/products/:id/placeholder, оставить fallback ProductCard.

🟢 Низкий приоритет
Корневой package.json:

нет "private": true;

нет "engines": { "node": ">=18" };

дубли клиентских/серверных deps в корне (react, react-dom, express, mysql2, nodemailer, nodemon, cors, dotenv, localforage);

"test": "echo \"No tests specified\" && exit 0" — заглушка.

Windows-поведение lint-staged. Команда client/node_modules/.bin/eslint ... — работает ли на Windows? Проверить git commit (любой без --no-verify). Серверные .js не линтуются (паттерн только client/src/**/*.{js,jsx}) — расширить.

Тестовый шум: React Router future flags, whileInView от framer-motion (HomePage.jsx), Cannot read properties of undefined (reading 'data') в Reviews.jsx (строки 38, 52 — тест проходит, но ошибка в stderr), Not implemented: scrollTo/alert — jsdom-особенности.

📝 Известные ограничения (by design)
Картинок товаров нет (fallback).

EMAIL_* — заглушки, contact-форма шлёт на Ethereal (dev) или логирует.

CORS — только localhost:5173 и 127.0.0.1:5173.

Rate limits — 200/15min general, 10/15min auth, 5/1h contact (в тестах отключены).

7. Что уже отревьюено / не отревьюено
Файл	Статус
package.json (корень)	✅ ревью, TODO по чистке
docker-compose.yml	✅ ревью, применён migrate.cjs
.env, server/.env, server/.env.test, server/.env.test.local	✅ ревью, заполнены
server/server.js	✅ ревью, применены 6 фиксов, 2 бага в TODO
server/auth.js	✅ ревью, переписан
server/migrate.cjs	✅ ревью, try/finally в TODO
server/seed.cjs	✅ ревью, вариант А (без картинок)
server/__tests__/test-setup.js	✅ ревью
.gitignore	✅ ревью, почищен
server/__tests__/api.test.js (1441 строка)	❌ не смотрели
server/package.json	❌ не смотрели
server/.env.example, server/eslint.config.mjs, server/jest.config.cjs	❌ не смотрели
server/Dockerfile, client/Dockerfile, client/nginx.conf	❌ не смотрели
Всё в client/	❌ не смотрели (297 тестов зелёные)
cypress/	❌ не смотрели
.github/workflows/main.yml	❌ не смотрели (CI зелёный, значит работает)
План ревью клиента:

client/package.json, client/vite.config.js, client/vitest.config.js, client/setupTests.js, client/eslint.config.js

client/src/main.jsx, client/src/App.jsx, client/src/routes/index.jsx

client/src/utils/axiosConfig.js, cartStorage.js, dateUtils.js

Слайсы: authSlice.js, cartSlice.js, productsSlice.js, favoritesSlice.js, cartPersist.js, store/store.js

Компоненты: Header, ProductCard, ProductSearch, Filters, Pagination, Reviews, ProtectedRoute, AdminRoute, ErrorBoundary, PageTransition, Breadcrumb, UI/*

Страницы: HomePage, ShopPage, ProductPage, CartPage, CheckoutPage, Login, Register, ProfilePage, FavoritesPage, SearchPage, ContactPage, NewsPage, NewsDetailPage, NotFoundPage, Admin/*

8. Ключевые решения и договорённости
Node-версия: не зафиксирована (TODO engines).

Express 5 — принят как есть. Wildcard app.use('/api/*', ...) — корректный синтаксис Express 5.

BOM в .env — избегаем через [System.IO.File]::WriteAllText(...UTF8Encoding $false).

localhost vs 127.0.0.1 — оба в CORS. В .env.test — 127.0.0.1 (надёжнее на Windows).

.env.test в git — с пустым DB_PASSWORD= (совместимость с CI). Локальный пароль в .env.test.local (git-ignored).

Тестовая БД — отдельная (store_db_test), сбрасывается на каждом прогоне Jest.

Картинки — fallback, не блокируем.

npm audit fix --force не запускать — сломает Express 5 / React.

PowerShell vs CMD:

cd D:\path (без /d)

dir /a → ls -Force

type file → Get-Content file

timeout /t N → Start-Sleep -Seconds N

> и >> в PS 5.1 пишут в UTF-16! Для .env, .gitignore, .js использовать [System.IO.File]::WriteAllText(...) с UTF8Encoding $false.

9. Как продолжить в новом чате
Прикрепи этот документ (или его текст).

Скажи: «Продолжаем по PROJECT_STATE.md. Следующий шаг — [X]».

Приложи запрошенный файл(ы).

Первый шаг следующей сессии — на выбор:

Вариант 1 (рекомендую): клиентское ревью — 4 файла за один заход:

client/package.json

client/vite.config.js

client/vitest.config.js

client/setupTests.js

Вариант 2: серверные TODO — 10 минут:

DELETE /api/reviews/:id (пересчёт рейтинга);

migrate.cjs try/finally;

DELETE /api/admin/products/:id → 409 Conflict.

Вариант 3: картинки — SVG-заглушки + ProductCard.jsx.

10. История коммитов (последние)
text
5192298 (HEAD -> main, origin/main) fix(server): load dotenv first + .env.test.local override, allow 127.0.0.1 in CORS, drop JWT logging, use migrate.cjs in tests, seed without images
d977224 chore(gitignore): remove UTF-16 corruption, add .env.test.local and *.test.local
582bab4 (base) Fix checkout validation tests: use beforeEach and ensure cart is populated
789d7e0 test: clear prefilled checkout fields and fix validation contradiction
13d77b2 test: use SPA navigation to reach checkout in validation flow
Конец checkpoint. Всё, что нужно для продолжения — здесь. Сохрани в PROJECT_STATE.md (или просто держи под рукой).

Хорошего отдыха! 🛋️ Когда вернёшься — начинаем с клиента (Вариант 1).

опиши, как сохранить в PROJECT_STATE.md и исключить его из индекса git? Что посоветуешь?
User wants to save PROJECT_STATE.md and exclude from git index. Need to give practical advice for Windows PowerShell. Also note .gitignore already has PROJECT_STRUCTURE.md and PROJECT_SUMMARY.md ignored, but NOT PROJECT_STATE.md. So need to add it.

Let me give clear step-by-step: how to create file with UTF-8 no BOM, how to add to .gitignore, how to verify it's ignored, and possibly discuss whether to commit the file anyway (option B).

Разберу по шагам, с двумя вариантами — «исключить из git» и «закоммитить» (второй часто полезнее).

Вариант A — исключить из git (то, что ты просишь)
1. Создать PROJECT_STATE.md в корне проекта
Важно: не через >/>> в PowerShell 5.1 (там UTF-16, ты уже на этом обжигался с .gitignore). Правильно:

powershell
cd D:\work\practice\full-stack-app

# Открой VS Code или другой редактор и вставь текст
code PROJECT_STATE.md
В VS Code: File → Save with Encoding → UTF-8 (без BOM). Или, если текст уже скопирован в буфер обмена:

powershell
# Только если текст в буфере (Ctrl+C уже сделан)
Get-Clipboard | Out-File -FilePath PROJECT_STATE.md -Encoding utf8NoBOM
utf8NoBOM работает в PowerShell 7+. Если у тебя PowerShell 5.1 (стандартный на Windows), эта команда упадёт — используй .NET:

powershell
$content = Get-Clipboard -Raw
[System.IO.File]::WriteAllText("$PWD\PROJECT_STATE.md", $content, (New-Object System.Text.UTF8Encoding $false))
Проверь кодировку:

powershell
Format-Hex .\PROJECT_STATE.md | Select-Object -First 1
Начинается с 23 20 (#) → UTF-8 без BOM, ✅

EF BB BF 23 20 → UTF-8 с BOM, ⚠️ приемлемо, но лучше перезаписать

FF FE 23 00 → UTF-16, ❌ перезаписать обязательно

2. Добавить в .gitignore
В .gitignore уже есть строки PROJECT_STRUCTURE.md и PROJECT_SUMMARY.md, но не PROJECT_STATE.md. Открой .gitignore в VS Code и добавь в блок «Project documentation»:

gitignore
# Project documentation (not needed in repo)
PROJECT_STRUCTURE.md
PROJECT_SUMMARY.md
PROJECT_STATE.md
Или одной командой (PowerShell 5.1, .NET, без BOM — не Add-Content):

powershell
$gitignore = Get-Content .gitignore -Raw
$newContent = $gitignore.TrimEnd() + "`nPROJECT_STATE.md`n"
[System.IO.File]::WriteAllText("$PWD\.gitignore", $newContent, (New-Object System.Text.UTF8Encoding $false))
3. Проверить, что игнорируется
powershell
git check-ignore -v PROJECT_STATE.md
Ожидаемо:

text
.gitignore:N:PROJECT_STATE.md    PROJECT_STATE.md
Если пусто — паттерн не сработал (проверь .gitignore ещё раз). Если вывод есть — всё ок, файл никогда не попадёт в git status, git add . его не тронет.

4. Проверить git status
powershell
git status
PROJECT_STATE.md не должен появиться ни в Changes to be committed, ни в Untracked files. Если появился — значит .gitignore не подхватился (опечатка, лишний пробел, или файл в подпапке).

5. Закоммитить .gitignore
Сам .gitignore тоже изменён (мы добавили PROJECT_STATE.md). Его нужно закоммитить:

powershell
git add .gitignore
git commit -m "chore(gitignore): ignore PROJECT_STATE.md (local checkpoint doc)"
git push origin main
⚠️ Если PROJECT_STATE.md уже был закоммичен раньше
Если файл уже в индексе/истории, .gitignore его не уберёт. Тогда:

powershell
git rm --cached PROJECT_STATE.md     # убрать из индекса, оставить локально
git commit -m "chore: untrack PROJECT_STATE.md, keep as local doc"
git push origin main
(--cached = «удалить только из git, файл на диске остаётся»). Проверь: git ls-files PROJECT_STATE.md — если пусто, файл больше не отслеживается.

Вариант B — закоммитить (что я советую)
Для проекта-портфолио на GitHub лучше закоммитить, потому что:

Это документация, а не секреты. В отличие от .env, где пароли, — в PROJECT_STATE.md только структура, команды, TODO. Безопасно.

Помогает ревьюеру. Открыл репо — сразу видно «что сделано, что осталось». Для собеседования/портфолио — плюс.

Помогает тебе при переезде. Сменил машину, клонировал репо — состояние проекта уже там.

История изменений. git log -- PROJECT_STATE.md покажет, как проект эволюционировал.

Риск: если ты в PROJECT_STATE.md пишешь что-то личное (пароли — нет, но, скажем, «TODO: уволить Васю») — это попадёт в публичный репо. У тебя там только технические пометки, так что риска нет.

Как коммитить (если выбрал B)
powershell
# 1. Проверить, что нет секретов
Select-String -Path PROJECT_STATE.md -Pattern "pass|secret|token|PASSWORD" -CaseSensitive:$false
Если найдёт реальные пароли/секреты — не коммить, используй вариант A. Если только «JWT_SECRET=test-secret» (тестовое значение) и упоминания в тексте — ок.

powershell
# 2. Закоммитить
git add PROJECT_STATE.md
git commit -m "docs: add PROJECT_STATE.md with checkpoint, TODO, and next steps"
git push origin main
В .gitignore строку PROJECT_STATE.md в этом случае НЕ добавляй (иначе git его проигнорирует — противоречие).

Что советую конкретно
Компромиссный вариант — C: держи в git «чистую» версию, без локальных паролей/путей, но с полной структурой и TODO.

Как это выглядит:

В git: PROJECT_STATE.md с общими командами (DB_PASSWORD=<your-password>), стеком, TODO, планом ревью.

Локально: PROJECT_STATE.local.md (git-ignored, через .gitignore → *.local.md) с твоими конкретными паролями, IP, реальными путями.

Но это двойная работа на каждый апдейт. Для практики/портфолио проще:

Мой голос — Вариант B (закоммитить), но перед коммитом глазами пробежаться по содержимому и заменить чувствительное на placeholder. У тебя в документе:

<your-password> — встречается в примерах .env → замени на <your-password> или оставь (это локальный dev-пароль, не секрет);

JWT_SECRET=<64-char hex, сгенерирован> — уже placeholder, ок;

test-secret-for-jest — тестовое значение, не секрет;

email-заглушки (your-email@gmail.com) — уже placeholder, ок.

Ничего критичного нет. С таким содержимым коммит безопасен и полезен.

Итог — что делать прямо сейчас (для варианта B, рекомендую)
powershell
cd D:\work\practice\full-stack-app

# 1. Сохранить документ в UTF-8 без BOM (VS Code → Save with Encoding → UTF-8)
code PROJECT_STATE.md

# 2. Проверить, что нет реальных секретов
Select-String -Path PROJECT_STATE.md -Pattern "password|secret|token" -CaseSensitive:$false

# 3. Закоммитить
git add PROJECT_STATE.md
git commit -m "docs: add PROJECT_STATE.md with checkpoint, TODO, and next steps"
git push origin main

# 4. Проверка
git log --oneline -n 3
Если же выбрал A (исключить) — выполни шаги из варианта A, и не забудь закоммитить изменённый .gitignore отдельным коммитом.

В обоих случаях — проверь Format-Hex .\PROJECT_STATE.md | Select-Object -First 1, чтобы не получить UTF-16, как было с .gitignore.



