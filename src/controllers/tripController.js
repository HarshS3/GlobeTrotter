import Joi from 'joi';
import { createTrip, listUserTrips, getTrip, updateTrip, deleteTrip, toggleTripPublic } from '../models/trips.js';
import { addStop, listStops, updateStop, removeStop } from '../models/tripStops.js';
import { assignActivity, listStopActivities, removeAssignedActivity } from '../models/tripActivities.js';
import { createActivity, listActivities } from '../models/activitiesModel.js';
import { computeTripBudget } from '../models/budget.js';
import { ApiError } from '../core/apiError.js';

// Validation Schemas
export const tripCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow('', null),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  cover_photo_url: Joi.string().uri().optional(),
  start_location: Joi.string().min(2).required(),
  end_location: Joi.string().min(2).required()
});

export const tripUpdateSchema = Joi.object({
  name: Joi.string().min(2),
  description: Joi.string().allow('', null),
  start_date: Joi.date(),
  end_date: Joi.date(),
  cover_photo_url: Joi.string().uri(),
  is_public: Joi.boolean(),
  start_location: Joi.string().min(2),
  end_location: Joi.string().min(2)
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

// Activities (catalog)
export const activityCreateSchema = Joi.object({ title: Joi.string().required(), category: Joi.string().optional(), base_cost: Joi.number().min(0).optional(), duration_minutes: Joi.number().integer().min(0).optional(), metadata: Joi.object().optional() });
export async function createActivityHandler(req, res, next) { try { res.status(201).json(await createActivity(req.user.id, req.body)); } catch (e) { next(e); } }
export async function listActivitiesHandler(req, res, next) { try { res.json(await listActivities({ category: req.query.category })); } catch (e) { next(e); } }

// Assign activities to stop
export const assignActivitySchema = Joi.object({ activity_id: Joi.string().uuid().required(), day_offset: Joi.number().integer().min(0).optional(), start_time: Joi.string().pattern(/^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$/).optional(), cost_override: Joi.number().min(0).optional(), notes: Joi.string().allow('', null) });
export async function assignActivityHandler(req, res, next) { try { res.status(201).json(await assignActivity(req.params.stopId, req.user.id, req.body)); } catch (e) { next(e); } }
export async function listStopActivitiesHandler(req, res, next) { try { res.json(await listStopActivities(req.params.stopId, req.user.id)); } catch (e) { next(e); } }
export async function removeAssignedActivityHandler(req, res, next) { try { await removeAssignedActivity(req.params.assignmentId, req.user.id); res.json({ success: true }); } catch (e) { next(e); } }

// Budget
export async function tripBudgetHandler(req, res, next) { try { res.json(await computeTripBudget(req.params.tripId, req.user.id)); } catch (e) { next(e); } }
