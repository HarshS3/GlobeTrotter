import jwt from 'jsonwebtoken';
import { config, cookieOptions } from '../core/config.js';
import { ApiError } from '../core/apiError.js';
import { TokenCookie } from '../core/constants.js';
import { findUserById } from '../models/users.js';

export function signAccessToken(user, mfaVerified = false) {
  const payload = { userId: user.id, email: user.email, isMfaActive: user.is_mfa_active, mfaVerified };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: `${config.accessTokenTtlMin}m` });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function attachAuthCookies(res, user, refreshTokenPlain, mfaVerified) {
  const access = signAccessToken(user, mfaVerified);
  res.cookie(TokenCookie.ACCESS, access, { ...cookieOptions, maxAge: config.accessTokenTtlMin * 60 * 1000 });
  if (refreshTokenPlain) {
    res.cookie(TokenCookie.REFRESH, refreshTokenPlain, { ...cookieOptions, maxAge: config.refreshTokenTtlDays * 24 * 3600 * 1000 });
  }
}

export function clearAuthCookies(res) {
  res.clearCookie(TokenCookie.ACCESS, cookieOptions);
  res.clearCookie(TokenCookie.REFRESH, cookieOptions);
}

export function authenticate(optional = false) {
  return async (req, _res, next) => {
    try {
      const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
      const token = req.cookies?.[TokenCookie.ACCESS] || bearer;
      if (!token) {
        if (optional) return next();
        throw ApiError.unauthorized();
      }
      const decoded = verifyAccessToken(token);
      const user = await findUserById(decoded.userId);
      if (!user) throw ApiError.unauthorized();
      req.user = user;
      req.auth = decoded;
      next();
    } catch (e) {
      if (optional) return next();
      next(ApiError.unauthorized());
    }
  };
}

// Role-based authorization removed (roles pruned from user schema)

export function requireMfaVerified() {
  // TEMPORARILY DISABLED: MFA enforcement bypassed. Restore previous logic when re-enabling 2FA gate.
  return (_req, _res, next) => next();
}
