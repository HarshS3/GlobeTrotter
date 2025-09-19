import express from 'express';
import client from 'prom-client';

// Register default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'gt_' });

// Custom metrics
export const httpRequestDurationMs = new client.Histogram({
  name: 'gt_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method','route','code'],
  buckets: [5,10,25,50,100,250,500,1000,2000,5000]
});
register.registerMetric(httpRequestDurationMs);

export const authFailuresCounter = new client.Counter({
  name: 'gt_auth_failures_total',
  help: 'Total authentication failures'
});
register.registerMetric(authFailuresCounter);

export function metricsRequestMiddleware(req, res, next) {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    const route = req.route?.path || req.path || 'unknown';
    httpRequestDurationMs.labels(req.method, route, res.statusCode).observe(duration);
  });
  next();
}

export const metricsRouter = express.Router();
metricsRouter.get('/', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export { register };