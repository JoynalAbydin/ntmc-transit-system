const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../database/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db  = getDb();
    const row = await db.execute({ sql: 'SELECT * FROM users WHERE username = ? AND is_active = 1', args: [username] });
    const user = row.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: Number(user.id), username: user.username, role: user.role, full_name: user.full_name },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: Number(user.id), username: user.username, role: user.role, full_name: user.full_name } });
  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db  = getDb();
    const row = await db.execute({ sql: 'SELECT id, username, role, full_name, created_at FROM users WHERE id = ?', args: [req.user.id] });
    if (!row.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(row.rows[0]);
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
