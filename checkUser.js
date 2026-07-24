import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'test@coordinator.com' } });
  console.log('USER:', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
