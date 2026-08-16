// Seed-скрипт для E2E (Cypress): очищает каталог и вставляет товары,
// включая «Футболка», чтобы Cypress-тест userJourney.cy.js мог их найти.
// Запускается в CI после серверных интеграционных тестов.
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '.env.test') });
} else {
  dotenv.config();
}

async function seed() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const db = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  console.log('🚀 Начинаю сидирование данных для E2E...');

  // Очищаем каталог (в правильном порядке из-за внешних ключей)
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.query('TRUNCATE TABLE order_items');
  await db.query('TRUNCATE TABLE reviews');
  await db.query('TRUNCATE TABLE product_images');
  await db.query('TRUNCATE TABLE products');
  await db.query('TRUNCATE TABLE categories');
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // Категория «Одежда» (id = 1 после TRUNCATE)
  await db.query("INSERT INTO categories (name) VALUES ('Одежда')");
  const [catRows] = await db.query("SELECT id FROM categories WHERE name = 'Одежда'");
  const categoryId = catRows[0].id;

  // Товары (всего 6, чтобы «Футболка» была на первой странице /shop, limit=12)
  const products = [
    ['Футболка', 1200, 900, 4.6, 100],
    ['Джинсы', 2500, 1990, 4.3, 50],
    ['Куртка', 4500, null, 4.5, 30],
    ['Кроссовки', 3800, 3200, 4.7, 40],
    ['Шапка', 700, null, 4.2, 80],
    ['Рюкзак', 2100, 1800, 4.4, 25],
  ];

  for (const [name, price, discountPrice, rating, stock] of products) {
    const [result] = await db.query(
      'INSERT INTO products (name, category_id, price, discount_price, rating, stock, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, categoryId, price, discountPrice, rating, stock, `Описание товара ${name}`]
    );
    const productId = result.insertId;
    // Изображение (можно заглушку — ProductCard отрисует имя при отсутствии картинки)
    await db.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
      [productId, `/images/category${categoryId}/product${productId}.jpg`, 0]
    );
  }

  console.log(`✅ Сидирование завершено: категория #${categoryId}, товаров: ${products.length}`);
  await db.end();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Ошибка сидирования:', err);
    process.exit(1);
  });
}

module.exports = seed;