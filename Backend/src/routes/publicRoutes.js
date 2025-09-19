import express from 'express';
import { query } from '../config/db.js';

// Unauthenticated public endpoints
const router = express.Router();

// List public trips (basic feed) - later: pagination
router.get('/trips', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT id, name, description, start_date, end_date, start_location, end_location, cover_photo_url, image_url, updated_at
      FROM trips WHERE is_public = true ORDER BY updated_at DESC LIMIT 100`);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;