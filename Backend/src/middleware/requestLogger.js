import { withRequest, logger } from '../core/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const log = withRequest(logger, req.id);
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info('request', { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: duration, userId: req.user?.id });
  });
  next();
}
