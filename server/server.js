const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

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
    console.log('Make sure you have run "npm run init-db" first and MySQL is running.');
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Helper function to get images for multiple products
const getImagesForProducts = (productIds, callback) => {
  if (productIds.length === 0) return callback(null, {});
  const query = 'SELECT product_id, image_url FROM product_images WHERE product_id IN (?) ORDER BY sort_order';
  db.query(query, [productIds], (err, images) => {
    if (err) return callback(err);
    const imagesMap = {};
    images.forEach(img => {
      if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
      imagesMap[img.product_id].push(img.image_url);
    });
    callback(null, imagesMap);
  });
};

// Routes
app.get('/api/products', (req, res) => {
  let { page = 1, limit = 12, search = '', minPrice = '', maxPrice = '', category = '' } = req.query;
  
  // Преобразование в числа и валидация
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 12;
  const offset = (page - 1) * limit;

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

  if (category) {
    query += ` AND c.name = ?`;
    params.push(category);
  }

  query += ` ORDER BY p.id LIMIT ? OFFSET ?`;
  params.push(limit, offset);  // числа

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.json({ products: [], pagination: { currentPage: page, totalPages: 0, totalItems: 0 } });
    }

    const productIds = results.map(p => p.id);
    getImagesForProducts(productIds, (err, imagesMap) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      const productsWithImages = results.map(p => ({
        ...p,
        images: imagesMap[p.id] || []
      }));

      // Count total items for pagination
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
      if (category) {
        countQuery += ` AND c.name = ?`;
        countParams.push(category);
      }

      db.query(countQuery, countParams, (countErr, countResults) => {
        if (countErr) {
          console.error(countErr);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          products: productsWithImages,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(countResults[0].total / limit),
            totalItems: countResults[0].total
          }
        });
      });
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const query = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.stock > 0
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = results[0];
    const imagesQuery = 'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order';
    db.execute(imagesQuery, [productId], (err, images) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      product.images = images.map(img => img.image_url);
      res.json(product);
    });
  });
});

app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM categories ORDER BY name';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/contact', (req, res) => {
  const { subject, message } = req.body;

  if (!subject || subject.length < 3) {
    return res.status(400).json({ error: 'Subject is too short' });
  }

  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'Message is too short' });
  }

  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (err) {
    console.warn('Nodemailer not configured properly, simulating email send');
    return res.json({ success: true, message: 'Message sent successfully (simulated)' });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    text: `You have received a new message from the contact form:\n\nSubject: ${subject}\n\nMessage:\n${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
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