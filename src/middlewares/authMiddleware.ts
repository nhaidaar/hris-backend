import { User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import { ResponseUtil } from '../utils/responseUtils';
import { redis } from '../configs/redis';
import { verifyAccess } from '../utils/jwtUtils';

declare global {
  namespace Express {
    interface Request {
      user: User,
      token: string
    }
  }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  (async () => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.status(401).json(ResponseUtil.error('Unauthorized'));
        return;
      }

      // Check blacklist
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted === 1) {
        res.status(403).json(ResponseUtil.error('Token has been invalidated'));
        return;
      }

      // Verify token
      const jwtPayload = await verifyAccess(token);
      const userRedis = await redis.get(`user:${jwtPayload.id}`);

      let user;
      if (userRedis) {
        user = JSON.parse(userRedis);
      } else {
        user = jwtPayload;
        await redis.set(`user:${user.id}`, JSON.stringify(user), { EX: 3 * 60 * 60 });
      }
      
      if (!user) {
        res.status(404).json(ResponseUtil.error('User not found'));
        return;
      }

      // Attach user data to request
      req.user = user;
      req.token = token;

      next();
    } catch (error) {
      res.status(403).json(ResponseUtil.error('Invalid or expired token!'));
      return;
    }
  })();
};

