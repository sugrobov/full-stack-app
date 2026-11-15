const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV !== 'production';

if (!process.env.JWT_SECRET) {
  if (!isDev) {
    console.error('FATAL: JWT_SECRET is not set in production. Set a strong secret in environment variables.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set. Using auto-generated development secret. Set JWT_SECRET in production.');
}

const DEV_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const getSecret = () => process.env.JWT_SECRET || DEV_SECRET;

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, getSecret(), { expiresIn: '7d' });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (isDev) {
    console.log('Auth:', req.method, req.originalUrl, 'hasToken:', !!authHeader);
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getSecret());
    req.user = decoded;
    next();
  } catch (err) {
    if (isDev) console.log('Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Access denied. No token provided.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admin only.' });
  next();
};

module.exports = { generateToken, verifyToken, requireAdmin };