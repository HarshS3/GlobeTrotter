import { createClient } from 'redis';
import { config } from '../core/config.js';
import { logger } from '../core/logger.js';

let client;
let healthy = false;

export function getRedisClient() {
  if (client) return client;
  client = createClient({
    socket: { host: config.redis.host, port: config.redis.port },
    password: config.redis.password || undefined,
  });
  client.on('error', (err) => { healthy = false; logger.error('Redis error', { error: err.message }); });
  client.on('connect', () => logger.info('Redis connecting'));
  client.on('ready', () => { healthy = true; logger.info('Redis ready'); });
  client.connect().catch(e => logger.error('Redis connect failure', { error: e.message }));
  return client;
}

export function isRedisHealthy() { return healthy; }

export async function closeRedis() {
  if (client) {
    try { await client.quit(); } catch(e) { logger.error('Redis quit error', { error: e.message }); }
    client = null;
    healthy = false;
  }
}
