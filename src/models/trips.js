import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

export async function createTrip(userId, { name, description, start_date, end_date, cover_photo_url, start_location, end_location }) {
  const { rows } = await query(`INSERT INTO trips (user_id,name,description,start_date,end_date,cover_photo_url,start_location,end_location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [userId, name, description || null, start_date, end_date, cover_photo_url || null, start_location || null, end_location || null]);
  return rows[0];
}

export async function listUserTrips(userId) {
  const { rows } = await query(`SELECT * FROM trips WHERE user_id=$1 ORDER BY created_at DESC`, [userId]);
  return rows;
}

export async function getTrip(id) {
  const { rows } = await query(`SELECT * FROM trips WHERE id=$1`, [id]);
  return rows[0] || null;
}

export async function updateTrip(id, userId, fields) {
  const trip = await getTrip(id);
  if (!trip) throw ApiError.notFound('Trip not found');
  if (trip.user_id !== userId) throw ApiError.forbidden();
  const keys = Object.keys(fields);
  if (!keys.length) return trip;
  const setFragments = keys.map((k,i)=> `${k}=$${i+3}`);
  const { rows } = await query(`UPDATE trips SET ${setFragments.join(', ')}, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [id, userId, ...keys.map(k=> fields[k])]);
  return rows[0];
}

export async function deleteTrip(id, userId) {
  await query(`DELETE FROM trips WHERE id=$1 AND user_id=$2`, [id, userId]);
}

export async function toggleTripPublic(id, userId, is_public) {
  const { rows } = await query(`UPDATE trips SET is_public=$3, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`, [id, userId, is_public]);
  return rows[0];
}
