const jwt = require('jsonwebtoken');

// JWT secret অবশ্যই environment variable থেকে আসতে হবে। কোনো default/fallback নেই।
// না থাকলে (বা খুব ছোট হলে) server চালুই হবে না, যাতে নকল token বানানো না যায়।
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error(
    'JWT_SECRET সেট করা নেই বা খুব ছোট (কমপক্ষে ১৬ অক্ষর)। Render → Environment-এ লম্বা random JWT_SECRET দিন।'
  );
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
