// Мокаем ESM-модули, чтобы избежать ошибок парсинга
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));
jest.mock('nodemailer', () => {
  const original = jest.requireActual('nodemailer');
  return {
    ...original,
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mocked-id' }),
      verify: jest.fn().mockResolvedValue(true),
    }),
    getTestMessageUrl: jest.fn().mockReturnValue(null),
  };
});

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const { db } = require('../server');
const { testDb, resetDatabase } = require('./test-setup');

// Вспомогательная функция: регистрирует пользователя и возвращает токен
async function registerAndGetToken(user) {
  const res = await request(app)
    .post('/api/auth/register')
    .send(user);
  return res.body.token;
}

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
};

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await testDb.end();
  await db.end(); // Закрываем основной пул
});

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  // ---------- POST /api/auth/register ----------
  describe('POST /api/auth/register', () => {
    // Гарантируем пустую таблицу users перед каждым тестом
    beforeEach(async () => {
      await testDb.query('DELETE FROM users');
    });

    it('should register a new user and return token + user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: validUser.name,
        email: validUser.email,
        role: 'user',
      });
      expect(res.body.user.id).toBeDefined();
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if password is less than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if user already exists', async () => {
      // Первая регистрация должна пройти успешно (база пуста)
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      // Дубликат
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });
  });

  // ---------- POST /api/auth/login ----------
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // Создаём пользователя
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: validUser.name,
        email: validUser.email,
        role: 'user',
      });
    });

    it('should return 401 with incorrect password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
});

describe('GET /api/products', () => {
  it('должен вернуть 200 и массив', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});

describe('GET /api/products/search', () => {
  beforeAll(async () => {
    // Убедимся, что есть товары для поиска (используем ON DUPLICATE KEY, чтобы не сломать другие тесты)
    await testDb.query(
      "INSERT INTO categories (name) VALUES ('Search Category') ON DUPLICATE KEY UPDATE name=name"
    );
    const [catRows] = await testDb.query("SELECT id FROM categories WHERE name='Search Category' LIMIT 1");
    const catId = catRows[0].id;
    await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('Searchable Product', ?, 29.99, 10) ON DUPLICATE KEY UPDATE name=name",
      [catId]
    );
  });

  it('should return matching products by name', async () => {
    const res = await request(app).get('/api/products/search?q=Searchable');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].name).toMatch(/Searchable/i);
  });

  it('should return empty array when no match', async () => {
    const res = await request(app).get('/api/products/search?q=ZZZZNONEXISTENT');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ products: [] });
  });

  it('should return empty array when q is empty', async () => {
    const res = await request(app).get('/api/products/search?q=');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ products: [] });
  });

  it('should return empty array when q is only whitespace', async () => {
    const res = await request(app).get('/api/products/search?q=   ');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ products: [] });
  });

  it('should respect limit parameter', async () => {
    const res = await request(app).get('/api/products/search?q=Product&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(1);
  });

  it('should return 200 when no query param is provided', async () => {
    const res = await request(app).get('/api/products/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ products: [] });
  });
});

describe('GET /api/products/:id', () => {
  let existingProductId;

  beforeAll(async () => {
    // Создаём товар для теста получения по ID
    await testDb.query("INSERT IGNORE INTO categories (name) VALUES ('Product Detail Category')");
    const [catRows] = await testDb.query("SELECT id FROM categories WHERE name='Product Detail Category' LIMIT 1");
    const catId = catRows[0].id;
    const [result] = await testDb.query(
      "INSERT INTO products (name, category_id, price, stock, description) VALUES ('Detail Product', ?, 49.99, 5, 'A product for detail testing') ON DUPLICATE KEY UPDATE name=name",
      [catId]
    );
    existingProductId = result.insertId || (await testDb.query("SELECT id FROM products WHERE name='Detail Product' LIMIT 1"))[0][0].id;
  });

  it('should return 200 and product data for existing product', async () => {
    const res = await request(app).get(`/api/products/${existingProductId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', existingProductId);
    expect(res.body).toHaveProperty('name', 'Detail Product');
    expect(res.body).toHaveProperty('price', '49.99');
    expect(res.body).toHaveProperty('stock', 5);
    expect(res.body).toHaveProperty('description');
    expect(res.body).toHaveProperty('category_name');
    expect(res.body).toHaveProperty('images');
    expect(Array.isArray(res.body.images)).toBe(true);
  });

  it('should return 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Product not found');
  });

  it('should return 404 for out-of-stock product', async () => {
    // Создаём товар с stock = 0
    const [catRows] = await testDb.query("SELECT id FROM categories WHERE name='Product Detail Category' LIMIT 1");
    const catId = catRows[0].id;
    await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('Out of Stock Product', ?, 10.00, 0)",
      [catId]
    );
    const [rows] = await testDb.query("SELECT id FROM products WHERE name='Out of Stock Product' LIMIT 1");
    const outOfStockId = rows[0].id;

    const res = await request(app).get(`/api/products/${outOfStockId}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Product not found');
  });

  it('should return 400 for invalid product ID', async () => {
    const res = await request(app).get('/api/products/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid product ID');
  });
});

describe('GET /api/categories', () => {
  beforeAll(async () => {
    // Убедимся, что есть хотя бы одна категория
    await testDb.query(
      "INSERT INTO categories (name) VALUES ('Test Cat A') ON DUPLICATE KEY UPDATE name=name"
    );
    await testDb.query(
      "INSERT INTO categories (name) VALUES ('Test Cat B') ON DUPLICATE KEY UPDATE name=name"
    );
  });

  it('should return 200 and an array of categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return categories sorted by name', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].name.localeCompare(res.body[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it('should return categories with id and name fields', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    res.body.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
    });
  });
});

