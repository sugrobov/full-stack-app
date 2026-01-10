# Интернет-магазин

Это полнофункциональный интернет-магазин, созданный с использованием React, Redux и Vite.

## Описание проекта

Интернет-магазин включает в себя следующие функции:
- Просмотр каталога товаров с фильтрацией по категориям и цене
- Постраничная навигация
- Добавление товаров в корзину
- Управление количеством товаров в корзине
- Избранное
- Просмотр деталей товара с возможностью переключения изображений

## Установка и запуск

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/sugrobov/full-stack-app.git
   ```

2. Перейдите в директорию клиента:
   ```
   cd full-stack-app/client
   ```

3. Установите зависимости:
   ```
   npm install
   ```

4. Запустите приложение:
   ```
   npm run dev
   ```

5. Откройте браузер и перейдите по адресу `http://localhost:5173`

## Изображения товаров

Изображения товаров не включены в репозиторий Git из-за их размера. Вы можете сгенерировать изображения двумя способами:

### Способ 1: Использование скрипта Python (рекомендуется)

1. Убедитесь, что у вас установлен Python 3 и библиотека Pillow:
   ```
   pip install Pillow
   ```

2. Запустите скрипт генерации изображений:
   ```
   python scripts/generate-images.py
   ```

### Способ 2: Использование скрипта Node.js

1. Запустите скрипт генерации изображений:
   ```
   node scripts/generate-images-node.js
   ```

### Способ 3: Скачивание архивов с изображениями

Изображения разделены на 25 архивов по категориям:

1. Скачайте архивы с изображениями:
   - [Category 1](archives/category1.zip) (22.9 MB)
   - [Category 2](archives/category2.zip) (25.4 MB)
   - [Category 3](archives/category3.zip) (21.6 MB)
   - [Category 4](archives/category4.zip) (18.9 MB)
   - [Category 5](archives/category5.zip) (24.4 MB)
   - [Category 6](archives/category6.zip) (23.6 MB)
   - [Category 7](archives/category7.zip) (21.2 MB)
   - [Category 8](archives/category8.zip) (25.3 MB)
   - [Category 9](archives/category9.zip) (20.2 MB)
   - [Category 10](archives/category10.zip) (22.5 MB)
   - [Category 11](archives/category11.zip) (26.9 MB)
   - [Category 12](archives/category12.zip) (23.7 MB)
   - [Category 13](archives/category13.zip) (21.9 MB)
   - [Category 14](archives/category14.zip) (23.5 MB)
   - [Category 15](archives/category15.zip) (20.1 MB)
   - [Category 16](archives/category16.zip) (25.9 MB)
   - [Category 17](archives/category17.zip) (26.5 MB)
   - [Category 18](archives/category18.zip) (17.9 MB)
   - [Category 19](archives/category19.zip) (23.4 MB)
   - [Category 20](archives/category20.zip) (24.3 MB)
   - [Category 21](archives/category21.zip) (26.2 MB)
   - [Category 22](archives/category22.zip) (2.0 MB)
   - [Category 23](archives/category23.zip) (22.7 MB)
   - [Category 24](archives/category24.zip) (25.6 MB)
   - [Category 25](archives/category25.zip) (23.1 MB)

2. Распакуйте каждый архив в папку `client/public/images`:
   ```
   client/public/images/
   ├── category1/
   │   ├── product101_image1.ppm
   │   ├── product101_image2.ppm
   │   └── ...
   ├── category2/
   │   ├── product201_image1.ppm
   │   └── ...
   └── ...
   ```

3. После распаковки всех архивов перезапустите приложение:
   ```
   npm run dev
   ```

## Структура проекта

```
client/
├── public/
│   └── images/          # Изображения товаров (не включены в Git)
├── src/
│   ├── components/     # Компоненты React
│   ├── pages/          # Страницы приложения
│   ├── store/          # Redux store и слайсы
│   ├── utils/          # Вспомогательные функции
│   ├── App.jsx         # Главный компонент приложения
│   └── main.jsx        # Точка входа
└── vite.config.js     # Конфигурация Vite
```

## Основные компоненты

- `App.jsx` - Главный компонент приложения с навигацией
- `HomePage.jsx` - Главная страница с каталогом товаров
- `ProductPage.jsx` - Страница деталей товара
- `CartPage.jsx` - Страница корзины
- `ProductCard.jsx` - Компонент карточки товара
- `Breadcrumb.jsx` - Компонент навигационной цепочки
- `Filters.jsx` - Компонент фильтров

## Redux Store

- `productsSlice.js` - Управление данными товаров
- `cartSlice.js` - Управление корзиной
- `favoritesSlice.js` - Управление избранным

## Технологии

- React 18
- Redux Toolkit
- React Router
- Tailwind CSS
- Vite

## Лицензия

MIT