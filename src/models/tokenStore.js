import crypto from 'crypto';
import { query } from '../config/db.js';

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken({ userId, refreshToken, parentHash, ttlDays, userAgent, ip }) {
  const hash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);
  const { rows } = await query(`INSERT INTO token_store (user_id, refresh_token_hash, parent_token_hash, expires_at, user_agent, ip) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [userId, hash, parentHash || null, expiresAt, userAgent || null, ip || null]);
  return rows[0];
}

export async function findTokenByHash(hash) {
  const { rows } = await query(`SELECT * FROM token_store WHERE refresh_token_hash=$1`, [hash]);
  return rows[0] || null;
}

export async function revokeTokenChain(hash) {
  await query(`UPDATE token_store SET revoked=true, revoked_at=NOW() WHERE refresh_token_hash=$1 OR parent_token_hash=$1`, [hash]);
}

export async function revokeToken(hash) {
  await query(`UPDATE token_store SET revoked=true, revoked_at=NOW() WHERE refresh_token_hash=$1`, [hash]);
}

export async function rotateRefreshToken(oldHash, newToken, ttlDays, userAgent, ip) {
  const newHash = hashToken(newToken);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);
  const { rows } = await query(`INSERT INTO token_store (user_id, refresh_token_hash, parent_token_hash, expires_at, user_agent, ip)
    SELECT user_id, $1, refresh_token_hash, $2, $3, $4 FROM token_store WHERE refresh_token_hash=$5 RETURNING *`, [newHash, expiresAt, userAgent || null, ip || null, oldHash]);
  return rows[0];
}

export async function listUserSessions(userId) {
  const { rows } = await query(`SELECT * FROM token_store WHERE user_id=$1 AND revoked=false ORDER BY created_at DESC`, [userId]);
  return rows;
}
