import express from 'express';
import multer from 'multer';
import { authenticate, requireMfaVerified } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  tripCreateSchema, createTripHandler, listTripsHandler, getTripHandler, updateTripHandler, deleteTripHandler,
  stopCreateSchema, addStopHandler, updateStopHandler, removeStopHandler,
  stopActivityCreateSchema, createStopActivityHandler, listStopActivitiesHandler, deleteStopActivityHandler,
  tripBudgetHandler, tripItineraryHandler
} from '../controllers/tripController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();
router.use(authenticate());
router.use(requireMfaVerified());

// Trips
router.post('/', validate({ body: tripCreateSchema }), createTripHandler);
router.get('/', listTripsHandler);
router.get('/:tripId', getTripHandler);
router.put('/:tripId', validate({ body: tripCreateSchema.fork(['name','description','start_date','end_date','cover_photo_url'], schema=>schema.optional()) }), updateTripHandler);
router.delete('/:tripId', deleteTripHandler);
router.get('/:tripId/budget', tripBudgetHandler);
router.get('/:tripId/itinerary', tripItineraryHandler);
// Trip cover upload (expects field 'file')
router.post('/:tripId/cover', upload.single('file'), async (req, res, next) => {
  try {
    const { uploadBuffer, isCloudinaryEnabled } = await import('../config/cloudinary.js');
    if (!isCloudinaryEnabled()) return res.status(400).json({ error: 'Image upload not configured' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Basic ownership: fetch trip and ensure user owns
    const { getTrip, updateTrip } = await import('../models/trips.js');
    const trip = await getTrip(req.params.tripId);
    if (!trip || trip.user_id !== req.user.id) return res.status(404).json({ error: 'Trip not found' });
    const result = await uploadBuffer(req.file.buffer, `trip_${trip.id}_${Date.now()}`, 'trips');
    const updated = await updateTrip(trip.id, req.user.id, { cover_photo_url: result.secure_url || result.url });
    res.json({ cover_photo_url: updated.cover_photo_url });
  } catch (e) { next(e); }
});
// Stops
router.post('/:tripId/stops', validate({ body: stopCreateSchema }), addStopHandler);
router.put('/stops/:stopId', validate({ body: stopCreateSchema.fork(['position','city','country','start_date','end_date'], s=>s.optional()) }), updateStopHandler);
router.delete('/stops/:stopId', removeStopHandler);

// Stop activities (simplified)
router.post('/stops/:stopId/activities', validate({ body: stopActivityCreateSchema }), createStopActivityHandler);
router.get('/stops/:stopId/activities', listStopActivitiesHandler);
router.delete('/stops/:stopId/activities/:activityId', deleteStopActivityHandler);

export default router;
