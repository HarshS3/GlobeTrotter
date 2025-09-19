import crypto from 'crypto';
import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

// Configuration
const DEFAULT_EXP_MINUTES = 15;

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordReset(userId, ttlMinutes = DEFAULT_EXP_MINUTES) {
  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await query(`INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, [userId, tokenHash, expiresAt]);
  return { token, expiresAt };
}

export async function verifyPasswordResetToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await query(`SELECT * FROM password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1`, [tokenHash]);
  return rows[0] || null;
}

export async function consumePasswordResetToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await query(`UPDATE password_resets SET used_at=NOW() WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW() RETURNING *`, [tokenHash]);
  return rows[0] || null;
}

export async function revokeAllUserPasswordResets(userId) {
  await query(`UPDATE password_resets SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL`, [userId]);
}

export async function cleanupExpiredPasswordResets() {
  await query(`DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL '1 day'`); // keep 1 day grace for audit
}

export { hashToken as hashResetToken };