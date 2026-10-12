require('dotenv').config();
const express = require('express');
const cors    = require('cors');
require('./middleware/auth');   // JWT_SECRET না থাকলে এখানেই (DB-র আগে) server বন্ধ হবে
const { initDb } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS: শুধু FRONTEND_URL-এ দেওয়া ঠিকানা থেকে ব্রাউজার request চলবে ──
// FRONTEND_URL = https://username.github.io   (একাধিক হলে comma দিয়ে; শেষে / বা path নয়)
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean)
  .map(u => { try { return new URL(u).origin; } catch { return u.replace(/\/+$/, ''); } });

if (allowedOrigins.length === 0)
  console.warn('⚠️  FRONTEND_URL সেট নেই: কোনো ব্রাউজার সাইট API ব্যবহার করতে পারবে না।');

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                 // curl, UptimeRobot, server-to-server (ব্রাউজার নয়)
    return cb(null, allowedOrigins.includes(origin));   // তালিকায় না থাকলে CORS header দেওয়া হয় না
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── UptimeRobot ping endpoint (keep-alive) ──
app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

initDb().then(() => {
  console.log('✅ Database ready');

  app.use('/api/auth',        require('./routes/auth'));
  app.use('/api/users',       require('./routes/users'));
  app.use('/api/records',     require('./routes/records').router);
  app.use('/api/suggestions', require('./routes/suggestions'));
  app.use('/api/pdf',         require('./routes/pdf'));
  app.use('/api/backup',      require('./routes/backup'));

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

}).catch(err => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
