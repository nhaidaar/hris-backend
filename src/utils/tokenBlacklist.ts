import { redisClient } from '../redis/client';
import jwt from 'jsonwebtoken';

const blacklistKey = (token: string): string => `bl:jwt:${token}`;

const getTokenTTLSeconds = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      const nowSec = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - nowSec;
      return ttl > 0 ? ttl : 0;
    }
    return 24 * 60 * 60; // fallback 24h
  } catch {
    return 24 * 60 * 60;
  }
};

export const blacklistToken = async (token: string): Promise<void> => {
  const ttl = getTokenTTLSeconds(token);
  if (ttl <= 0) return;
  await redisClient.set(blacklistKey(token), '1', { EX: ttl });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const exists = await redisClient.exists(blacklistKey(token));
  return exists === 1;
};


