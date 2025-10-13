import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Generates a JWT token for a user
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
};

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decodes a JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded payload (unverified)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

