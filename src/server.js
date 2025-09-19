import app from './app.js';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { getPool, closePool } from './config/db.js';
import { getRedisClient, closeRedis } from './config/redis.js';

const server = app.listen(config.port, () => {
  logger.info(`Server listening on http://localhost:${config.port}`);
  getPool();
  getRedisClient();
});

async function shutdown() {
  logger.info('Shutdown initiated');
  server.close(async () => {
    await closePool();
    await closeRedis();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  setTimeout(()=>{ logger.error('Force exit'); process.exit(1); }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
