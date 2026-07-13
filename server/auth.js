const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set in production. Set a strong secret in environment variables.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set. Using auto-generated development secret. Set JWT_SECRET in production.');
}

// В development генерируем случайный секрет при каждом запуске (сессии сбрасываются)
const DEV_SECRET = JWT_SECRET || crypto.randomBytes(64).toString('hex');

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, DEV_SECRET, { expiresIn: '7d' });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader, 'URL:', req.originalUrl);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, DEV_SECRET);
    req.user = decoded;
    console.log('Token verified for user:', decoded.userId, 'role:', decoded.role);
    next();
  } catch (err) {
    console.log('Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Новая middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { generateToken, verifyToken, requireAdmin };