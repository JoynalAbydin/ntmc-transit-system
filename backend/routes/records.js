const express = require('express');
const router  = express.Router();
const { getDb } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// ── Helper: fetch single record with letters+addresses ──
async function fetchFull(db, id) {
  const row = await db.execute({ sql: 'SELECT * FROM records WHERE id = ?', args: [id] });
  const record = row.rows[0];
  if (!record) return null;

  const lRows = await db.execute({ sql: 'SELECT * FROM letters WHERE record_id = ? ORDER BY id', args: [Number(record.id)] });
  const letters = [];
  for (const l of lRows.rows) {
    const aRows = await db.execute({ sql: 'SELECT * FROM addresses WHERE letter_id = ? ORDER BY address_order', args: [Number(l.id)] });
    letters.push({
      ...l,
      letter_numbers: (l.letter_number || '').split('\n').filter(Boolean),
      letter_dates:   (l.letter_date   || '').split('\n').filter(Boolean),
      addresses:      aRows.rows,
      letter_types:   (() => { try { const p = JSON.parse(l.letter_type || '[]'); return Array.isArray(p) ? p : [p].filter(Boolean); } catch { return l.letter_type ? [l.letter_type] : []; } })()
    });
  }
  return { ...record, letters };
}

// ── Helper: next serial number ──
async function nextSerial(db) {
  const year = new Date().getFullYear();
  const last = await db.execute({ sql: "SELECT serial_number FROM records WHERE serial_number LIKE ? ORDER BY id DESC LIMIT 1", args: [`TMS-${year}-%`] });
  let seq = 1;
  if (last.rows[0]) { const p = last.rows[0].serial_number.split('-'); seq = parseInt(p[2]) + 1; }
  return `TMS-${year}-${String(seq).padStart(4, '0')}`;
}

