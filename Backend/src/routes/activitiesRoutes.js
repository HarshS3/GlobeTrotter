import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/db.js';

// Returns all activities across all trip stops (for any user's trips)
// Includes trip & stop context plus creator email. Limited fields for now.
// Future: pagination & filters (by trip, date range, city, creator)

const router = express.Router();
router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT sa.id,
             sa.title,
             sa.category,
             sa.cost,
             sa.duration_minutes,
             sa.day_offset,
             sa.start_time,
             sa.notes,
             sa.created_at,
             u.email AS creator_email,
             s.id AS stop_id,
             s.position AS stop_position,
             s.city AS stop_city,
             s.country AS stop_country,
             s.start_date AS stop_start_date,
             s.end_date AS stop_end_date,
             t.id AS trip_id,
             t.name AS trip_name,
             t.start_location AS trip_start_location,
             t.end_location AS trip_end_location,
             t.start_date AS trip_start_date,
             t.end_date AS trip_end_date,
             t.cover_photo_url,
             t.image_url
      FROM stop_activities sa
      JOIN trip_stops s ON sa.trip_stop_id = s.id
      JOIN trips t ON s.trip_id = t.id
      LEFT JOIN users u ON sa.created_by = u.id
      ORDER BY sa.created_at DESC
      LIMIT 500
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;