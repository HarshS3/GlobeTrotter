import crypto from 'crypto';
import { query } from '../config/db.js';

export function generateApiKey() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey({ userId, name, scopes }) {
  const key = generateApiKey();
  const keyHash = hashKey(key);
  const { rows } = await query(`INSERT INTO api_keys (user_id, key_hash, name, scopes) VALUES ($1,$2,$3,$4) RETURNING *`, [userId, keyHash, name || null, scopes || null]);
  return { record: rows[0], plain: key };
}

export async function revokeApiKey(id) { await query(`UPDATE api_keys SET revoked=true, revoked_at=NOW() WHERE id=$1`, [id]); }

export async function listApiKeys(userId) {
  const { rows } = await query(`SELECT id, name, scopes, revoked, created_at, revoked_at FROM api_keys WHERE user_id=$1 ORDER BY created_at DESC`, [userId]);
  return rows;
}

export async function findApiKeyByHash(hash) {
  const { rows } = await query(`SELECT * FROM api_keys WHERE key_hash=$1 AND revoked=false`, [hash]);
  return rows[0] || null;
}
