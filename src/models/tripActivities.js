import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

export async function assignActivity(stopId, userId, { activity_id, day_offset, start_time, cost_override, notes }) {
  const perm = await query(`SELECT t.user_id FROM trip_stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1`, [stopId]);
  if (!perm.rowCount) throw ApiError.notFound('Stop not found');
  if (perm.rows[0].user_id !== userId) throw ApiError.forbidden();
  const { rows } = await query(`INSERT INTO trip_stop_activities (trip_stop_id, activity_id, day_offset, start_time, cost_override, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [stopId, activity_id, day_offset || 0, start_time || null, cost_override || null, notes || null]);
  return rows[0];
}

export async function listStopActivities(stopId, userId) {
  const perm = await query(`SELECT t.user_id FROM trip_stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1`, [stopId]);
  if (!perm.rowCount) throw ApiError.notFound('Stop not found');
  if (perm.rows[0].user_id !== userId) throw ApiError.forbidden();
  const { rows } = await query(`SELECT tsa.*, a.title, a.category FROM trip_stop_activities tsa JOIN activities a ON tsa.activity_id=a.id WHERE tsa.trip_stop_id=$1 ORDER BY tsa.created_at`, [stopId]);
  return rows;
}

export async function removeAssignedActivity(id, userId) {
  const perm = await query(`SELECT t.user_id FROM trip_stop_activities tsa JOIN trip_stops s ON tsa.trip_stop_id=s.id JOIN trips t ON s.trip_id=t.id WHERE tsa.id=$1`, [id]);
  if (!perm.rowCount) return;
  if (perm.rows[0].user_id !== userId) throw ApiError.forbidden();
  await query(`DELETE FROM trip_stop_activities WHERE id=$1`, [id]);
}
