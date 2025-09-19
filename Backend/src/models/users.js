import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../core/apiError.js';

export async function createUser({ email, password, first_name, last_name, phone, city, country, additional_info, photo_url }) {
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await query(`
      INSERT INTO users (email, password, first_name, last_name, phone, city, country, additional_info, photo_url)
      VALUES (LOWER($1), $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [email, hash, first_name, last_name, phone, city, country, additional_info, photo_url]);
    return rows[0];
  } catch (e) {
    if (e.code === '23505') throw ApiError.conflict('Email already exists');
    throw e;
  }
}

export async function findUserByEmail(email) {
  const { rows } = await query(`SELECT * FROM users WHERE email=LOWER($1)`, [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query(`SELECT * FROM users WHERE id=$1`, [id]);
  return rows[0] || null;
}

export async function listUsers() {
  const { rows } = await query(`
    SELECT id, email, is_mfa_active, first_name, last_name, phone, city, country, additional_info, photo_url, created_at, updated_at
    FROM users
    ORDER BY id DESC`);
  return rows;
}

export async function updateUser(id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return findUserById(id);
  // Whitelist allowed columns
  const allowed = new Set(['first_name','last_name','phone','city','country','additional_info','photo_url']);
  const filtered = keys.filter(k => allowed.has(k));
  if (!filtered.length) return findUserById(id);
  const sets = filtered.map((k,i)=> `${k}=$${i+2}`);
  const values = filtered.map(k=> fields[k]);
  const { rows } = await query(`UPDATE users SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, ...values]);
  return rows[0];
}

export async function updateUserPassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  const { rows } = await query(`UPDATE users SET password=$2, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, hash]);
  return rows[0];
}

export async function deleteUser(id) {
  await query(`DELETE FROM users WHERE id=$1`, [id]);
}

export async function setMfaSecret(id, secret) {
  const { rows } = await query(`UPDATE users SET mfa_secret=$2, is_mfa_active=true, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, secret]);
  return rows[0];
}

export async function disableMfa(id) {
  const { rows } = await query(`UPDATE users SET mfa_secret=NULL, is_mfa_active=false, updated_at=NOW() WHERE id=$1 RETURNING *`, [id]);
  return rows[0];
}
