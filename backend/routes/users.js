const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { getDb } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db  = getDb();
    const row = await db.execute('SELECT id, username, role, full_name, created_at, is_active FROM users ORDER BY id ASC');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, role, full_name } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Username, password, and role required' });
    const db  = getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Username already exists' });
    const hash   = bcrypt.hashSync(password, 10);
    const result = await db.execute({ sql: 'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)', args: [username, hash, role, full_name || ''] });
    res.status(201).json({ id: Number(result.lastInsertRowid), username, role, full_name });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, full_name, is_active } = req.body;
    const db  = getDb();
    const row = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [req.params.id] });
    if (!row.rows[0]) return res.status(404).json({ error: 'User not found' });
    await db.execute({ sql: 'UPDATE users SET role = ?, full_name = ?, is_active = ? WHERE id = ?', args: [role, full_name, is_active !== undefined ? is_active : 1, req.params.id] });
    res.json({ message: 'User updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/password', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const isSelf  = parseInt(req.params.id) === req.user.id;
    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    const hash = bcrypt.hashSync(password, 10);
    await getDb().execute({ sql: 'UPDATE users SET password = ? WHERE id = ?', args: [hash, req.params.id] });
    res.json({ message: 'Password updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await getDb().execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'User deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
