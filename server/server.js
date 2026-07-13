const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateToken, verifyToken, requireAdmin } = require('./auth');

// необходимые модули для загрузки изображений
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromBuffer } = require('file-type');
const path = require('path');
const fs = require('fs').promises;
const compression = require('compression');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '.env.test') });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(compression());
app.use(express.json());

// Статическая раздача загруженных изображений с заголовками безопасности
app.use('/uploads', (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=86400',
  });
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

// Настройка Nodemailer (с фолбэком на ethereal, если EMAIL_USER не задан)
let transporter = null;
async function initTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Email transporter configured with Gmail');
  } else {
    // Создаём тестовый аккаунт ethereal.email для разработки
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Email transporter configured with Ethereal (dev mode)');
      console.log('  Preview URL will be available after sending');
    } catch (err) {
      console.warn('Failed to create Ethereal account, emails will be simulated:', err.message);
    }
  }
}
initTransporter();

// Вспомогательная функция отправки email-уведомлений
async function sendNotificationEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`Email notification (simulated): to=${to}, subject=${subject}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Online Store" <noreply@example.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId} to=${to} subject="${subject}"`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`  Preview URL: ${previewUrl}`);
    }
  } catch (err) {
    console.error(`Failed to send email to=${to} subject="${subject}":`, err.message);
  }
}

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

// ==================== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ТОВАРОВ ====================

// Создаём директорию для хранения изображений, если её нет (при старте сервера)
const uploadDir = path.join(__dirname, 'uploads', 'products');
fs.mkdir(uploadDir, { recursive: true }).catch(err => console.error('Ошибка создания папки uploads:', err));

// Конфигурация multer: храним файл в памяти (buffer) для предварительной валидации
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});


