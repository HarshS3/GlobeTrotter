import { mapError } from '../core/apiError.js';
import { logger } from '../core/logger.js';

export function notFound(_req, _res, next) { next(mapError({})); }

export function errorHandler(err, req, res, _next) {
  const apiErr = mapError(err);
  if (apiErr.status === 500) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack, requestId: req.id });
  }
  res.status(apiErr.status).json({
    status: apiErr.status,
    error: { code: apiErr.code, message: apiErr.message, details: apiErr.details, requestId: req.id }
  });
}
