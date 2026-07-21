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

    // Минимальный PNG буфер (1x1 пиксель)
    const minimalPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x00, 0x00,
      0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);

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
        .attach('image', minimalPng, 'test.png');

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
        .attach('image', minimalPng, 'test.png');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Товар не найден');
    });

    it('should return 400 for invalid product ID', async () => {
      const res = await request(app)
        .post('/api/admin/products/abc/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', minimalPng, 'test.png');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Неверный ID товара');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .attach('image', minimalPng, 'test.png');

      expect(res.status).toBe(401);
    });

    it('should return 403 for regular user', async () => {
      const userToken = await registerAndGetToken({ name: 'UploadUser', email: 'upload@example.com', password: 'password123' });
      const res = await request(app)
        .post(`/api/admin/products/${adminProductId}/upload`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', minimalPng, 'test.png');

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
});

describe('Reviews API', () => {
  let userToken;
  let productId;

  beforeAll(async () => {
    // Очистка и подготовка данных
    await testDb.query('DELETE FROM reviews');
    await testDb.query('DELETE FROM order_items');
    await testDb.query('DELETE FROM orders');
    await testDb.query('DELETE FROM products');
    await testDb.query('DELETE FROM categories');
    await testDb.query('DELETE FROM users');

    // Создаём категорию и продукт
    const [catResult] = await testDb.query("INSERT INTO categories (name) VALUES ('Review Category')");
    const categoryId = catResult.insertId;
    const [productResult] = await testDb.query(
      "INSERT INTO products (name, category_id, price, stock) VALUES ('Review Product', ?, 19.99, 50)", [categoryId]
    );
    productId = productResult.insertId;

    // Регистрируем пользователя
    userToken = await registerAndGetToken(validUser);
  });

  describe('POST /api/products/:id/reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 4, comment: 'Nice product' });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Review added');
    });

    it('should return 400 if rating is missing', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comment: 'No rating' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .send({ rating: 3 });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/products/:id/reviews', () => {
    it('should return reviews array', async () => {
      const res = await request(app)
        .get(`/api/products/${productId}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reviews');
      expect(Array.isArray(res.body.reviews)).toBe(true);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let reviewId;

    beforeAll(async () => {
      // Создаём отзыв для тестов удаления
      await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, comment: 'Delete me' });

      const reviewsRes = await request(app)
        .get(`/api/products/${productId}/reviews`);
      reviewId = reviewsRes.body.reviews[0].id;
    });

    it('should delete own review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 if trying to delete review of another user', async () => {
      // Создаём отзыв от другого пользователя
      const anotherUserToken = await registerAndGetToken({ name: 'Other', email: 'other@example.com', password: 'password123' });
      const createRes = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ rating: 2, comment: 'Not good' });

      const reviewsRes = await request(app)
        .get(`/api/products/${productId}/reviews`);
      const otherReviewId = reviewsRes.body.reviews.find(r => r.comment === 'Not good').id;

      // Пытаемся удалить под нашим пользователем
      const res = await request(app)
        .delete(`/api/reviews/${otherReviewId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`);
      expect(res.status).toBe(401);
    });
  });
});