// Эндпоинт для загрузки изображения конкретного товара (только админ)
app.post('/api/admin/products/:productId/upload', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  let outputPath = null; // запомним путь, если файл создан
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Неверный ID товара' });
    }

    // Проверяем, существует ли товар
    const [productRows] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // 1. Определяем реальный MIME-тип по магическим байтам
    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    if (!detectedType || !detectedType.mime.startsWith('image/')) {
      return res.status(400).json({ error: 'Загруженный файл не является изображением' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(detectedType.mime)) {
      return res.status(400).json({ error: 'Поддерживаются только JPEG, PNG, WebP' });
    }

    // Удалить старые изображения (записи и файлы) - НЕ НУЖЕН
    // const [oldImages] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [productId]);
    // await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    // for (const img of oldImages) {
    //   const oldFilename = img.image_url.replace('/uploads/products/', '');
    //   try { await fs.unlink(path.join(uploadDir, oldFilename)); } catch { }
    // }

    // 2. Генерация уникального имени и пути
    const fileName = `${uuidv4()}.webp`;
    outputPath = path.join(uploadDir, fileName);

    // 3. Обработка через sharp
    await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const imageUrl = `/uploads/products/${fileName}`;

    // 4. Сохраняем запись в БД
    const [maxSort] = await db.query('SELECT MAX(sort_order) as max_sort FROM product_images WHERE product_id = ?', [productId]);
    const nextSort = (maxSort[0].max_sort !== null ? maxSort[0].max_sort + 1 : 0);

    await db.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
      [productId, imageUrl, nextSort]
    );

    // Обновляем основное изображение товара
    await db.query(
      'UPDATE products SET image = ? WHERE id = ?',
      [imageUrl, productId]
    );

    res.json({ success: true, imageUrl, message: 'Изображение успешно загружено' });
  } catch (error) {
    // Если файл был создан, но произошла ошибка (например, с БД) – удаляем его
    if (outputPath) {
      try {
        await fs.unlink(outputPath);
        console.log(`Удалён файл ${outputPath} из-за ошибки`);
      } catch (unlinkErr) {
        console.error('Не удалось удалить файл после ошибки:', unlinkErr);
      }
    }
    console.error('Ошибка загрузки изображения:', error);
    res.status(500).json({ error: 'Ошибка сервера при загрузке изображения' });
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

    // Email-уведомление о регистрации
    sendNotificationEmail({
      to: email,
      subject: 'Добро пожаловать в Интернет Магазин!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Добро пожаловать, ${name}!</h2>
          <p>Вы успешно зарегистрировались в нашем интернет-магазине.</p>
          <p>Теперь вы можете:</p>
          <ul>
            <li>Просматривать и заказывать товары</li>
            <li>Добавлять товары в избранное</li>
            <li>Оставлять отзывы</li>
            <li>Отслеживать историю заказов</li>
          </ul>
          <p style="color: #6b7280; font-size: 12px;">Если вы не регистрировались, просто проигнорируйте это письмо.</p>
        </div>
      `,
    });

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

    // Email-уведомление о заказе
    const itemsHtml = items.map(item =>
      `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name || `Товар #${item.productId}`}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.price).toLocaleString()} ₽</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(item.price * item.quantity).toLocaleString()} ₽</td></tr>`
    ).join('');

    sendNotificationEmail({
      to: req.user.email,
      subject: `Заказ №${orderId} оформлен`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Спасибо за заказ!</h2>
          <p>Ваш заказ №${orderId} успешно оформлен.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead><tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Товар</th><th style="padding: 8px; text-align: center;">Кол-во</th><th style="padding: 8px; text-align: right;">Цена</th><th style="padding: 8px; text-align: right;">Сумма</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Итого:</td><td style="padding: 8px; text-align: right; font-weight: bold;">${total.toLocaleString()} ₽</td></tr></tfoot>
          </table>
          <p><strong>Адрес доставки:</strong> ${address}</p>
          ${phone ? `<p><strong>Телефон:</strong> ${phone}</p>` : ''}
          <p><strong>Статус:</strong> Ожидает обработки</p>
          <p style="color: #6b7280; font-size: 12px;">Вы можете отслеживать статус заказа в личном кабинете.</p>
        </div>
      `,
    });

    res.status(201).json({ orderId, message: 'Order created' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

app.post('/api/contact', async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || subject.length < 3 || !message || message.length < 10) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Contact Form" <noreply@example.com>',
        to: process.env.CONTACT_EMAIL || 'contact@example.com',
        subject: `[Contact Form] ${subject}`,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      });
      console.log('Contact email sent:', info.messageId);
      // Если используем Ethereal, показываем preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      const response = { success: true, message: 'Message sent successfully' };
      if (previewUrl) {
        response.previewUrl = previewUrl;
        console.log('Preview URL:', previewUrl);
      }
      res.json(response);
    } else {
      // Фолбэк: симуляция, если транспортер не настроен
      console.log('Contact form submission (simulated):', { subject, message });
      res.json({ success: true, message: 'Message sent successfully (simulated)' });
    }
  } catch (err) {
    console.error('Failed to send contact email:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
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

// ==================== АДМИН-ПАНЕЛЬ (только для админов) ====================

// Получить все товары (без фильтра stock) с пагинацией
app.get('/api/admin/products', verifyToken, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const [countResult] = await db.query('SELECT COUNT(*) AS total FROM products');
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    const imagesMap = await getImagesForProducts(products.map(p => p.id));
    const result = products.map(p => ({ ...p, images: imagesMap[p.id] || [] }));
    res.json({
      products: result,
      pagination: { page, limit, totalPages, totalItems }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Создать товар
app.post('/api/admin/products', verifyToken, requireAdmin, async (req, res) => {
  const { name, category_id, price, discount_price, rating, stock, description, images } = req.body;
  try {
    const discountPrice = discount_price === '' || discount_price === undefined ? null : discount_price;
    const ratingValue = rating === '' ? null : rating;
    const [result] = await db.query(
      'INSERT INTO products (name, category_id, price, discount_price, rating, stock, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category_id, price, discountPrice, ratingValue, stock, description]
    );
    const productId = result.insertId;
    if (images && images.length) {
      for (let i = 0; i < images.length; i++) {
        await db.query('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)', [productId, images[i], i]);
      }
    }
    res.status(201).json({ id: productId, name, category_id, price, discount_price, rating, stock, description, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Получить один товар (админ, без фильтра по stock)
app.get('/api/admin/products/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [products] = await db.query(query, [productId]);
    if (!products.length) return res.status(404).json({ error: 'Product not found' });
    const product = products[0];
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order', [productId]);
    product.images = images.map(img => img.image_url);
    console.log('Admin product fetch:', productId, 'found:', product);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Обновить товар
app.put('/api/admin/products/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, price, discount_price, rating, stock, description, images } = req.body;
  try {
    const discountPrice = discount_price === '' || discount_price === undefined ? null : discount_price;
    const ratingValue = rating === '' ? null : rating;
    await db.query(
      'UPDATE products SET name=?, category_id=?, price=?, discount_price=?, rating=?, stock=?, description=? WHERE id=?',
      [name, category_id, price, discountPrice, ratingValue, stock, description, id]
    );

    // Обработка изображений, если массив передан
    if (images !== undefined) {
      // Получаем текущие изображения из БД
      const [oldImages] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
      const oldUrls = oldImages.map(img => img.image_url);
      const newUrlsSet = new Set(images);

      // Удаляем записи и файлы, которых нет в новом списке
      const toDelete = oldUrls.filter(url => !newUrlsSet.has(url));
      if (toDelete.length > 0) {
        await db.query('DELETE FROM product_images WHERE product_id = ? AND image_url IN (?)', [id, toDelete]);
        for (const url of toDelete) {
          const filename = url.replace('/uploads/products/', '');
          try { await fs.unlink(path.join(uploadDir, filename)); } catch { }
        }
      }

      // Вставляем новые URL, которые отсутствуют в старом списке
      for (const [index, url] of images.entries()) {
        if (!oldUrls.includes(url)) {
          await db.query('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)', [id, url, index]);
        }
      }

      // Обновляем основное изображение
      const mainImage = images.length > 0 ? images[0] : null;
      await db.query('UPDATE products SET image = ? WHERE id = ?', [mainImage, id]);
    }

    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Удалить товар (каскадное удаление изображений)
app.delete('/api/admin/products/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Сначала получаем все image_url для этого товара
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);

    // Удаляем записи из БД
    await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    // Удаляем физические файлы с диска
    for (const img of images) {
      const filename = img.image_url.replace('/uploads/products/', '');
      const filePath = path.join(uploadDir, filename);
      try {
        await fs.unlink(filePath);
        console.log(`Удалён файл ${filePath}`);
      } catch (e) {
        console.error(`Ошибка удаления файла ${filePath}:`, e);
      }
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Получить все заказы (с данными пользователя)
app.get('/api/admin/orders', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Обновить статус заказа
app.put('/api/admin/orders/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Email-уведомление о смене статуса заказа
    const [orderRows] = await db.query(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [id]
    );
    if (orderRows.length > 0) {
      const order = orderRows[0];
      const statusLabels = {
        pending: 'Ожидает обработки',
        paid: 'Оплачен',
        shipped: 'Отправлен',
        delivered: 'Доставлен',
        cancelled: 'Отменён',
      };
      sendNotificationEmail({
        to: order.user_email,
        subject: `Статус заказа №${id} изменён`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Статус заказа обновлён</h2>
            <p>Здравствуйте, ${order.user_name}!</p>
            <p>Статус вашего заказа №${id} изменён на: <strong>${statusLabels[status] || status}</strong></p>
            <p style="color: #6b7280; font-size: 12px;">Вы можете отслеживать статус заказа в личном кабинете.</p>
          </div>
        `,
      });
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Получить всех пользователей
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Обновить роль пользователя
app.put('/api/admin/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ==================== АДМИН-ПАНЕЛЬ: УПРАВЛЕНИЕ ОТЗЫВАМИ ====================

// Получить все отзывы (с фильтрацией, пагинацией)
app.get('/api/admin/reviews', verifyToken, requireAdmin, async (req, res) => {
  try {
    let { page = 1, limit = 20, productId, userId, minRating, maxRating, search, is_approved } = req.query;
    page = parseInt(page); limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (productId) {
      whereClauses.push('r.product_id = ?');
      params.push(productId);
    }
    if (userId) {
      whereClauses.push('r.user_id = ?');
      params.push(userId);
    }
    if (minRating) {
      whereClauses.push('r.rating >= ?');
      params.push(minRating);
    }
    if (maxRating) {
      whereClauses.push('r.rating <= ?');
      params.push(maxRating);
    }
    if (search) {
      whereClauses.push('(p.name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR r.comment LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    // Фильтр по одобренным отзывам
    if (is_approved !== undefined && is_approved !== '') { // проверяем, что is_approved не пустое
      whereClauses.push('r.is_approved = ?');
      params.push(parseInt(is_approved));
    }
    // ================================================

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
      SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    const [reviews] = await db.query(query, params);

    // Подсчёт общего количества для пагинации
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereSql}
    `;
    const [countResult] = await db.query(countQuery, params.slice(0, -2)); // убираем limit, offset
    const total = countResult[0].total;

    res.json({
      reviews,
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

// Удалить отзыв (админ) с пересчётом среднего рейтинга
app.delete('/api/admin/reviews/:id', verifyToken, requireAdmin, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: 'Invalid review ID' });
  try {
    // Сначала получаем product_id отзыва
    const [review] = await db.query('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);
    if (!review.length) return res.status(404).json({ error: 'Review not found' });
    const productId = review[0].product_id;

    // Удаляем отзыв
    await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Пересчитываем средний рейтинг для товара (только по одобренным отзывам)
    const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_approved = 1', [productId]);
    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
    await db.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, productId]);

    res.json({ message: 'Review deleted and product rating updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ==================== ОТЗЫВЫ ====================

// Получить отзывы для товара
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });
    let { page = 1, limit = 5 } = req.query;
    page = parseInt(page); limit = parseInt(limit);
    const offset = (page - 1) * limit;
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [productId, limit, offset]);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM reviews WHERE product_id = ?', [productId]);
    res.json({
      reviews,
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

// Добавить отзыв (только авторизованные)
app.post('/api/products/:id/reviews', verifyToken, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });
  const { rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, req.user.userId, rating, comment || null]
    );
    // Обновить средний рейтинг товара
    const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ?', [productId]);
    const avgRating = parseFloat(avgResult[0].avg_rating).toFixed(1);
    await db.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, productId]);
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review', details: err.message });
  }
});

// Удалить отзыв (автор или админ)
app.delete('/api/reviews/:id', verifyToken, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: 'Invalid review ID' });
  try {
    const [review] = await db.query('SELECT user_id FROM reviews WHERE id = ?', [reviewId]);
    if (!review.length) return res.status(404).json({ error: 'Review not found' });
    const isAuthor = review[0].user_id === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    // Пересчитать рейтинг после удаления
    const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = (SELECT product_id FROM reviews WHERE id = ?)', [reviewId]);
    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
    await db.query('UPDATE products SET rating = ? WHERE id = (SELECT product_id FROM reviews WHERE id = ?)', [avgRating, reviewId]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ==================== УПРАВЛЕНИЕ ОТЗЫВАМИ ====================

// Массовое удаление
app.delete('/api/admin/reviews/bulk', verifyToken, requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No review IDs provided' });
  const placeholders = ids.map(() => '?').join(',');
  try {
    const [reviews] = await db.query(`SELECT product_id FROM reviews WHERE id IN (${placeholders})`, ids);
    const productIds = [...new Set(reviews.map(r => r.product_id))];
    await db.query(`DELETE FROM reviews WHERE id IN (${placeholders})`, ids);
    for (const pid of productIds) {
      const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_approved = 1', [pid]);
      const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
      await db.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, pid]);
    }
    res.json({ message: `${ids.length} reviews deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reviews' });
  }
});

// Редактирование отзыва
app.put('/api/admin/reviews/:id', verifyToken, requireAdmin, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: 'Invalid review ID' });
  const { rating, comment, is_approved } = req.body;
  if (rating !== undefined && (rating < 1 || rating > 5)) return res.status(400).json({ error: 'Rating must be 1-5' });
  try {
    const [old] = await db.query('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);
    if (!old.length) return res.status(404).json({ error: 'Review not found' });
    const productId = old[0].product_id;
    const updates = [], values = [];
    if (rating !== undefined) { updates.push('rating = ?'); values.push(rating); }
    if (comment !== undefined) { updates.push('comment = ?'); values.push(comment); }
    if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(reviewId);
    await db.query(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, values);
    const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_approved = 1', [productId]);
    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
    await db.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, productId]);
    res.json({ message: 'Review updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Переключение одобрения
app.patch('/api/admin/reviews/:id/toggle-approve', verifyToken, requireAdmin, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: 'Invalid review ID' });
  try {
    const [review] = await db.query('SELECT is_approved, product_id FROM reviews WHERE id = ?', [reviewId]);
    if (!review.length) return res.status(404).json({ error: 'Review not found' });
    const newStatus = review[0].is_approved === 1 ? 0 : 1;
    await db.query('UPDATE reviews SET is_approved = ? WHERE id = ?', [newStatus, reviewId]);
    const productId = review[0].product_id;
    const [avgResult] = await db.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_approved = 1', [productId]);
    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
    await db.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, productId]);
    res.json({ message: `Review ${newStatus === 1 ? 'approved' : 'hidden'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle approval' });
  }
});

// Удалить конкретное изображение товара (по URL)
app.delete('/api/admin/products/:productId/images', verifyToken, requireAdmin, async (req, res) => {
  const productId = parseInt(req.params.productId);
  const { imageUrl } = req.body; // ожидаем { imageUrl: '/uploads/products/...' }
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  try {
    // Удаляем запись из БД
    const [result] = await db.query('DELETE FROM product_images WHERE product_id = ? AND image_url = ?', [productId, imageUrl]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Удаляем файл с диска
    const filename = imageUrl.replace('/uploads/products/', '');
    const filePath = path.join(uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.error('Ошибка удаления файла:', e);
    }

    // Обновляем поле image в products (ставим первое оставшееся или NULL)
    const [images] = await db.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1', [productId]);
    const newMainImage = images.length > 0 ? images[0].image_url : null;
    await db.query('UPDATE products SET image = ? WHERE id = ?', [newMainImage, productId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

if (process.env.NODE_ENV !== 'test' || process.env.START_SERVER === 'true') {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
module.exports.db = db;