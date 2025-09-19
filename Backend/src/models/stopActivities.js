import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

// Collaborative rules:
// - Any authenticated user may list or create activities for an existing stop.
// - created_by stored for attribution.
// - Deletion allowed for creator OR trip owner.
// - Trip owner defined via trip_stops -> trips.user_id.

async function resolveStop(stopId) {
  const perm = await query(`SELECT s.id, t.user_id AS owner_id FROM trip_stops s JOIN trips t ON s.trip_id=t.id WHERE s.id=$1`, [stopId]);
  if (!perm.rowCount) throw ApiError.notFound('Stop not found');
  return perm.rows[0];
}

export async function createStopActivity(stopId, userId, { title, category, cost, duration_minutes, day_offset, start_time, notes, metadata }) {
  await resolveStop(stopId); // ensure stop exists (any user can contribute)
  const { rows } = await query(`INSERT INTO stop_activities (trip_stop_id,title,category,cost,duration_minutes,day_offset,start_time,notes,metadata,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [stopId, title, category || null, cost, duration_minutes || null, day_offset || 0, start_time || null, notes || null, metadata || null, userId]);
  return rows[0];
}

export async function listStopActivitiesSimple(stopId, userId) { // userId kept for possible future differential views
  await resolveStop(stopId);
  const { rows } = await query(`SELECT sa.*, u.email AS creator_email FROM stop_activities sa LEFT JOIN users u ON sa.created_by=u.id WHERE trip_stop_id=$1 ORDER BY created_at`, [stopId]);
  return rows;
}

export async function deleteStopActivity(id, userId) {
  const perm = await query(`SELECT sa.created_by, t.user_id AS owner_id FROM stop_activities sa JOIN trip_stops s ON sa.trip_stop_id=s.id JOIN trips t ON s.trip_id=t.id WHERE sa.id=$1`, [id]);
  if (!perm.rowCount) return; // idempotent
  const row = perm.rows[0];
  if (row.created_by !== userId && row.owner_id !== userId) throw ApiError.forbidden();
  await query(`DELETE FROM stop_activities WHERE id=$1`, [id]);
}
