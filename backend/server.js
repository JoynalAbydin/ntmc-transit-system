require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN || !process.env.JWT_SECRET) {
  console.error('Missing required environment variables: TURSO_URL, TURSO_TOKEN, JWT_SECRET');
  process.exit(1);
}

app.use(cors({ origin: true, credentials: true }));
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