describe('Orders API', () => {
  let userToken;
  let sampleOrder;

  beforeAll(async () => {
    // Очищаем связанные таблицы для чистоты
    await testDb.query('DELETE FROM order_items');
    await testDb.query('DELETE FROM orders');
    await testDb.query('DELETE FROM users');
    await testDb.query('DELETE FROM products');
    await testDb.query('DELETE FROM categories');

    userToken = await registerAndGetToken(validUser);
    if (!userToken) {
      throw new Error('Failed to get token in Orders test setup');
    }

    // Вставляем тестовые категорию и продукты
    const [catResult] = await testDb.query("INSERT INTO categories (name) VALUES ('Test Category')");
    const categoryId = catResult.insertId;
    await testDb.query(`INSERT INTO products (name, category_id, price, stock) VALUES
      ('Test Product 1', ?, 10.99, 10),
      ('Test Product 2', ?, 15.00, 10)
    `, [categoryId, categoryId]);

    // Получаем реальные ID товаров для sampleOrder
    const [products] = await testDb.query(
      "SELECT id FROM products WHERE category_id = ? ORDER BY id LIMIT 2",
      [categoryId]
    );
    sampleOrder = {
      address: '123 Test Street',
      phone: '+1234567890',
      items: [
        { productId: products[0].id, quantity: 2, price: 10.99 },
        { productId: products[1].id, quantity: 1, price: 15.00 }
      ]
    };
  });

  describe('POST /api/orders', () => {
    it('should create a new order and return orderId', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sampleOrder);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('orderId');
      expect(res.body.orderId).toBeGreaterThan(0);
      expect(res.body.message).toBe('Order created');
    });

    it('should return 400 if address is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: sampleOrder.items });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if items array is empty', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ address: 'Test', items: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cart is empty');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send(sampleOrder);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/orders', () => {
    it('should return array of orders for authenticated user', async () => {
      const res = await request(app)
        .get('/api/users/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users/orders');

      expect(res.status).toBe(401);
    });
  });
});

