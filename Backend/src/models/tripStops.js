import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

export async function addStop(tripId, userId, { position, city, country, start_date, end_date }) {
  // verify ownership
  const owner = await query(`SELECT user_id FROM trips WHERE id=$1`, [tripId]);
  if (!owner.rowCount) throw ApiError.notFound('Trip not found');
  if (owner.rows[0].user_id !== userId) throw ApiError.forbidden();
  const { rows } = await query(`INSERT INTO trip_stops (trip_id, position, city, country, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [tripId, position, city, country || null, start_date, end_date]);
  return rows[0];
}

export async function listStops(tripId) {
  const { rows } = await query(`SELECT * FROM trip_stops WHERE trip_id=$1 ORDER BY position ASC`, [tripId]);
  return rows;
}

export async function updateStop(id, userId, fields) {
  const stop = await query(`SELECT s.*, t.user_id FROM trip_stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1`, [id]);
  if (!stop.rowCount) throw ApiError.notFound('Stop');
  if (stop.rows[0].user_id !== userId) throw ApiError.forbidden();
  const keys = Object.keys(fields);
  if (!keys.length) return stop.rows[0];
  const setFragments = keys.map((k,i)=> `${k}=$${i+2}`);
  const { rows } = await query(`UPDATE trip_stops SET ${setFragments.join(', ')}, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, ...keys.map(k=> fields[k])]);
  return rows[0];
}

export async function removeStop(id, userId) {
  const stop = await query(`SELECT s.id, t.user_id FROM trip_stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1`, [id]);
  if (!stop.rowCount) return; // idempotent
  if (stop.rows[0].user_id !== userId) throw ApiError.forbidden();
  await query(`DELETE FROM trip_stops WHERE id=$1`, [id]);
}