// ── GET all records ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { search, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const s = search ? `%${search}%` : null;

    let records, totalRow;
    if (s) {
      [records, totalRow] = await Promise.all([
        db.execute({ sql: `SELECT r.*, u.full_name as creator_name FROM records r LEFT JOIN users u ON r.created_by = u.id WHERE r.serial_number LIKE ? OR r.distribution_area LIKE ? OR r.description LIKE ? ORDER BY r.id DESC LIMIT ? OFFSET ?`, args: [s, s, s, parseInt(limit), offset] }),
        db.execute({ sql: `SELECT COUNT(*) as total FROM records WHERE serial_number LIKE ? OR distribution_area LIKE ? OR description LIKE ?`, args: [s, s, s] })
      ]);
    } else {
      [records, totalRow] = await Promise.all([
        db.execute({ sql: `SELECT r.*, u.full_name as creator_name FROM records r LEFT JOIN users u ON r.created_by = u.id ORDER BY r.id DESC LIMIT ? OFFSET ?`, args: [parseInt(limit), offset] }),
        db.execute('SELECT COUNT(*) as total FROM records')
      ]);
    }
    res.json({ records: records.rows, total: Number(totalRow.rows[0].total), page: parseInt(page), limit: parseInt(limit) });
  } catch(err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── GET single record ──
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await fetchFull(getDb(), req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── POST create ──
router.post('/', authMiddleware, async (req, res) => {
  const db = getDb();
  const { date, distribution_area, description, letters, status } = req.body;
  if (!date)              return res.status(400).json({ error: 'Date required' });
  if (!distribution_area) return res.status(400).json({ error: 'Distribution area required' });

  try {
    const serial    = await nextSerial(db);
    const recStatus = status === 'draft' ? 'draft' : 'published';

    const recResult = await db.execute({
      sql:  'INSERT INTO records (serial_number, date, distribution_area, description, status, created_by) VALUES (?,?,?,?,?,?)',
      args: [serial, date, distribution_area, description || '', recStatus, req.user.id]
    });
    const recordId = Number(recResult.lastInsertRowid);

    for (const letter of (letters || [])) {
      const numStr  = Array.isArray(letter.letter_numbers) ? letter.letter_numbers.join('\n') : (letter.letter_number || '');
      const dateStr = Array.isArray(letter.letter_dates)   ? letter.letter_dates.join('\n')   : (letter.letter_date  || '');
      const ltStr   = letter.letter_type || (Array.isArray(letter.letter_types) ? (letter.letter_types[0] || '') : '');

      const lResult = await db.execute({ sql: 'INSERT INTO letters (record_id, letter_number, letter_date, letter_type) VALUES (?,?,?,?)', args: [recordId, numStr, dateStr, ltStr] });
      const letterId = Number(lResult.lastInsertRowid);

      // Suggestions
      for (const n of (letter.letter_numbers || []).filter(Boolean)) {
        await db.execute({ sql: 'INSERT OR IGNORE INTO letter_number_suggestions (letter_number) VALUES (?)', args: [n] });
        await db.execute({ sql: 'UPDATE letter_number_suggestions SET use_count=use_count+1 WHERE letter_number=?', args: [n] });
      }

      for (const [idx, addr] of (letter.addresses || []).entries()) {
        const txt = typeof addr === 'string' ? addr : addr.address_text;
        if (!txt) continue;
        const norm = txt.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
        await db.execute({ sql: 'INSERT INTO addresses (letter_id, address_text, address_order) VALUES (?,?,?)', args: [letterId, norm, idx] });
        await db.execute({ sql: 'INSERT OR IGNORE INTO address_suggestions (address_text, use_count) VALUES (?,1)', args: [norm] });
        await db.execute({ sql: 'UPDATE address_suggestions SET use_count=use_count+1 WHERE address_text=?', args: [norm] });
      }
    }

    res.status(201).json({ id: recordId, serial_number: serial });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Save failed: ' + err.message }); }
});

// ── PUT update (creates new record) ──
router.put('/:id', authMiddleware, async (req, res) => {
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT * FROM records WHERE id = ?', args: [req.params.id] });
  if (!existing.rows[0]) return res.status(404).json({ error: 'Record not found' });
  const record = existing.rows[0];

  // Admin-only inline description update
  if (req.body.descriptionOnly) {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    await db.execute({ sql: "UPDATE records SET description=?, updated_at=datetime('now') WHERE id=?", args: [req.body.description, record.id] });
    return res.json({ message: 'Description updated' });
  }

  const { date, distribution_area, description, letters, status } = req.body;
  try {
    const serial    = await nextSerial(db);
    const newStatus = status === 'draft' ? 'draft' : 'published';

    const recResult = await db.execute({
      sql:  'INSERT INTO records (serial_number, date, distribution_area, description, status, created_by) VALUES (?,?,?,?,?,?)',
      args: [serial, date || record.date, distribution_area || record.distribution_area, description !== undefined ? description : record.description, newStatus, req.user.id]
    });
    const newId = Number(recResult.lastInsertRowid);

    for (const letter of (letters || [])) {
      const numStr  = Array.isArray(letter.letter_numbers) ? letter.letter_numbers.join('\n') : (letter.letter_number || '');
      const dateStr = Array.isArray(letter.letter_dates)   ? letter.letter_dates.join('\n')   : (letter.letter_date  || '');
      const ltStr   = letter.letter_type || (Array.isArray(letter.letter_types) ? (letter.letter_types[0] || '') : '');

      const lResult = await db.execute({ sql: 'INSERT INTO letters (record_id, letter_number, letter_date, letter_type) VALUES (?,?,?,?)', args: [newId, numStr, dateStr, ltStr] });
      const lid = Number(lResult.lastInsertRowid);

      for (const [idx, addr] of (letter.addresses || []).entries()) {
        const txt = typeof addr === 'string' ? addr : addr.address_text;
        if (!txt) continue;
        await db.execute({ sql: 'INSERT INTO addresses (letter_id, address_text, address_order) VALUES (?,?,?)', args: [lid, txt, idx] });
        await db.execute({ sql: 'INSERT OR IGNORE INTO address_suggestions (address_text) VALUES (?)', args: [txt] });
      }
    }
    res.json({ message: 'New record created from edit', id: newId, serial_number: serial });
  } catch(err) { res.status(500).json({ error: 'Update failed: ' + err.message }); }
});

// ── PATCH publish ──
router.patch('/:id/publish', authMiddleware, async (req, res) => {
  try {
    await getDb().execute({ sql: "UPDATE records SET status='published', updated_at=datetime('now') WHERE id=?", args: [req.params.id] });
    res.json({ message: 'Published' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH description (admin) ──
router.patch('/:id/description', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    await getDb().execute({ sql: "UPDATE records SET description=?, updated_at=datetime('now') WHERE id=?", args: [req.body.description || '', req.params.id] });
    res.json({ message: 'Updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE ──
router.delete('/:id', authMiddleware, async (req, res) => {
  const db = getDb();
  try {
    const row = await db.execute({ sql: 'SELECT id FROM records WHERE id = ?', args: [req.params.id] });
    if (!row.rows[0]) return res.status(404).json({ error: 'Not found' });

    const ls = await db.execute({ sql: 'SELECT id FROM letters WHERE record_id = ?', args: [req.params.id] });
    for (const l of ls.rows) await db.execute({ sql: 'DELETE FROM addresses WHERE letter_id = ?', args: [Number(l.id)] });
    await db.execute({ sql: 'DELETE FROM letters WHERE record_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM records WHERE id = ?',        args: [req.params.id] });
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: 'Delete failed: ' + err.message }); }
});

module.exports = { router, fetchFull };
