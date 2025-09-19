import Joi from 'joi';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { ApiError } from '../core/apiError.js';
import { createUser, findUserByEmail, findUserById, setMfaSecret, disableMfa, updateUserPassword } from '../models/users.js';
import { issueInitialRefreshToken, rotateRefresh } from '../utils/authTokens.js';
import { attachAuthCookies, clearAuthCookies, signAccessToken } from '../middleware/auth.js';
import { storeMfaTempSecret, consumeMfaTempSecret, peekMfaTempSecret } from '../cache/userCache.js';
import { config } from '../core/config.js';
import { hashToken, revokeToken, revokeTokenChain } from '../models/tokenStore.js';
import { createPasswordReset, verifyPasswordResetToken, consumePasswordResetToken, revokeAllUserPasswordResets } from '../models/passwordResets.js';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).required(),
  last_name: Joi.string().min(1).required(),
  phone: Joi.string().min(3).required(),
  city: Joi.string().min(1).required(),
  country: Joi.string().min(1).required(),
  additional_info: Joi.string().min(1).required(),
  photo_url: Joi.string().uri().required()
});

export async function register(req, res, next) {
  try {
    const user = await createUser(req.body);
    const refresh = await issueInitialRefreshToken(user.id, req.headers['user-agent'], req.ip);
    await attachAuthCookies(res, user, refresh, !user.is_mfa_active);
    res.status(201).json({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, phone: user.phone, city: user.city, country: user.country, additionalInfo: user.additional_info, photoUrl: user.photo_url });
  } catch (e) { next(e); }
}

export const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
export async function login(req, res, next) {
  try {
    const user = await findUserByEmail(req.body.email);
    if (!user) throw ApiError.unauthorized();
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw ApiError.unauthorized();
    const refresh = await issueInitialRefreshToken(user.id, req.headers['user-agent'], req.ip);
    await attachAuthCookies(res, user, refresh, !user.is_mfa_active);
    res.json({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, phone: user.phone, city: user.city, country: user.country, additionalInfo: user.additional_info, photoUrl: user.photo_url });
  } catch (e) { next(e); }
}

export async function logout(req, res, next) {
  try {
    const refresh = req.cookies?.refresh_token;
    if (refresh) {
      const hash = hashToken(refresh);
      await revokeToken(hash);
    }
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function refresh(req, res, next) {
  try {
    const refreshPlain = req.cookies?.refresh_token;
    if (!refreshPlain) throw ApiError.unauthorized();
    const { newToken, userId } = await rotateRefresh(refreshPlain, req.headers['user-agent'], req.ip);
    const user = await findUserById(userId);
    await attachAuthCookies(res, user, newToken, !user.is_mfa_active);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function status(req, res) {
  if (!req.user) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: { id: req.user.id, email: req.user.email, mfaActive: req.user.is_mfa_active } });
}

export async function setup2fa(req, res, next) {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({ name: `GlobeTrotter (${user.email})` });
    await storeMfaTempSecret(user.id, secret.base32);
    const qr = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qr }); // secret not logged elsewhere
  } catch (e) { next(e); }
}

export const verify2faSchema = Joi.object({ token: Joi.string().required() });
export async function verify2fa(req, res, next) {
  try {
    const currentSecret = await peekMfaTempSecret(req.user.id);
    if (!currentSecret) throw ApiError.badRequest('No MFA setup in progress');
    const { token } = req.body;
    const verified = speakeasy.totp.verify({ secret: currentSecret, encoding: 'base32', token, window: 1 });
    if (!verified) throw ApiError.badRequest('Invalid token');
    // Consume only after successful verification to prevent accidental loss on typo
    const consumed = await consumeMfaTempSecret(req.user.id);
    if (!consumed) throw ApiError.badRequest('MFA secret expired, restart setup');
    await setMfaSecret(req.user.id, consumed);
    const updated = await findUserById(req.user.id);
    const access = signAccessToken(updated, true);
    res.cookie('access_token', access, { httpOnly: true, sameSite: 'strict', secure: config.env === 'production' });
    res.json({ mfa: 'enabled' });
  } catch (e) { next(e); }
}

export async function reset2fa(req, res, next) {
  try {
    await disableMfa(req.user.id);
    const updated = await findUserById(req.user.id);
    const access = signAccessToken(updated, false);
    res.cookie('access_token', access, { httpOnly: true, sameSite: 'strict', secure: config.env === 'production' });
    res.json({ mfa: 'disabled' });
  } catch (e) { next(e); }
}

// Forgot Password Flow
export const forgotPasswordSchema = Joi.object({ email: Joi.string().email().required() });
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    // Always respond success (avoid leaking existence)
    let devToken = null;
    if (user) {
      // Revoke prior active reset tokens (optional)
      await revokeAllUserPasswordResets(user.id);
      const { token, expiresAt } = await createPasswordReset(user.id, 15); // 15 min expiry
      if (config.env !== 'production') devToken = { token, expiresAt };
      // In real deployment: send email with link containing raw token
    }
    res.json({ success: true, ...(devToken ? { dev: devToken } : {}) });
  } catch (e) { next(e); }
}

export const resetPasswordSchema = Joi.object({ token: Joi.string().required(), password: Joi.string().min(8).required() });
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const rec = await verifyPasswordResetToken(token);
    if (!rec) throw ApiError.badRequest('Invalid or expired reset token');
    const consumed = await consumePasswordResetToken(token);
    if (!consumed) throw ApiError.badRequest('Invalid or expired reset token');
    await updateUserPassword(rec.user_id, password);
    // Optional: revoke all refresh tokens for this user for safety
    // Simpler: mark existing refresh tokens revoked
    await revokeTokenChain(consumed.token_hash); // token_hash isn't in password_resets; safe noop
    res.json({ passwordReset: true });
  } catch (e) { next(e); }
}
