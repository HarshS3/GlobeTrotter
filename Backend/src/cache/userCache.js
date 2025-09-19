import { wrap, del, set, get } from './index.js';
import { findUserById } from '../models/users.js';

export function userProfileKey(id) { return `user:${id}:profile`; }
export function mfaTempKey(id) { return `user:${id}:mfatemp`; }

export async function getOrLoadUserProfile(id) {
  return wrap(userProfileKey(id), 300, async () => {
    const user = await findUserById(id);
    if (!user) return null;
    return { id: user.id, email: user.email, is_mfa_active: user.is_mfa_active };
  });
}

export async function invalidateUserProfile(id) { await del(userProfileKey(id)); }

export async function storeMfaTempSecret(userId, secret) { await set(mfaTempKey(userId), { secret }, 300); }
export async function consumeMfaTempSecret(userId) {
  const data = await get(mfaTempKey(userId));
  if (data) await del(mfaTempKey(userId));
  return data?.secret || null;
}
export async function peekMfaTempSecret(userId) {
  const data = await get(mfaTempKey(userId));
  return data?.secret || null;
}
