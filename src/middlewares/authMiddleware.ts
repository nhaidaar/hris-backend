import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
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
        res.status(401).json({ message: 'Access token required!' });
        return;
      }

      // Check blacklist
      const revoked = await isTokenBlacklisted(token);
      if (revoked) {
        res.status(403).json({ message: 'Token was expired!' });
        return;
      }

      // Verify token
      const decoded = verifyToken(token);
      
      // Attach user data to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      res.status(403).json({ message: 'Invalid or expired token!' });
      return;
    }
  })();
};

