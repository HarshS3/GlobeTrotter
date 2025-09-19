import { getRedisClient, isRedisHealthy } from '../config/redis.js';
import { config } from '../core/config.js';

const ns = config.cacheNamespace;

function buildKey(key) { return `${ns}:${key}`; }

export async function set(key, value, ttlSec) {
  if (!isRedisHealthy()) return;
  const client = getRedisClient();
  const data = JSON.stringify(value);
  if (ttlSec) await client.set(buildKey(key), data, { EX: ttlSec }); else await client.set(buildKey(key), data);
}

export async function get(key) {
  if (!isRedisHealthy()) return null;
  const client = getRedisClient();
  const val = await client.get(buildKey(key));
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

export async function del(key) {
  if (!isRedisHealthy()) return;
  const client = getRedisClient();
  await client.del(buildKey(key));
}

export async function wrap(key, ttlSec, loader) {
  const existing = await get(key);
  if (existing !== null) return existing;
  const value = await loader();
  await set(key, value, ttlSec);
  return value;
}
