import { prisma } from '../src/lib/prisma.ts';
import { hashPassword } from '../src/modules/auth/password.ts';

async function main() {
  const email = 'admin@example.com';
  const password = 'adminpassword123';
  const fullName = 'Super Admin';

  console.log(`Checking if admin user exists with email: ${email}`);
  
  let admin = await prisma.user.findUnique({
    where: { email }
  });

  if (admin) {
    console.log('Admin user already exists!');
    return;
  }

  const passwordHash = await hashPassword(password);

  admin = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      role: 'ADMIN'
    }
  });

  console.log('✅ Super Admin user created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(e => {
    console.error('Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
