// Мокаем ESM-модули, чтобы избежать ошибок парсинга
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));
jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));

const request = require('supertest');
const app = require('../server');
const { testDb, resetDatabase } = require('./test-setup');

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await testDb.end();
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