describe('Admin API', () => {
  let adminToken;
  let adminProductId;
  let adminCategoryId;

  const adminCredentials = { email: 'admin@example.com', password: 'admin123' };

  beforeAll(async () => {
    // Полная очистка зависимых таблиц
    await testDb.query('DELETE FROM order_items');
    await testDb.query('DELETE FROM orders');
    await testDb.query('DELETE FROM reviews');
    await testDb.query('DELETE FROM product_images');
    await testDb.query('DELETE FROM products');
    await testDb.query('DELETE FROM categories');
    await testDb.query('DELETE FROM users');

    // Создаём категорию и продукт для тестов
    const [catResult] = await testDb.query("INSERT INTO categories (name) VALUES ('Admin Category')");
    adminCategoryId = catResult.insertId;
    const [productResult] = await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('Admin Product', ?, 29.99, 100)",
      [adminCategoryId]
    );
    adminProductId = productResult.insertId;

    // Создаём админа
    const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);
    await testDb.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', adminCredentials.email, hashedPassword, 'admin']
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(adminCredentials);
    adminToken = loginRes.body.token;
  });

  describe('GET /api/admin/products', () => {
    it('should return 200 and array for admin', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken(validUser);
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/admin/products');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/products/:id', () => {
    it('should return 200 and product data for admin', async () => {
      const res = await request(app)
        .get(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', adminProductId);
      expect(res.body).toHaveProperty('name', 'Admin Product');
      expect(res.body).toHaveProperty('price', '29.99');
      expect(res.body).toHaveProperty('stock', 100);
      expect(res.body).toHaveProperty('category_id', adminCategoryId);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/admin/products/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Product not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const res = await request(app)
        .get('/api/admin/products/abc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid product ID');
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'AdminGetUser', email: 'adminget@example.com', password: 'password123' });
      const res = await request(app)
        .get(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/admin/products/${adminProductId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    const updatedData = {
      name: 'Updated Admin Product',
      category_id: adminCategoryId,
      price: 39.99,
      discount_price: 34.99,
      rating: 4.0,
      stock: 75,
      description: 'Updated description',
    };

    it('should update a product as admin', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Product updated');
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'UpdateUser', email: 'updateuser@example.com', password: 'password123' });
      const res = await request(app)
        .put(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${adminProductId}`)
        .send(updatedData);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/products', () => {
    const newProduct = {
      name: 'Admin Created Product',
      category_id: adminCategoryId,
      price: 29.99,
      discount_price: 24.99,
      rating: 4.5,
      stock: 50,
      description: 'A test product created by admin',
    };

    it('should create a product as admin', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newProduct.name);
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'User2', email: 'user2@example.com', password: 'password123' });
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProduct);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/products/:productId/upload', () => {
    const { fileTypeFromBuffer } = require('file-type');
    const sharp = require('sharp');

    let testImageBuffer;

    beforeAll(async () => {
      // Создаём реальный PNG через sharp (1x1 пиксель, красный)
      testImageBuffer = await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).png().toBuffer();
    });

    beforeEach(() => {
      fileTypeFromBuffer.mockResolvedValue({ mime: 'image/png', ext: 'png' });
    });

    afterEach(() => {
      fileTypeFromBuffer.mockReset();
    });

    it('should upload an image and return success', async () => {
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'test.png');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('imageUrl');
      expect(res.body.imageUrl).toMatch(/^\/uploads\/products\/mocked-uuid\.webp$/);
      expect(res.body).toHaveProperty('message', 'Изображение успешно загружено');
    });

    it('should return 400 if no file is attached', async () => {
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Файл не загружен');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .post('/api/admin/products/99999/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'test.png');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Товар не найден');
    });

    it('should return 400 for invalid product ID', async () => {
      const res = await request(app)
        .post('/api/admin/products/abc/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', testImageBuffer, 'test.png');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Неверный ID товара');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .attach('image', testImageBuffer, 'test.png');

      expect(res.status).toBe(401);
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'UploadUser', email: 'upload@example.com', password: 'password123' });
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', testImageBuffer, 'test.png');

      expect(res.status).toBe(403);
    });
  });

  describe('Reviews management', () => {
    let reviewId;

    beforeAll(async () => {
      // Создаём отзыв от обычного пользователя для админских операций
      const userToken = await registerAndGetToken({ name: 'Reviewer', email: 'reviewer@example.com', password: 'password123' });
      await request(app)
        .post(`/api/products/${adminProductId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, comment: 'Awesome!' });

      // Получаем id созданного отзыва
      const reviewsRes = await request(app)
        .get(`/api/products/${adminProductId}/reviews`);
      reviewId = reviewsRes.body.reviews[0].id;
    });

    it('GET /api/admin/reviews should return list of reviews', async () => {
      const res = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reviews');
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(res.body.reviews.length).toBeGreaterThan(0);
    });

    it('PATCH /api/admin/reviews/:id/toggle-approve should toggle approval', async () => {
      const res = await request(app)
        .patch(`/api/admin/reviews/${reviewId}/toggle-approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('DELETE /api/admin/reviews/:id should delete review', async () => {
      const res = await request(app)
        .delete(`/api/admin/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      // Убедимся, что отзыв удалён
      const reviewsRes = await request(app)
        .get(`/api/products/${adminProductId}/reviews`);
      expect(reviewsRes.body.reviews.length).toBe(0);
    });
  });

  describe('Additional review admin actions', () => {
    let reviewIdForEdit;

    beforeAll(async () => {
      // Создаём отзыв от обычного пользователя для тестов редактирования и массового удаления
      const userToken = await registerAndGetToken({ name: 'ReviewEditor', email: 'revieweditor@example.com', password: 'password123' });
      await request(app)
        .post(`/api/products/${adminProductId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 3, comment: 'Decent' });

      const reviewsRes = await request(app)
        .get(`/api/products/${adminProductId}/reviews`);
      reviewIdForEdit = reviewsRes.body.reviews[0].id;
    });

    describe('PUT /api/admin/reviews/:id', () => {
      it('should edit a review as admin', async () => {
        const res = await request(app)
          .put(`/api/admin/reviews/${reviewIdForEdit}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ rating: 4, comment: 'Updated comment' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Review updated');

        // Проверим изменения в БД
        const [rows] = await testDb.query('SELECT rating, comment FROM reviews WHERE id = ?', [reviewIdForEdit]);
        expect(rows[0].rating).toBe(4);
        expect(rows[0].comment).toBe('Updated comment');
      });

      it('should return 400 for invalid rating', async () => {
        const res = await request(app)
          .put(`/api/admin/reviews/${reviewIdForEdit}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ rating: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Rating must be 1-5');
      });

      it('should return 403 for regular user', async () => {
        const userToken = await registerAndGetToken({ name: 'NotAdmin', email: 'notadmin@example.com', password: 'password123' });
        const res = await request(app)
          .put(`/api/admin/reviews/${reviewIdForEdit}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ comment: 'Hack' });

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .put(`/api/admin/reviews/${reviewIdForEdit}`)
          .send({ comment: 'No token' });

        expect(res.status).toBe(401);
      });
    });

    describe('DELETE /api/admin/reviews/bulk', () => {
      it('should bulk delete reviews', async () => {
        // Создадим ещё один отзыв, чтобы было что удалять пачкой
        const userToken = await registerAndGetToken({ name: 'BulkUser', email: 'bulkuser@example.com', password: 'password123' });
        await request(app)
          .post(`/api/products/${adminProductId}/reviews`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ rating: 5, comment: 'Bulk review' });

        const reviewsRes = await request(app)
          .get(`/api/products/${adminProductId}/reviews`);
        const idsToDelete = reviewsRes.body.reviews.map(r => r.id);

        const res = await request(app)
          .delete('/api/admin/reviews/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ids: idsToDelete });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(`${idsToDelete.length} reviews deleted`);

        // Проверим, что отзывы действительно удалены
        const [remaining] = await testDb.query('SELECT id FROM reviews WHERE id IN (?)', [idsToDelete]);
        expect(remaining.length).toBe(0);
      });

      it('should return 400 if no ids provided', async () => {
        const res = await request(app)
          .delete('/api/admin/reviews/bulk')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ids: [] });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No review IDs provided');
      });

      it('should return 403 for regular user', async () => {
        const userToken = await registerAndGetToken({ name: 'BulkUser2', email: 'bulkuser2@example.com', password: 'password123' });
        const res = await request(app)
          .delete('/api/admin/reviews/bulk')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ ids: [9999] });

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .delete('/api/admin/reviews/bulk')
          .send({ ids: [1] });

        expect(res.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/admin/products/:productId/images', () => {
    const testImageUrl = '/uploads/products/test-delete-image.jpg';

    beforeAll(async () => {
      // Вставляем тестовую запись изображения для adminProductId (продукт ещё существует)
      await testDb.query(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, 0)',
        [adminProductId, testImageUrl]
      );
    });

    afterAll(async () => {
      // Подчищаем
      await testDb.query(
        'DELETE FROM product_images WHERE product_id = ? AND image_url = ?',
        [adminProductId, testImageUrl]
      );
    });

    it('should delete an image as admin', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: testImageUrl });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      const [rows] = await testDb.query(
        'SELECT * FROM product_images WHERE product_id = ? AND image_url = ?',
        [adminProductId, testImageUrl]
      );
      expect(rows.length).toBe(0);
    });

    it('should return 400 if imageUrl is missing', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('imageUrl is required');
    });

    it('should return 404 for non-existent image', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: '/uploads/products/nonexistent.jpg' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Image not found');
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'ImgUser', email: 'imguser@example.com', password: 'password123' });
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}/images`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ imageUrl: testImageUrl });

      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}/images`)
        .send({ imageUrl: testImageUrl });

      expect(res.status).toBe(401);
    });
  });

  describe('Orders management (admin)', () => {
    let regularUserToken;
    let testOrderId;

    beforeAll(async () => {
      // Создаём обычного пользователя для заказов
      const regularUser = { name: 'OrderUser', email: 'orderuser@example.com', password: 'password123' };
      regularUserToken = await registerAndGetToken(regularUser);

      // Получаем цену продукта adminProductId (всё ещё существует)
      const [productRows] = await testDb.query('SELECT price FROM products WHERE id = ?', [adminProductId]);
      const productPrice = productRows[0].price;

      // Создаём заказ от имени этого пользователя через API
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          address: 'Test Address 123',
          phone: '+1234567890',
          items: [
            { productId: adminProductId, quantity: 2, price: productPrice }
          ]
        });

      testOrderId = orderRes.body.orderId;
    });

    afterAll(async () => {
      // Удаляем тестовый заказ и его позиции, чтобы не мешать удалению продукта
      await testDb.query('DELETE FROM order_items WHERE order_id = ?', [testOrderId]);
      await testDb.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
    });

    describe('GET /api/admin/orders', () => {
      it('should return list of orders with pagination', async () => {
        const res = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('orders');
        expect(Array.isArray(res.body.orders)).toBe(true);
        expect(res.body.orders.length).toBeGreaterThan(0);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          totalPages: expect.any(Number),
          totalItems: expect.any(Number),
        });

        // Проверим, что наш заказ в списке и содержит items
        const ourOrder = res.body.orders.find(o => o.id === testOrderId);
        expect(ourOrder).toBeDefined();
        expect(ourOrder.user_email).toBe('orderuser@example.com');
        expect(Array.isArray(ourOrder.items)).toBe(true);
        expect(ourOrder.items.length).toBeGreaterThan(0);
      });

      it('should filter orders by status', async () => {
        const res = await request(app)
          .get('/api/admin/orders?status=pending')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        res.body.orders.forEach(order => {
          expect(order.status).toBe('pending');
        });
      });

      it('should filter orders by email', async () => {
        const res = await request(app)
          .get('/api/admin/orders?email=orderuser')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.orders.length).toBeGreaterThan(0);
        res.body.orders.forEach(order => {
          expect(order.user_email).toMatch(/orderuser/i);
        });
      });

      it('should return 403 for regular user', async () => {
        const res = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .get('/api/admin/orders');

        expect(res.status).toBe(401);
      });
    });

    describe('PUT /api/admin/orders/:id/status', () => {
      it('should update order status to shipped', async () => {
        const res = await request(app)
          .put(`/api/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'shipped' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Order status updated');

        // Проверяем, что статус действительно изменился
        const [orders] = await testDb.query('SELECT status FROM orders WHERE id = ?', [testOrderId]);
        expect(orders[0].status).toBe('shipped');
      });

      it('should return 400 for invalid status', async () => {
        const res = await request(app)
          .put(`/api/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'invalid_status' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid status');
      });

      it('should return 403 for regular user', async () => {
        const res = await request(app)
          .put(`/api/admin/orders/${testOrderId}/status`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ status: 'delivered' });

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .put(`/api/admin/orders/${testOrderId}/status`)
          .send({ status: 'cancelled' });

        expect(res.status).toBe(401);
      });
    });
  });

  describe('Users management (admin)', () => {
    let regularUserToken;
    let regularUserId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'ManageUser', email: 'manageuser@example.com', password: 'password123' });
      regularUserToken = res.body.token;
      regularUserId = res.body.user.id;
    });

    describe('GET /api/admin/users', () => {
      it('should return list of users with pagination', async () => {
        const res = await request(app)
          .get('/api/admin/users?limit=100')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('users');
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body.users.length).toBeGreaterThan(0);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 100,
          totalPages: expect.any(Number),
          totalItems: expect.any(Number),
        });

        const ourUser = res.body.users.find(u => u.id === regularUserId);
        expect(ourUser).toBeDefined();
        expect(ourUser.email).toBe('manageuser@example.com');
      });

      it('should return 403 for regular user', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .get('/api/admin/users');

        expect(res.status).toBe(401);
      });
    });

    describe('PUT /api/admin/users/:id/role', () => {
      it('should change user role to admin', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'admin' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User role updated');

        const [rows] = await testDb.query('SELECT role FROM users WHERE id = ?', [regularUserId]);
        expect(rows[0].role).toBe('admin');
      });

      it('should return 400 for invalid role', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'superadmin' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid role');
      });

      it('should return 403 for regular user', async () => {
        // Создаём нового обычного пользователя, чтобы гарантировать не-админский токен
        const anotherRes = await request(app)
          .post('/api/auth/register')
          .send({ name: 'Another', email: 'another@example.com', password: 'password123' });
        const anotherToken = anotherRes.body.token;

        const res = await request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .set('Authorization', `Bearer ${anotherToken}`)
          .send({ role: 'user' });

        expect(res.status).toBe(403);
      });

      it('should return 401 without token', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${regularUserId}/role`)
          .send({ role: 'admin' });

        expect(res.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    // Перед удалением продукта удаляем все заказы, которые на него ссылаются
    beforeAll(async () => {
      // Удаляем order_items и заказы, связанные с adminProductId
      await testDb.query('DELETE oi FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = ?', [adminProductId]);
      // Также можно удалить сами заказы, которые стали пустыми
      // Но проще просто очистить зависимые записи, чтобы продукт можно было удалить
    });

    it('should delete a product as admin', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Product deleted');

      // Verify product is actually deleted
      const check = await request(app)
        .get(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(check.status).toBe(404);
    });

    it('should return 200 even if product does not exist (idempotent)', async () => {
      // Try deleting again
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Product deleted');
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'DelUser', email: 'deluser@example.com', password: 'password123' });
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${adminProductId}`);
      expect(res.status).toBe(401);
    });
  });

});

