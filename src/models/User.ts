import prisma from '../prisma/client';
import { User, UserStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  companyId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: UserStatus;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  companyId?: string | null;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  status: user.status,
  role: user.role as any,
  companyId: user.companyId ?? null as any,
});

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(input: CreateUserInput): Promise<User> {
    const hashed = await bcrypt.hash(input.password, 10);
    return prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        firstName: input.firstName,
        lastName: input.lastName,
        role: (input.role ?? 'EMPLOYEE') as any,
        companyId: input.companyId,
        status: 'ACTIVE',
      } as Prisma.UserCreateInput,
    });
  },

  async listByCompany(companyId: string): Promise<User[]> {
    return prisma.user.findMany({ where: { companyId } });
  },

  async setStatus(userId: string, status: UserStatus): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { status } });
  },
};
