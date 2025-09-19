import Joi from 'joi';
import { createTrip, listUserTrips, getTrip, updateTrip, deleteTrip, toggleTripPublic } from '../models/trips.js';
import { addStop, listStops, updateStop, removeStop } from '../models/tripStops.js';
// Legacy activities/tripActivities removed in simplified model
import { createStopActivity, listStopActivitiesSimple, deleteStopActivity } from '../models/stopActivities.js';
import { computeTripBudget } from '../models/budget.js';
import { ApiError } from '../core/apiError.js';
import { buildItinerary } from '../models/itinerary.js';

// Validation Schemas
export const tripCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow('', null),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  cover_photo_url: Joi.string().uri().optional(),
  start_location: Joi.string().min(2).required(),
  end_location: Joi.string().min(2).required(),
  image_url: Joi.string().uri().optional()
});

export const tripUpdateSchema = Joi.object({
  name: Joi.string().min(2),
  description: Joi.string().allow('', null),
  start_date: Joi.date(),
  end_date: Joi.date(),
  cover_photo_url: Joi.string().uri(),
  is_public: Joi.boolean(),
  start_location: Joi.string().min(2),
  end_location: Joi.string().min(2),
  image_url: Joi.string().uri()
});

export async function createTripHandler(req, res, next) {
  try {
    const trip = await createTrip(req.user.id, req.body);
    res.status(201).json(trip);
  } catch (e) { next(e); }
}

export async function listTripsHandler(req, res, next) {
  try { res.json(await listUserTrips(req.user.id)); } catch (e) { next(e); }
}

export async function getTripHandler(req, res, next) {
  try {
    const trip = await getTrip(req.params.tripId);
    if (!trip || trip.user_id !== req.user.id) throw ApiError.notFound();
    const stops = await listStops(trip.id);
    res.json({ ...trip, stops });
  } catch (e) { next(e); }
}

export async function updateTripHandler(req, res, next) {
  try {
    const updated = await updateTrip(req.params.tripId, req.user.id, req.body);
    if (!updated) throw ApiError.notFound();
    if (typeof req.body.is_public === 'boolean') await toggleTripPublic(updated.id, req.user.id, req.body.is_public);
    res.json(updated);
  } catch (e) { next(e); }
}

export async function deleteTripHandler(req, res, next) {
  try { await deleteTrip(req.params.tripId, req.user.id); res.json({ success: true }); } catch (e) { next(e); }
}

// Stops
export const stopCreateSchema = Joi.object({ position: Joi.number().integer().required(), city: Joi.string().required(), country: Joi.string().allow(null,''), start_date: Joi.date().required(), end_date: Joi.date().required() });
export async function addStopHandler(req, res, next) {
  try { const stop = await addStop(req.params.tripId, req.user.id, req.body); res.status(201).json(stop); } catch (e) { next(e); }
}
export async function updateStopHandler(req, res, next) {
  try { const s = await updateStop(req.params.stopId, req.user.id, req.body); res.json(s); } catch (e) { next(e); }
}
export async function removeStopHandler(req, res, next) {
  try { await removeStop(req.params.stopId, req.user.id); res.json({ success: true }); } catch (e) { next(e); }
}

// Stop activities (simplified per-stop direct model)
export const stopActivityCreateSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().allow(null,'').optional(),
  cost: Joi.number().min(0).required(),
  duration_minutes: Joi.number().integer().min(0).optional(),
  day_offset: Joi.number().integer().min(0).optional(),
  start_time: Joi.string().pattern(/^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/).optional(),
  notes: Joi.string().allow('', null),
  metadata: Joi.object().optional()
});
export async function createStopActivityHandler(req, res, next) {
  try {
    const created = await createStopActivity(req.params.stopId, req.user.id, req.body);
    res.status(201).json(created);
  } catch (e) { next(e); }
}
export async function listStopActivitiesHandler(req, res, next) {
  try { res.json(await listStopActivitiesSimple(req.params.stopId, req.user.id)); } catch (e) { next(e); }
}
export async function deleteStopActivityHandler(req, res, next) {
  try { await deleteStopActivity(req.params.activityId, req.user.id); res.json({ success: true }); } catch (e) { next(e); }
}

// Budget
export async function tripBudgetHandler(req, res, next) { try { res.json(await computeTripBudget(req.params.tripId, req.user.id)); } catch (e) { next(e); } }

// Itinerary (aggregated trip overview)
export async function tripItineraryHandler(req, res, next) {
  try {
    const data = await buildItinerary(req.params.tripId, req.user.id);
    res.json(data);
  } catch (e) { next(e); }
}
