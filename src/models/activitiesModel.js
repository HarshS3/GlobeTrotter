import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

export async function createActivity(userId, { title, category, base_cost, duration_minutes, metadata }) {
  const { rows } = await query(`INSERT INTO activities (created_by,title,category,base_cost,duration_minutes,metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [userId, title, category || null, base_cost || 0, duration_minutes || null, metadata || null]);
  return rows[0];
}

export async function listActivities({ category } = {}) {
  if (category) {
    const { rows } = await query(`SELECT * FROM activities WHERE category=$1 ORDER BY created_at DESC LIMIT 200`, [category]);
    return rows;
  }
  const { rows } = await query(`SELECT * FROM activities ORDER BY created_at DESC LIMIT 200`);
  return rows;
}

export async function getActivity(id) {
  const { rows } = await query(`SELECT * FROM activities WHERE id=$1`, [id]);
  return rows[0] || null;
}

export async function removeActivity(id, userId) {
  const rec = await query(`SELECT created_by FROM activities WHERE id=$1`, [id]);
  if (!rec.rowCount) return;
  if (rec.rows[0].created_by !== userId) throw ApiError.forbidden();
  await query(`DELETE FROM activities WHERE id=$1`, [id]);
}
