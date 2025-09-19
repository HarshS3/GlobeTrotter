import Joi from 'joi';
import { findUserById, listUsers, updateUser, deleteUser } from '../models/users.js';
import { uploadBase64Image, uploadBuffer, isCloudinaryEnabled } from '../config/cloudinary.js';
import { ApiError } from '../core/apiError.js';
import { invalidateUserProfile } from '../cache/userCache.js';

export async function getUser(req, res, next) {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw ApiError.notFound();
    res.json({ id: user.id, email: user.email, mfaActive: user.is_mfa_active, firstName: user.first_name, lastName: user.last_name, phone: user.phone, city: user.city, country: user.country, additionalInfo: user.additional_info, photoUrl: user.photo_url });
  } catch (e) { next(e); }
}

export async function list(req, res, next) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (e) { next(e); }
}

export const updateSchema = Joi.object({
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  phone: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  additional_info: Joi.string().optional(),
  photo_url: Joi.string().uri().optional()
});
export async function update(req, res, next) {
  try {
    if (req.user.id !== parseInt(req.params.id,10)) return next(ApiError.forbidden());
    const updated = await updateUser(req.params.id, req.body);
    await invalidateUserProfile(req.params.id);
    res.json({ id: updated.id, email: updated.email, firstName: updated.first_name, lastName: updated.last_name, phone: updated.phone, city: updated.city, country: updated.country, additionalInfo: updated.additional_info, photoUrl: updated.photo_url });
  } catch (e) { next(e); }
}

export async function remove(req, res, next) {
  try {
    if (req.user.id !== parseInt(req.params.id,10)) return next(ApiError.forbidden());
    await deleteUser(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function uploadUserPhoto(req, res, next) {
  try {
    if (req.user.id !== parseInt(req.params.id,10)) return next(ApiError.forbidden());
    if (!isCloudinaryEnabled()) return next(ApiError.badRequest('Image upload not configured'));
    if (!req.file && !req.body.dataUrl) return next(ApiError.badRequest('No file or dataUrl provided'));
    let uploadResult;
    if (req.file) {
      uploadResult = await uploadBuffer(req.file.buffer, `user_${req.user.id}_${Date.now()}`);
    } else {
      uploadResult = await uploadBase64Image(req.body.dataUrl, 'users');
    }
    const updated = await updateUser(req.user.id, { photo_url: uploadResult.secure_url || uploadResult.url });
    res.json({ photoUrl: updated.photo_url });
  } catch (e) { next(e); }
}
