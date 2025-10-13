import { Request, Response, NextFunction } from 'express';
import { UserStatus, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { isValidCompanyEmail } from '../utils/emailValidator';
import { ResponseUtil } from '../utils/responseUtils';
import { UserModel, toPublicUser } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefresh } from '../utils/jwtUtils';
import { redis } from '../redis/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Verify Email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json(ResponseUtil.error('Invalid email address.'));
    }

    // Verify Account Status
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json(ResponseUtil.error('Your account is inactive. Please contact administrator!'));
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(ResponseUtil.error('Invalid password.'));
    }

    // Generate JWT token
    const [ accessToken, refreshToken ] = await Promise.all([
      generateAccessToken(user),
      generateRefreshToken(user)
    ]);

    // Successful login
    return res.status(200).json(ResponseUtil.success(
      {
        'accessToken': accessToken, 
        'refreshToken': refreshToken, 
        'user': toPublicUser(user)
      }, 
      'Login successful.'
    ));

  } catch (error) {
    return res.status(500).json(ResponseUtil.error(error));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || '';
    const refreshToken = req.body.refreshToken || '';

    const jwtPayload = await verifyRefresh(refreshToken);
    if (jwtPayload.id !== req.user?.id) {
      return res.status(401).json(ResponseUtil.error('Unauthorized'));
    }

    await redis.set(`blacklist:${token}`, 'true');
    await redis.set(`blacklist:${refreshToken}`, 'true');
    await redis.del(`user:${req.user?.id}`);

    return res.status(200).json(ResponseUtil.success(null, 'Logout successful.'));
  } catch (error) {
    return res.status(500).json(ResponseUtil.error(error));
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { email, password, firstName, lastName, role } = req.body;

    // Check if requester is company super admin
    const company = await prisma.company.findUnique({ where: { id: req.user?.companyId ?? '' } });
    if (!company || company.superAdminId !== userId) {
      return res.status(403).json(ResponseUtil.error('Only company super admin can add users.'));
    }

    // Check if email is valid
    if (!isValidCompanyEmail(email, company.domain)) {
      return res.status(400).json(ResponseUtil.error('Email address must be a valid company email.'));
    }

    // Check if email is already in use
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json(ResponseUtil.error('Email already exists.'));
    }

    const newUser = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'EMPLOYEE',
      companyId: company.id,
    });

    return res.status(201).json(ResponseUtil.success(toPublicUser(newUser), 'User created.'));
  } catch (error) {
    return res.status(500).json(ResponseUtil.error(error));
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body.refreshToken || '';

    const isBlacklisted = await redis.exists(`blacklist:${refreshToken}`);
    if (isBlacklisted === 1) {
      return res.status(401).json(ResponseUtil.error('Token has been invalidated.'));
    }

    const jwtPayload = await verifyRefresh(refreshToken);
    const user = await UserModel.findById(jwtPayload.id);
    if (user?.id !== jwtPayload.id) {
      return res.status(401).json(ResponseUtil.error('Unauthorized.'));
    }

    // Generate JWT token
    const [ access, refresh ] = await Promise.all([
      generateAccessToken(user),
      generateRefreshToken(user)
    ]);

    // Successful login
    return res.status(200).json(ResponseUtil.success(
      {
        'accessToken': access, 
        'refreshToken': refresh, 
        'user': toPublicUser(user)
      }, 
      'Login successful.'
    ));
    
  } catch (error) {
    return res.status(500).json(ResponseUtil.error(error));
  }
};