import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { isValidCompanyEmail } from '../utils/emailValidator';
import { generateToken } from '../utils/jwtHelper';
import { blacklistToken } from '../utils/tokenBlacklist';

const prisma = new PrismaClient();

// Variables
const COMPANY_DOMAIN = process.env.COMPANY_DOMAIN;
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate email
    if (!isValidCompanyEmail(email, COMPANY_DOMAIN)) {
      return res.status(400).json({ message: 'Invalid email address!' });
    }

    // Verify Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email address!' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ 
        message: 'Your account is inactive. Please contact administrator!' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password!' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Successful login
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong.', error });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || '';

    // Blacklist token with TTL derived from token exp
    await blacklistToken(token);

    return res.status(200).json({ message: 'Logout successful!' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong.', error });
  }
};