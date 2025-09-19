import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'changeme-in-env',
  accessTokenTtlMin: parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '15', 10),
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),
  databaseUrl: process.env.DATABASE_URL,
  pg: {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'globetrotter',
    port: parseInt(process.env.PGPORT || '5432', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  cacheNamespace: process.env.CACHE_NAMESPACE || 'gt',
  rateLimitLogin: parseInt(process.env.RATE_LIMIT_LOGIN || '5', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10),
  cookieDomain: process.env.COOKIE_DOMAIN,
};

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.env === 'production',
  path: '/',
};
