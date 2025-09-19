import { Pool } from 'pg';
import { config } from '../core/config.js';
import { logger } from '../core/logger.js';

let pool;

export function getPool() {
  if (pool) return pool;
  if (config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl });
  } else {
    pool = new Pool({
      host: config.pg.host,
      user: config.pg.user,
      password: config.pg.password,
      database: config.pg.database,
      port: config.pg.port,
    });
  }
  pool.on('error', (err) => {
    logger.error('PostgreSQL pool error', { error: err.message });
  });
  return pool;
}

export async function query(sql, params) {
  const p = getPool();
  return p.query(sql, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
