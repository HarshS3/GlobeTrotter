import { getPool, query, closePool } from '../../src/config/db.js';
import { config } from '../../src/core/config.js';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

beforeAll(async () => {
  const pool = getPool();
  const initSql = fs.readFileSync(path.resolve('src/config/migrations/001_init.sql'), 'utf8');
  await pool.query(initSql);
});

beforeEach(async () => {
  await query('TRUNCATE token_store, api_keys, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await closePool();
});
