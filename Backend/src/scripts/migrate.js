import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../config/db.js';

// Minimal migration runner (no ledger, no extensions, simple console logs)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const pool = getPool();
  const dir = path.resolve(__dirname, '../config/migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log(`[migrate] applying ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
  }
  console.log('[migrate] complete');
  await pool.end();
}

run().catch(e => { console.error('[migrate] failed', e); process.exit(1); });
