import express from 'express';
import { authenticate, requireMfaVerified } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  tripCreateSchema, createTripHandler, listTripsHandler, getTripHandler, updateTripHandler, deleteTripHandler,
  stopCreateSchema, addStopHandler, updateStopHandler, removeStopHandler,
  stopActivityCreateSchema, createStopActivityHandler, listStopActivitiesHandler, deleteStopActivityHandler,
  tripBudgetHandler, tripItineraryHandler
} from '../controllers/tripController.js';

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
// Stops
router.post('/:tripId/stops', validate({ body: stopCreateSchema }), addStopHandler);
router.put('/stops/:stopId', validate({ body: stopCreateSchema.fork(['position','city','country','start_date','end_date'], s=>s.optional()) }), updateStopHandler);
router.delete('/stops/:stopId', removeStopHandler);

// Stop activities (simplified)
router.post('/stops/:stopId/activities', validate({ body: stopActivityCreateSchema }), createStopActivityHandler);
router.get('/stops/:stopId/activities', listStopActivitiesHandler);
router.delete('/stops/:stopId/activities/:activityId', deleteStopActivityHandler);

export default router;
