import { config } from '../core/config.js';
import { generateRefreshToken, hashToken, storeRefreshToken, findTokenByHash, revokeTokenChain, rotateRefreshToken } from '../models/tokenStore.js';
import { ApiError } from '../core/apiError.js';

// Handles issuing initial refresh token and storing hashed version
export async function issueInitialRefreshToken(userId, userAgent, ip) {
  const refresh = generateRefreshToken();
  await storeRefreshToken({ userId, refreshToken: refresh, ttlDays: config.refreshTokenTtlDays, userAgent, ip });
  return refresh;
}

export async function rotateRefresh(refreshTokenPlain, userAgent, ip) {
  const hash = hashToken(refreshTokenPlain);
  const record = await findTokenByHash(hash);
  if (!record || record.revoked) {
    // token reuse / invalid
    if (record && record.parent_token_hash) await revokeTokenChain(record.parent_token_hash);
    throw ApiError.unauthorized('Invalid refresh token');
  }
  if (record.parent_token_hash) {
    // Already rotated -> reuse detection
    await revokeTokenChain(record.parent_token_hash);
    throw ApiError.unauthorized('Refresh token reuse detected');
  }
  const newToken = generateRefreshToken();
  await rotateRefreshToken(hash, newToken, config.refreshTokenTtlDays, userAgent, ip);
  return { newToken, userId: record.user_id };
}
