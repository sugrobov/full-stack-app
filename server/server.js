const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Initialize database tables
const initDb = () => {
  // Create categories table
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createCategoriesTable, (err) => {
    if (err) {
      console.error('Error creating categories table:', err);
      return;
    }
    console.log('Categories table ready');
    
    // Create products table
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
    
    db.query(createProductsTable, (err) => {
      if (err) {
        console.error('Error creating products table:', err);
        return;
      }
      console.log('Products table ready');
      
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      db.query(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          return;
        }
        console.log('Users table ready');
        
        // Create orders table
        const createOrdersTable = `
          CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            total_amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `;
        
        db.query(createOrdersTable, (err) => {
          if (err) {
            console.error('Error creating orders table:', err);
            return;
          }
          console.log('Orders table ready');
          
          // Create order_items table
          const createOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
              id INT AUTO_INCREMENT PRIMARY KEY,
              order_id INT,
              product_id INT,
              quantity INT NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              FOREIGN KEY (order_id) REFERENCES orders(id),
              FOREIGN KEY (product_id) REFERENCES products(id)
            )
          `;
          
          db.query(createOrderItemsTable, (err) => {
            if (err) {
              console.error('Error creating order_items table:', err);
              return;
            }
            console.log('Order items table ready');
          });
        });
      });
    });
  });
};

// Initialize database
initDb();

// Routes
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 12, search = '', minPrice = '', maxPrice = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.stock > 0
  `;

  const params = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR c.name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) {
    query += ` AND (p.discount_price >= ? OR (p.discount_price IS NULL AND p.price >= ?))`;
    params.push(minPrice, minPrice);
  }

  if (maxPrice) {
    query += ` AND (p.discount_price <= ? OR (p.discount_price IS NULL AND p.price <= ?))`;
    params.push(maxPrice, maxPrice);
  }

  query += ` ORDER BY p.id LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.execute(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.stock > 0
    `;

    const countParams = [];

    if (search) {
      countQuery += ` AND (p.name LIKE ? OR c.name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      countQuery += ` AND (p.discount_price >= ? OR (p.discount_price IS NULL AND p.price >= ?))`;
      countParams.push(minPrice, minPrice);
    }

    if (maxPrice) {
      countQuery += ` AND (p.discount_price <= ? OR (p.discount_price IS NULL AND p.price <= ?))`;
      countParams.push(maxPrice, maxPrice);
    }

    db.execute(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error(countErr);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        products: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalItems: countResults[0].total
        }
      });
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.stock > 0
  `;

  db.execute(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(results[0]);
  });
});

app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM categories ORDER BY name';

  db.execute(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

app.post('/api/contact', (req, res) => {
  const { subject, message } = req.body;

  // Simple spam protection
  if (!subject || subject.length < 3) {
    return res.status(400).json({ error: 'Subject is too short' });
  }

  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'Message is too short' });
  }

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    text: `You have received a new message from the contact form:\n\nSubject: ${subject}\n\nMessage:\n${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      // Even if email fails, we still want to show success to the user
      // In a real application, you might want to log this error for monitoring
    } else {
      console.log('Email sent: ' + info.response);
    }

    res.json({ success: true, message: 'Message sent successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});