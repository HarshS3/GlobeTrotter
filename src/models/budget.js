import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

export async function computeTripBudget(tripId, userId) {
  const own = await query(`SELECT user_id FROM trips WHERE id=$1`, [tripId]);
  if (!own.rowCount) throw ApiError.notFound('Trip not found');
  if (own.rows[0].user_id !== userId) throw ApiError.forbidden();
  const { rows } = await query(`SELECT COALESCE(SUM(COALESCE(tsa.cost_override, a.base_cost)),0) as activities_cost FROM trip_stop_activities tsa JOIN trip_stops s ON tsa.trip_stop_id=s.id JOIN activities a ON tsa.activity_id=a.id WHERE s.trip_id=$1`, [tripId]);
  const activities_cost = parseFloat(rows[0].activities_cost);
  return { total: activities_cost, activities_cost };
}