describe('User Profile API', () => {
  let userToken;
  let anotherUserToken;

  beforeAll(async () => {
    // Создаём основного пользователя
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Profile User', email: 'profile@example.com', password: 'password123' });
    userToken = res.body.token;
    // Создаём второго пользователя для проверки конфликта email
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'other@example.com', password: 'password123' });
    anotherUserToken = res2.body.token;
  });

  describe('PUT /api/users/profile', () => {
    it('should update user name and email', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name', email: 'updated@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.email).toBe('updated@example.com');
    });

    it('should return 400 if no fields to update', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No fields to update');
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if email already in use by another user', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'other@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email already in use');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('Contact API', () => {
    describe('POST /api/contact', () => {
      it('should send contact message', async () => {
        const res = await request(app)
          .post('/api/contact')
          .send({ subject: 'Test Subject', message: 'This is a test message with enough length' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 400 if subject is missing', async () => {
        const res = await request(app)
          .post('/api/contact')
          .send({ message: 'This is a test message with enough length' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid data');
      });

      it('should return 400 if subject is too short', async () => {
        const res = await request(app)
          .post('/api/contact')
          .send({ subject: 'ab', message: 'This is a test message with enough length' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid data');
      });

      it('should return 400 if message is too short', async () => {
        const res = await request(app)
          .post('/api/contact')
          .send({ subject: 'Test Subject', message: 'Short' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid data');
      });
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password updated successfully');

      // Проверим, что можем войти с новым паролем
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'updated@example.com', password: 'newpass123' }); // email был изменён ранее
      expect(loginRes.status).toBe(200);
    });

    it('should return 401 if current password is incorrect', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpass456' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Current password is incorrect');
    });

    it('should return 400 if new password is too short', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'newpass123', newPassword: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/users/password')
        .send({ currentPassword: 'any', newPassword: '123456' });

      expect(res.status).toBe(401);
    });
  });
});

