# Online Store (fullstack)

Интернет-магазин с клиентской и серверной частью.  
Фронтенд — React + Redux Toolkit + Tailwind, бэкенд — Node.js + Express + MySQL.

## Ключевые возможности

- Каталог товаров с фильтрацией, сортировкой, поиском и пагинацией
- Карточка товара со слайдером изображений и отзывами
- Корзина с сохранением состояния между сессиями (localForage)
- Избранное
- Регистрация / авторизация (JWT)
- Личный кабинет с профилем и историей заказов
- **Админ‑панель**
  - Управление товарами (создание, редактирование, удаление)
  - **Загрузка изображений товаров** (drag & drop, конвертация в WebP, галерея)
  - Управление заказами, пользователями, отзывами
- REST API на Express с валидацией, защитой маршрутов и загрузкой файлов

## Технический стек

**Клиент:** React 18, Redux Toolkit, React Router 6, Tailwind CSS 4, Vite, Axios, Framer Motion, react-dropzone, react-hot-toast  
**Сервер:** Node.js, Express, MySQL2 (пул промисов), JWT, bcryptjs, multer, sharp, file-type, uuid  
**База данных:** MySQL (таблицы products, product_images, categories, users, orders, reviews и др.)

## Установка и запуск

### 1. Клонирование и установка

```bash
git clone https://github.com/sugrobov/full-stack-app.git
cd full-stack-app
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Настройка базы данных

Убедитесь, что MySQL запущен.

В папке `server` переименуйте `.env.example` в `.env` и укажите свои параметры подключения.

Инициализируйте таблицы и тестовые данные (опционально):

```bash
cd server
npm run init-db
```

### 3. Запуск в режиме разработки

Из корня проекта:

```bash
npm run dev
```

Запускаются одновременно:

- Клиент: http://localhost:5173
- Сервер: http://localhost:5000

Отдельный запуск:

```bash
npm run client   # фронтенд
npm run server   # бэкенд
```

## Особенности работы с изображениями

Загруженные администратором изображения конвертируются в .webp, сохраняются в `server/uploads/products/` и отображаются через кастомный endpoint.

В админке реализована галерея: можно добавить несколько изображений, удалить любое.

Все публичные страницы (каталог, карточка товара, корзина, поиск) поддерживают как сидированные `/images/`, так и загруженные `/uploads/` пути.

## Деплой клиента (Netlify)

Файл `netlify.toml` уже настроен. Подключите репозиторий, укажите:

- Build command: `npm run build`
- Publish directory: `dist`

## Структура проекта

```
├── client/          # React-приложение
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/   # Redux slices
│   │   └── utils/
│   └── vite.config.js
├── server/          # Express API
│   ├── server.js
│   ├── auth.js
│   ├── init-db.js
│   ├── uploads/products/  # загруженные изображения
│   └── .env.example
└── .gitignore
```

## Лицензия

MIT