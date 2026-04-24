const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');

  db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'store_db'}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log(`Database ${process.env.DB_NAME || 'store_db'} ready`);

    db.query(`USE ${process.env.DB_NAME || 'store_db'}`, (err) => {
      if (err) throw err;
      createTables();
    });
  });
});

// Определение таблицы пользователей (перенесено вверх)
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const getRandomProductImage = (productId, imageIndex) => {
  const categoryId = Math.floor(productId / 100);
  return `/images/category${categoryId}/product${productId}_image${imageIndex + 1}.jpg`;
};

const createTables = () => {
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id INT,
      price DECIMAL(10, 2) NOT NULL,
      discount_price DECIMAL(10, 2),
      rating DECIMAL(3, 1),
      stock INT DEFAULT 0,
      image VARCHAR(500),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `;
  const createProductImagesTable = `
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `;

  db.query(createCategoriesTable, (err) => {
    if (err) throw err;
    console.log('Categories table ready');
    db.query(createProductsTable, (err) => {
      if (err) throw err;
      console.log('Products table ready');
      db.query(createProductImagesTable, (err) => {
        if (err) throw err;
        console.log('Product images table ready');
        // Создаём таблицу users, затем заполняем данные
        db.query(createUsersTable, (err) => {
          if (err) throw err;
          console.log('Users table ready');
          insertSampleData();
        });
      });
    });
  });
};

const insertSampleData = () => {
  // Категории (25 штук)
  const categories = [];
  for (let i = 1; i <= 25; i++) {
    categories.push([`Категория ${i}`]);
  }
  const insertCategoriesQuery = 'INSERT IGNORE INTO categories (name) VALUES ?';
  db.query(insertCategoriesQuery, [categories], (err, result) => {
    if (err) throw err;
    console.log(`Inserted ${result.affectedRows} categories`);

    // Получаем ID категорий
    db.query('SELECT id FROM categories ORDER BY id', (err, categoryRows) => {
      if (err) throw err;

      const products = [];
      // Для каждой категории создаём товары с ID = categoryId*100 + номер
      categoryRows.forEach((cat, idx) => {
        const categoryId = cat.id;
        const productCount = Math.floor(Math.random() * 31) + 10; // 10-40 товаров
        for (let i = 1; i <= productCount; i++) {
          const productId = categoryId * 100 + i;
          const hasDiscount = Math.random() > 0.7;
          const basePrice = Math.floor(Math.random() * 10000) + 1000;
          const discountPercent = Math.floor(Math.random() * 30) + 5;
          const stock = Math.floor(Math.random() * 100);
          const rating = (Math.random() * 4 + 1).toFixed(1); // 1.0..5.0
          const imageUrl = getRandomProductImage(productId, 0);
          products.push([
            productId,
            `Товар ${productId} из категории ${categoryId}`,
            categoryId,
            basePrice,
            hasDiscount ? Math.round(basePrice * (100 - discountPercent) / 100) : null,
            rating,
            stock,
            imageUrl,
            `Подробное описание товара ${productId}. Отличные характеристики.`
          ]);
        }
      });

      const insertProductsQuery = `
        INSERT IGNORE INTO products 
        (id, name, category_id, price, discount_price, rating, stock, image, description) 
        VALUES ?
      `;
      db.query(insertProductsQuery, [products], (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} products`);

        // Теперь вставляем изображения для каждого товара
        const imageValues = [];
        products.forEach(prod => {
          const productId = prod[0];
          const numImages = Math.floor(Math.random() * 5) + 1; // 1-5
          for (let i = 0; i < numImages; i++) {
            imageValues.push([productId, getRandomProductImage(productId, i), i]);
          }
        });

        const insertImagesQuery = `
          INSERT IGNORE INTO product_images (product_id, image_url, sort_order)
          VALUES ?
        `;
        db.query(insertImagesQuery, [imageValues], (err) => {
          if (err) throw err;
          console.log(`Inserted ${imageValues.length} product images`);
          db.end();
          console.log('Database initialization completed');
        });
      });
    });
  });
};