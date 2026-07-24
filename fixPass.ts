import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('defaultPass123', 12);
  await prisma.user.updateMany({
    where: { email: 'test@coordinator.com' },
    data: { passwordHash: hash }
  });
  console.log('Password fixed for test@coordinator.com!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
