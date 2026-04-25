const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateToken, verifyToken } = require('./auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Пул с промисами (для всех запросов)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Проверка подключения
db.query('SELECT 1')
  .then(() => console.log('Connected to MySQL database'))
  .catch(err => {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  });

// Вспомогательная функция получения изображений для массива товаров (промис-версия)
async function getImagesForProducts(productIds) {
  if (!productIds.length) return {};
  const query = 'SELECT product_id, image_url FROM product_images WHERE product_id IN (?) ORDER BY sort_order';
  const [rows] = await db.query(query, [productIds]);
  const imagesMap = {};
  rows.forEach(img => {
    if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
    imagesMap[img.product_id].push(img.image_url);
  });
  return imagesMap;
}

// ==================== РОУТЫ ====================

app.get('/api/products', async (req, res) => {
  try {
    let { page = 1, limit = 12, search = '', minPrice = '', maxPrice = '', category = '', sort = '' } = req.query;
    page = parseInt(page); limit = parseInt(limit);
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

    // Сортировка
    let orderBy = 'p.id';
    switch (sort) {
      case 'price_asc': orderBy = 'COALESCE(p.discount_price, p.price) ASC'; break;
      case 'price_desc': orderBy = 'COALESCE(p.discount_price, p.price) DESC'; break;
      case 'rating_desc': orderBy = 'p.rating DESC'; break;
      case 'newest': orderBy = 'p.id DESC'; break;
    }
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [products] = await db.query(query, params);
    if (!products.length) {
      return res.json({ products: [], pagination: { currentPage: page, totalPages: 0, totalItems: 0 } });
    }

    const productIds = products.map(p => p.id);
    const imagesMap = await getImagesForProducts(productIds);
    const productsWithImages = products.map(p => ({
      ...p,
      rating: parseFloat(p.rating) || 0,
      images: imagesMap[p.id] || []
    }));

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
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    res.json({
      products: productsWithImages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/search', async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query;
    if (!q.trim()) return res.json({ products: [] });
    const searchPattern = `%${q}%`;
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.stock > 0 AND (p.name LIKE ? OR c.name LIKE ?)
      ORDER BY CASE WHEN p.name LIKE ? THEN 1 ELSE 2 END, p.id
      LIMIT ?
    `;
    const [products] = await db.query(query, [searchPattern, searchPattern, searchPattern, parseInt(limit)]);
    if (!products.length) return res.json({ products: [] });
    const productIds = products.map(p => p.id);
    const imagesMap = await getImagesForProducts(productIds);
    const productsWithImages = products.map(p => ({
      ...p,
      images: imagesMap[p.id] || []
    }));
    res.json({ products: productsWithImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.stock > 0
    `;
    const [products] = await db.query(query, [productId]);
    if (!products.length) return res.status(404).json({ error: 'Product not found' });
    const product = products[0];
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order', [productId]);
    product.images = images.map(img => img.image_url);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, name } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    const token = generateToken(result.insertId, email, 'user');
    res.status(201).json({ token, user: { id: result.insertId, name, email, role: 'user' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(user.id, user.email, user.role);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить профиль пользователя
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить профиль (имя, email)
app.put('/api/users/profile', verifyToken, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email } = req.body;
  const updates = [];
  const values = [];
  if (name) { updates.push('name = ?'); values.push(name); }
  if (email) {
    // Проверим, не занят ли email другим пользователем
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.userId]);
    if (existing.length) return res.status(400).json({ error: 'Email already in use' });
    updates.push('email = ?'); values.push(email);
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.user.userId);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  const [updated] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.userId]);
  res.json(updated[0]);
});

// Сменить пароль
app.put('/api/users/password', verifyToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { currentPassword, newPassword } = req.body;
  const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.userId]);
  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.userId]);
  res.json({ message: 'Password updated successfully' });
});

// Получить историю заказов
app.get('/api/users/orders', verifyToken, async (req, res) => {
  try {
    const orders = await db.query(`
      SELECT o.*,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'name', p.name))
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = o.id) as items
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.userId]);
    res.json(orders[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать заказ (из корзины)
app.post('/api/orders', verifyToken, [
  body('address').notEmpty(),
  body('phone').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { address, phone, items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO orders (user_id, total, address, phone, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, total, address, phone, 'pending']
    );
    const orderId = result.insertId;
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }
    await connection.commit();
    res.status(201).json({ orderId, message: 'Order created' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

app.post('/api/contact', (req, res) => {
  const { subject, message } = req.body;
  if (!subject || subject.length < 3 || !message || message.length < 10) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  // имитация отправки почты (nodemailer настройте по желанию)
  res.json({ success: true, message: 'Message sent successfully (simulated)' });
});

app.post('/api/products/by-ids', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.json([]);
  const placeholders = ids.map(() => '?').join(',');
  const query = `SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id IN (${placeholders}) AND p.stock > 0`;
  const [products] = await db.query(query, ids);
  const imagesMap = await getImagesForProducts(products.map(p => p.id));
  const result = products.map(p => ({ ...p, images: imagesMap[p.id] || [] }));
  res.json(result);
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));