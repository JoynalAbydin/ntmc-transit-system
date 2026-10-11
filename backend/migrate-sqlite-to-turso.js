require('dotenv').config();
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { createClient } = require('@libsql/client');

const SOURCE_DB = path.join(__dirname, '..', 'migration', 'transit.db');
const TABLES = [
  ['users', ['id','username','password','role','full_name','created_at','is_active'], 'replace'],
  ['distribution_areas', ['id','name','name_bn'], 'replace'],
  ['records', ['id','serial_number','date','distribution_area','description','status','created_by','created_at','updated_at'], 'ignore'],
  ['letters', ['id','record_id','letter_number','letter_date','created_at','letter_type'], 'ignore'],
  ['addresses', ['id','letter_id','address_text','address_order','created_at'], 'ignore'],
  ['address_suggestions', ['id','address_text','use_count','created_at'], 'ignore'],
  ['letter_number_suggestions', ['id','letter_number','use_count','created_at'], 'ignore'],
];

function readRows(db, table) {
  const stmt = db.prepare(`SELECT * FROM "${table}"`);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function main() {
  if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
    throw new Error('Set TURSO_URL and TURSO_TOKEN in your terminal environment before running migration.');
  }
  if (!fs.existsSync(SOURCE_DB)) throw new Error(`Source SQLite database not found: ${SOURCE_DB}`);

  const SQL = await initSqlJs();
  const source = new SQL.Database(fs.readFileSync(SOURCE_DB));
  const client = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });

  try {
    const counts = await Promise.all(['records','letters','addresses'].map(async table => {
      const result = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
      return [table, Number(result.rows[0].n)];
    }));
    const nonEmpty = counts.filter(([,n]) => n > 0);
    if (nonEmpty.length) {
      throw new Error(`Turso already contains data (${nonEmpty.map(([t,n])=>`${t}=${n}`).join(', ')}). Migration stopped to prevent accidental overwrite. Use a fresh/empty database.`);
    }

    const tx = await client.transaction('write');
    let total = 0;
    try {
      for (const [table, columns, mode] of TABLES) {
        const rows = readRows(source, table);
        for (const row of rows) {
          const placeholders = columns.map(() => '?').join(',');
          const verb = mode === 'replace' ? 'INSERT OR REPLACE' : 'INSERT OR IGNORE';
          const sql = `${verb} INTO "${table}" (${columns.map(c=>`"${c}"`).join(',')}) VALUES (${placeholders})`;
          const args = columns.map(c => row[c] === undefined ? null : row[c]);
          await tx.execute({ sql, args });
          total++;
        }
        console.log(`Imported ${table}: ${rows.length}`);
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
    console.log(`Migration complete. Rows processed: ${total}`);
    console.log('Verify records, letters, addresses and users before switching the public frontend.');
  } finally {
    source.close();
    client.close();
  }
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
