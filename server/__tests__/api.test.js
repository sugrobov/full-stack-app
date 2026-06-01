// Мокаем ESM-модули, чтобы избежать ошибок парсинга
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));

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

describe('Orders API', () => {
  let userToken;
  const sampleOrder = {
    address: '123 Test Street',
    phone: '+1234567890',
    items: [
      { productId: 1, quantity: 2, price: 10.99 },
      { productId: 2, quantity: 1, price: 15.00 }
    ]
  };

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
    await testDb.query("INSERT INTO categories (name) VALUES ('Test Category')");
    await testDb.query(`INSERT INTO products (name, category_id, price, stock) VALUES 
      ('Test Product 1', 1, 10.99, 10),
      ('Test Product 2', 1, 15.00, 10)
    `);
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
      expect(Array.isArray(res.body)).toBe(true);
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