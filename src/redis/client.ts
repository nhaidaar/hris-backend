import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => {
  console.error('🚨 Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('🚀 Redis connected!');
});

export const connectRedis = async (): Promise<void> => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};


