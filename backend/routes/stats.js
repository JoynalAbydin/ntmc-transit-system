const express = require('express');
const router  = express.Router();
const { getDb } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// একটি letters সারিতে একাধিক স্মারক নম্বর থাকতে পারে (নতুন লাইনে আলাদা) — আলাদা আলাদা গুনতে হবে
const countNumbers = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean).length;
const clean        = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD   (শুধু ADMIN)
 * শুধু প্রকাশিত রেকর্ড (draft বাদ)। from/to ঐচ্ছিক (রেকর্ডের তারিখ অনুযায়ী)।
 *
 * চিঠি     = স্মারক নম্বরের সংখ্যা
 * ঠিকানা   = ঠিকানার সংখ্যা (প্রতিটি ঠিকানায় একটি ইনভেলাপ)
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to)))
      return res.status(400).json({ error: 'তারিখ YYYY-MM-DD ফরম্যাটে দিন' });

    const conds = ["COALESCE(r.status, 'published') != 'draft'"];
    const args  = [];
    if (from) { conds.push('r.date >= ?'); args.push(from); }
    if (to)   { conds.push('r.date <= ?'); args.push(to); }
    const where = 'WHERE ' + conds.join(' AND ');

    const db = getDb();
    const [recs, lets, addrs] = await Promise.all([
      db.execute({ sql: `SELECT r.id, r.date, r.distribution_area FROM records r ${where}`, args }),
      db.execute({ sql: `SELECT l.id, l.record_id, l.letter_number FROM letters l JOIN records r ON r.id = l.record_id ${where}`, args }),
      db.execute({ sql: `SELECT a.letter_id, a.address_text FROM addresses a JOIN letters l ON l.id = a.letter_id JOIN records r ON r.id = l.record_id ${where}`, args }),
    ]);

    const recById    = new Map(recs.rows.map(r => [Number(r.id), { date: String(r.date || ''), area: clean(r.distribution_area) || 'অজানা' }]));
    const letterInfo = new Map();                       // letter row id → { record_id, n }
    const byArea = new Map(), byMonth = new Map(), byAddress = new Map();
    const areaRow = (a) => { if (!byArea.has(a)) byArea.set(a, { area: a, records: 0, letters: 0, addresses: 0 }); return byArea.get(a); };

    for (const r of recById.values()) areaRow(r.area).records++;

    let totalLetters = 0;
    for (const l of lets.rows) {
      const rec = recById.get(Number(l.record_id)); if (!rec) continue;
      const n = countNumbers(l.letter_number);
      letterInfo.set(Number(l.id), { record_id: Number(l.record_id), n });
      totalLetters += n;
      areaRow(rec.area).letters += n;
      const month = rec.date.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(month)) byMonth.set(month, (byMonth.get(month) || 0) + n);
    }

    let totalAddresses = 0;
    for (const a of addrs.rows) {
      const li = letterInfo.get(Number(a.letter_id)); if (!li) continue;
      const rec = recById.get(li.record_id);
      totalAddresses++;
      areaRow(rec.area).addresses++;
      const addr = clean(a.address_text); if (!addr) continue;
      const cur = byAddress.get(addr) || { address: addr, letters: 0, envelopes: 0 };
      cur.letters += li.n; cur.envelopes += 1;          // এই ঠিকানায় এই সারির সব চিঠি গেছে
      byAddress.set(addr, cur);
    }

    res.json({
      range:   { from: from || null, to: to || null },
      summary: { records: recs.rows.length, letters: totalLetters, addresses: totalAddresses },
      by_area:    [...byArea.values()].sort((a, b) => b.letters - a.letters || b.records - a.records),
      by_month:   [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, letters]) => ({ month, letters })),
      top_addresses: [...byAddress.values()].sort((a, b) => b.letters - a.letters || b.envelopes - a.envelopes).slice(0, 15),
    });
  } catch (err) { console.error('Stats error:', err); res.status(500).json({ error: 'পরিসংখ্যান তৈরিতে সমস্যা হয়েছে' }); }
});

module.exports = router;
