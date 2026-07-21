import { prisma } from '../src/lib/prisma.ts';

async function main() {
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { status: 'ACTIVE' }
  });
  console.log('Admin user updated to ACTIVE');
}

main().finally(() => prisma.$disconnect());