describe('POST /api/products/by-ids', () => {
  let testProductId1;
  let testProductId2;

  beforeAll(async () => {
    // Создаём тестовые продукты специально для этого блока
    await testDb.query("INSERT IGNORE INTO categories (name) VALUES ('ByIDs Category')");
    const [catRows] = await testDb.query("SELECT id FROM categories WHERE name='ByIDs Category' LIMIT 1");
    const catId = catRows[0].id;

    const [res1] = await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('ByIDs Product 1', ?, 10.00, 5)",
      [catId]
    );
    const [res2] = await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('ByIDs Product 2', ?, 20.00, 5)",
      [catId]
    );
    testProductId1 = res1.insertId;
    testProductId2 = res2.insertId;
  });

  it('should return products for given ids', async () => {
    const res = await request(app)
      .post('/api/products/by-ids')
      .send({ ids: [testProductId1, testProductId2] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const ids = res.body.map(p => p.id);
    expect(ids).toContain(testProductId1);
    expect(ids).toContain(testProductId2);
  });

  it('should return empty array if no ids provided', async () => {
    const res = await request(app)
      .post('/api/products/by-ids')
      .send({ ids: [] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return only existing products', async () => {
    const res = await request(app)
      .post('/api/products/by-ids')
      .send({ ids: [testProductId1, 99999] });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(testProductId1);
  });
});