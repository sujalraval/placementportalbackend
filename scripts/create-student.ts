import { prisma } from '../src/lib/prisma.ts';
import { hashPassword } from '../src/modules/auth/password.ts';

async function main() {
  const email = 'patelall962@gmail.com';

  // 1. Ensure a department exists
  let dept = await prisma.department.findFirst();
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Computer Engineering',
        code: 'CE',
      }
    });
  }

  // 2. Ensure a program exists
  let prog = await prisma.program.findFirst();
  if (!prog) {
    prog = await prisma.program.create({
      data: {
        name: 'B.Tech',
        code: 'BTECH',
        degreeLevel: 'UG',
        durationYears: 4,
        totalSemesters: 8,
        departmentId: dept.id,
      }
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { status: 'ACTIVE' }
    });
    console.log('Student user already exists. Set to ACTIVE.');
    return;
  }

  const passwordHash = await hashPassword('password123');

  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'John Patel',
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          enrollmentNo: 'ENR123456',
          departmentId: dept.id,
          programId: prog.id,
          batchStartYear: 2022,
          batchEndYear: 2026,
        }
      }
    }
  });

  console.log('✅ Test Student user created successfully with ACTIVE status!');
  console.log(`Email: ${email}`);
}

main()
  .catch(e => {
    console.error('Error creating student:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
