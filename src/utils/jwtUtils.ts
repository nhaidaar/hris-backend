import { User } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1'; // 1 jam
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30'; // 30 hari

export async function generateAccessToken(user: User): Promise<String> {
    return jwt.sign(
        {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * parseInt(JWT_ACCESS_EXPIRES_IN)
        },
        JWT_ACCESS_SECRET
    );
}

export async function generateRefreshToken(user: User): Promise<String> {
    return jwt.sign(
        {
            id: user.id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * parseInt(JWT_REFRESH_EXPIRES_IN)
        },
        JWT_REFRESH_SECRET
    );
}

export async function verifyAccess(token: string): Promise<User> {
    return jwt.verify(token, JWT_ACCESS_SECRET) as User;
}

export async function verifyRefresh(token: string): Promise<User> {
    return jwt.verify(token, JWT_REFRESH_SECRET) as User;
}