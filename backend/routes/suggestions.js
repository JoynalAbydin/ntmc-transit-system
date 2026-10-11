const express = require('express');
const router  = express.Router();
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// ── Address suggestions ──
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const db  = getDb();
    const row = q
      ? await db.execute({ sql: 'SELECT * FROM address_suggestions WHERE address_text LIKE ? ORDER BY use_count DESC LIMIT 10', args: [`%${q}%`] })
      : await db.execute('SELECT * FROM address_suggestions ORDER BY use_count DESC LIMIT 10');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/addresses/all', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const db  = getDb();
    const row = search
      ? await db.execute({ sql: 'SELECT * FROM address_suggestions WHERE address_text LIKE ? ORDER BY use_count DESC', args: [`%${search}%`] })
      : await db.execute('SELECT * FROM address_suggestions ORDER BY use_count DESC');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { address_text } = req.body;
    if (!address_text?.trim()) return res.status(400).json({ error: 'Address required' });
    const normalized = address_text.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n');

    const existing = await db.execute('SELECT * FROM address_suggestions');
    const dup = existing.rows.some(r => (r.address_text||'').trim().split('\n').map(l=>l.trim()).filter(Boolean).join('\n').toLowerCase() === normalized.toLowerCase());
    if (dup) return res.status(409).json({ error: 'এই ঠিকানা ইতিমধ্যে তালিকায় আছে' });

    const result = await db.execute({ sql: 'INSERT INTO address_suggestions (address_text, use_count) VALUES (?, 0)', args: [normalized] });
    res.status(201).json({ id: Number(result.lastInsertRowid), address_text: normalized, use_count: 0 });
  } catch(err) { res.status(409).json({ error: 'ঠিকানা ইতিমধ্যে আছে' }); }
});

router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { address_text } = req.body;
    if (!address_text?.trim()) return res.status(400).json({ error: 'Address required' });
    await getDb().execute({ sql: 'UPDATE address_suggestions SET address_text = ? WHERE id = ?', args: [address_text.trim(), req.params.id] });
    res.json({ message: 'Updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    await getDb().execute({ sql: 'DELETE FROM address_suggestions WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── Letter number suggestions ──
router.get('/letters', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const db  = getDb();
    const row = q
      ? await db.execute({ sql: 'SELECT * FROM letter_number_suggestions WHERE letter_number LIKE ? ORDER BY use_count DESC LIMIT 10', args: [`%${q}%`] })
      : await db.execute('SELECT * FROM letter_number_suggestions ORDER BY use_count DESC LIMIT 10');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/letters/all', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const db  = getDb();
    const row = search
      ? await db.execute({ sql: 'SELECT * FROM letter_number_suggestions WHERE letter_number LIKE ? ORDER BY use_count DESC', args: [`%${search}%`] })
      : await db.execute('SELECT * FROM letter_number_suggestions ORDER BY use_count DESC');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/letters', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { letter_number } = req.body;
    if (!letter_number?.trim()) return res.status(400).json({ error: 'Letter number required' });
    const normalized = letter_number.trim();

    const existing = await db.execute('SELECT * FROM letter_number_suggestions');
    const dup = existing.rows.some(r => (r.letter_number||'').trim().toLowerCase() === normalized.toLowerCase());
    if (dup) return res.status(409).json({ error: 'এই পত্র নং ইতিমধ্যে তালিকায় আছে' });

    const result = await db.execute({ sql: 'INSERT INTO letter_number_suggestions (letter_number, use_count) VALUES (?, 0)', args: [normalized] });
    res.status(201).json({ id: Number(result.lastInsertRowid), letter_number: normalized, use_count: 0 });
  } catch(err) { res.status(409).json({ error: 'পত্র নং ইতিমধ্যে আছে' }); }
});

router.put('/letters/:id', authMiddleware, async (req, res) => {
  try {
    const { letter_number } = req.body;
    if (!letter_number?.trim()) return res.status(400).json({ error: 'Letter number required' });
    await getDb().execute({ sql: 'UPDATE letter_number_suggestions SET letter_number = ? WHERE id = ?', args: [letter_number.trim(), req.params.id] });
    res.json({ message: 'Updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/letters/:id', authMiddleware, async (req, res) => {
  try {
    await getDb().execute({ sql: 'DELETE FROM letter_number_suggestions WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/areas', authMiddleware, async (req, res) => {
  try {
    const row = await getDb().execute('SELECT * FROM distribution_areas');
    res.json(row.rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
