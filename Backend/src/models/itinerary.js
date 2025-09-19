import { query } from '../config/db.js';
import { ApiError } from '../core/apiError.js';

/* buildItinerary contract:
Input: tripId, userId
Output JSON shape:
{
  trip: { id, name, start_date, end_date, start_location, end_location, total_cost, stops_count, activities_count },
  stops: [
    {
      id, position, city, country, start_date, end_date,
      activities_count, activities_cost,
      activities: [ { id, title, category, cost, day_offset, start_time, duration_minutes, notes, created_by, creator_email } ]
    }
  ]
}
*/

export async function buildItinerary(tripId, userId) {
  // Ensure trip exists & ownership (only owner can request itinerary; adjust if collaborative later)
  const tRes = await query(`SELECT * FROM trips WHERE id=$1`, [tripId]);
  if (!tRes.rowCount) throw ApiError.notFound('Trip not found');
  const trip = tRes.rows[0];
  if (trip.user_id !== userId) throw ApiError.forbidden();

  const stopsRes = await query(`SELECT * FROM trip_stops WHERE trip_id=$1 ORDER BY position`, [tripId]);
  const stopIds = stopsRes.rows.map(r => r.id);
  let activitiesByStop = {};
  let totalActivities = 0;
  let grandCost = 0;
  if (stopIds.length) {
    const actsRes = await query(`SELECT sa.*, u.email as creator_email FROM stop_activities sa LEFT JOIN users u ON sa.created_by=u.id WHERE sa.trip_stop_id = ANY($1::int[]) ORDER BY sa.day_offset, sa.start_time NULLS LAST, sa.created_at`, [stopIds]);
    for (const a of actsRes.rows) {
      if (!activitiesByStop[a.trip_stop_id]) activitiesByStop[a.trip_stop_id] = [];
      activitiesByStop[a.trip_stop_id].push(a);
      totalActivities++;
      grandCost += parseFloat(a.cost);
    }
  }

  const stops = stopsRes.rows.map(s => {
    const acts = activitiesByStop[s.id] || [];
    const activities_cost = acts.reduce((acc, a) => acc + parseFloat(a.cost), 0);
    return {
      id: s.id,
      position: s.position,
      city: s.city,
      country: s.country,
      start_date: s.start_date,
      end_date: s.end_date,
      activities_count: acts.length,
      activities_cost,
      activities: acts.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        cost: parseFloat(a.cost),
        day_offset: a.day_offset,
        start_time: a.start_time,
        duration_minutes: a.duration_minutes,
        notes: a.notes,
        created_by: a.created_by,
        creator_email: a.creator_email
      }))
    };
  });

  return {
    trip: {
      id: trip.id,
      name: trip.name,
      start_date: trip.start_date,
      end_date: trip.end_date,
      start_location: trip.start_location,
      end_location: trip.end_location,
      total_cost: grandCost,
      stops_count: stops.length,
      activities_count: totalActivities
    },
    stops
  };
}
