const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
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
    const decoded = jwt.verify(token, JWT_SECRET);
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