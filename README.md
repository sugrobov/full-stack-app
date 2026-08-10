# Full-Stack Online Store

[![CI](https://github.com/sugrobov/full-stack-app/actions/workflows/main.yml/badge.svg)](https://github.com/sugrobov/full-stack-app/actions)

Полноценное приложение интернет-магазина с клиентской частью на React (Vite), сервером на Node.js (Express), MySQL и E2E-тестами на Cypress.

## 🧱 Структура проекта

```
full-stack-app/
├── client/                    # Фронтенд (React + Vite)
│   ├── src/
│   │   ├── components/        # Переиспользуемые UI-компоненты
│   │   ├── pages/             # Страницы приложения
│   │   ├── store/             # Redux-слайсы (auth, cart, favorites, products)
│   │   ├── hooks/             # Кастомные хуки (useDebounce)
│   │   ├── routes/            # Маршрутизация
│   │   └── utils/             # Axios-конфиг, утилиты
│   ├── __tests__/             # Юнит и интеграционные тесты (Vitest)
│   └── vite.config.js
├── server/                    # Бэкенд (Express)
│   ├── __tests__/             # API-тесты (Jest)
│   ├── uploads/products/      # Загруженные изображения
│   └── server.js
├── cypress/                   # E2E-тесты (Cypress)
├── .husky/                    # Git-хуки (pre-commit)
├── .github/workflows/         # CI/CD (GitHub Actions)
├── docker-compose.yml         # Контейнеры: db, server, client, migrate
└── package.json               # Workspace root
```

## 🚀 Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
git clone https://github.com/sugrobov/full-stack-app.git
cd full-stack-app
npm run install-all   # установит зависимости в корне, client и server
```

### 2. Настройка окружения

Создайте в папке `server/` файл `.env` на основе `.env.example` и заполните переменные (порт, база данных, JWT, SMTP и т.д.).

Клиентское окружение — `client/.env` на основе `client/.env.example` (переменная `VITE_API_URL`).

База данных MySQL. Инициализировать таблицы можно командой:

```bash
cd server && npm run init-db
```

### 3. Запуск в режиме разработки

```bash
npm run dev   # параллельно запускает client (Vite) и server (nodemon)
```

По умолчанию:

- Фронтенд: http://localhost:5173
- Бэкенд: http://localhost:5000

Отдельный запуск: `npm run client` / `npm run server`.

## 🧪 Тестирование

### Юнит / интеграционные тесты (клиент)

```bash
cd client && npm test
```

Vitest + Testing Library. Тесты расположены в `client/src/__tests__/`, а также рядом с компонентами и слайсами.

### API-тесты сервера

```bash
cd server && npm test
```

Jest + Supertest. Требуется тестовая БД (см. `server/.env.test`).

### E2E-тесты (Cypress)

```bash
# Из корня проекта (предварительно запустите сервер и клиент)
npx cypress open
```

Конфигурация: `cypress.config.js`, сценарии — в `cypress/e2e/`.

## 🔄 Pre-commit Hook (Husky + lint-staged)

Перед каждым коммитом автоматически запускается линтинг staged-файлов клиента:

```json
"client/src/**/*.{js,jsx}": ["eslint --config client/eslint.config.js --fix --max-warnings=0"]
```

Это гарантирует, что в репозиторий не попадёт код с ошибками ESLint. Настройка: `.husky/pre-commit` → `npx lint-staged`.

Если нужно пропустить проверку (не рекомендуется), используйте `git commit --no-verify`.

## 📦 Сборка для продакшена

```bash
npm run build   # сборка клиента в client/dist
```

Файл `netlify.toml` уже настроен для деплоя клиента (build command `npm run build`, publish directory `dist`). Также есть `docker-compose.yml` для запуска полного стека в контейнерах.

## 📄 Переменные окружения (сервер)

См. `server/.env.example`. Основные параметры:

- `PORT` – порт сервера (по умолчанию 5000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – параметры MySQL
- `JWT_SECRET` – секрет для токенов авторизации
- `CLIENT_URL` – URL фронтенда (для CORS в продакшене)
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `CONTACT_EMAIL` – SMTP для формы обратной связи

## 🤝 Участие в разработке

1. Создайте ветку от `main`
2. Внесите изменения
3. Убедитесь, что тесты проходят (`cd client && npm test`, `cd server && npm test`)
4. Создайте Pull Request

## 📊 Статус тестов (август 2026)

- Всего тестов: 294
- Пропущено: 3 (из-за технических ограничений моков Vitest, планируется исправление)
- Pre-commit hook: ✅ активен
- CI: ✅ зелёный

## 📜 Лицензия

ISC