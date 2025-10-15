/* Seed script for initial data: company + users */
import { PrismaClient, UserStatus, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(email, data) {
  return prisma.user.upsert({
    where: { email },
    update: data,
    create: Object.assign({ email }, data),
  });
}

async function main() {
  // Customize these defaults as you wish
  const company = {
    username: 'cmlabs',
    name: 'CMLABS',
    email: 'contact@cmlabs.co',
    domain: 'cmlabs.co',
  };

  // 1) Super Admin
  const superAdminEmail = `superadmin@${company.domain}`;
  const superAdminPassword = await hash('Default@123', 10);
  const superAdmin = await upsertUser(superAdminEmail, {
    password: superAdminPassword,
    firstName: 'Super',
    lastName: 'Admin',
    status: UserStatus.ACTIVE,
    role: UserRole.SUPER_ADMIN,
  });

  // 2) Company (requires superAdminId)
  const seededCompany = await prisma.company.upsert({
    where: { username: company.username },
    update: {
      name: company.name,
      email: company.email,
      domain: company.domain,
      superAdminId: superAdmin.id,
    },
    create: {
      username: company.username,
      name: company.name,
      email: company.email,
      domain: company.domain,
      superAdminId: superAdmin.id,
    },
  });

  // Link super admin to the company
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: { companyId: seededCompany.id },
  });

  // 3) Admin
  const adminEmail = `admin@${company.domain}`;
  const adminPassword = await hash('Default@123', 10);
  await upsertUser(adminEmail, {
    password: adminPassword,
    firstName: 'Company',
    lastName: 'Admin',
    status: UserStatus.ACTIVE,
    role: UserRole.ADMIN,
    companyId: seededCompany.id,
  });

  // 4) Employee
  const employeeEmail = `employee@${company.domain}`;
  const employeePassword = await hash('Default@123', 10);
  await upsertUser(employeeEmail, {
    password: employeePassword,
    firstName: 'First',
    lastName: 'Employee',
    status: UserStatus.ACTIVE,
    role: UserRole.EMPLOYEE,
    companyId: seededCompany.id,
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


