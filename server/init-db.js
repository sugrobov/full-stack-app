const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_db'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create database if it doesn't exist
  db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'store_db'}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    
    console.log(`Database ${process.env.DB_NAME || 'store_db'} ready`);
    
    // Use the database
    db.query(`USE ${process.env.DB_NAME || 'store_db'}`, (err) => {
      if (err) {
        console.error('Error selecting database:', err);
        return;
      }
      
      // Create tables
      createTables();
    });
  });
});

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
      id INT AUTO_INCREMENT PRIMARY KEY,
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
  
  db.query(createCategoriesTable, (err) => {
    if (err) throw err;
    console.log('Categories table ready');
    
    db.query(createProductsTable, (err) => {
      if (err) throw err;
      console.log('Products table ready');
      
      // Insert sample categories
      insertSampleData();
    });
  });
};

const insertSampleData = () => {
  // Insert categories
  const categories = [];
  for (let i = 1; i <= 25; i++) {
    categories.push([`Категория ${i}`]);
  }
  
  const insertCategoriesQuery = 'INSERT IGNORE INTO categories (name) VALUES ?';
  
  db.query(insertCategoriesQuery, [categories], (err, result) => {
    if (err) throw err;
    console.log(`Inserted ${result.affectedRows} categories`);
    
    // Get category IDs
    db.query('SELECT id FROM categories ORDER BY id', (err, categoryResults) => {
      if (err) throw err;
      
      const categoryIds = categoryResults.map(row => row.id);
      
      // Insert sample products
      const products = [];
      
      categoryIds.forEach((categoryId, categoryIndex) => {
        const productCount = Math.floor(Math.random() * 31) + 10; // 10-40 products per category
        
        for (let i = 1; i <= productCount; i++) {
          const id = categoryIndex * 100 + i;
          const hasDiscount = Math.random() > 0.7;
          const basePrice = Math.floor(Math.random() * 10000) + 1000;
          const discountPercent = Math.floor(Math.random() * 30) + 5;
          const stock = Math.floor(Math.random() * 100);
          
          products.push([
            `Товар ${id} из категории ${categoryIndex + 1}`,
            categoryId,
            basePrice,
            hasDiscount ? Math.round(basePrice * (100 - discountPercent) / 100) : null,
            (Math.random() * 5).toFixed(1),
            stock,
            `https://picsum.photos/300/300?random=${id}`,
            `Подробное описание товара ${id}. Этот товар относится к категории ${categoryIndex + 1} и обладает отличными характеристиками.`
          ]);
        }
      });
      
      const insertProductsQuery = `
        INSERT IGNORE INTO products 
        (name, category_id, price, discount_price, rating, stock, image, description) 
        VALUES ?
      `;
      
      db.query(insertProductsQuery, [products], (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} products`);
        
        // Close connection
        db.end();
        console.log('Database initialization completed');
      });
    });
  });
};