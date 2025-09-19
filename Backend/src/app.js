import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import activitiesRoutes from './routes/activitiesRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { metricsRouter, metricsRequestMiddleware } from './core/metrics.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { config } from './core/config.js';
import { query } from './config/db.js';
import { getRedisClient, isRedisHealthy } from './config/redis.js';

const app = express();
app.use(requestId);
app.use(requestLogger);
// Metrics timing middleware (lightweight)
app.use(metricsRequestMiddleware);
// CORS: allow credentials & dynamic or fixed origin based on FRONTEND_ORIGIN
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors({
  origin: FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : true,
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Rate limit auth endpoints
app.use('/auth/login', rateLimiter({ keyPrefix: 'rl:login', limit: config.rateLimitLogin, windowSec: config.rateLimitWindow }));
app.use('/auth/register', rateLimiter({ keyPrefix: 'rl:register', limit: config.rateLimitLogin, windowSec: config.rateLimitWindow }));

app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    if (!isRedisHealthy()) getRedisClient(); // attempt connect
    res.json({ status: 'ok', redis: isRedisHealthy() ? 'up' : 'down' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/trips', tripRoutes);
app.use('/activities', activitiesRoutes);
app.use('/public', publicRoutes);
app.use('/metrics', metricsRouter); // Prometheus scrape endpoint

app.get('/me', authenticate(true), (req, res) => {
  if (!req.user) return res.json({ me: null });
  res.json({ me: { id: req.user.id, email: req.user.email } });
});

app.use(errorHandler);

export default app;
