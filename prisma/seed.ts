import { prisma } from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Create Sectors
  const itSector = await prisma.sector.upsert({
    where: { name: 'Information Technology' },
    update: {},
    create: { name: 'Information Technology', code: 'IT' },
  });
  
  const financeSector = await prisma.sector.upsert({
    where: { name: 'Finance' },
    update: {},
    create: { name: 'Finance', code: 'FIN' },
  });

  // 2. Create Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@placement.edu' },
    update: {},
    create: {
      email: 'admin@placement.edu',
      passwordHash: adminPasswordHash,
      fullName: 'University Placement Cell',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 3. Create Departments and Coordinators
  const coordPasswordHash = await bcrypt.hash('coord123', 10);
  
  // Computer Science Dept
  let csDept = await prisma.department.findUnique({ where: { code: 'CS' } });
  if (!csDept) {
    csDept = await prisma.department.create({
      data: {
        name: 'Computer Science & Applications',
        code: 'CS',
        about: 'Dept of Computer Science',
      }
    });
  }

  // Coordinator for CS
  const csCoord = await prisma.user.upsert({
    where: { email: 'cs.coord@placement.edu' },
    update: {},
    create: {
      email: 'cs.coord@placement.edu',
      passwordHash: coordPasswordHash,
      fullName: 'Dr. R. Mehta',
      role: 'COORDINATOR',
      status: 'ACTIVE',
      departmentId: csDept.id
    },
  });

  // Update Dept with Coordinator
  await prisma.department.update({
    where: { id: csDept.id },
    data: { coordinatorUserId: csCoord.id }
  });

  // 4. Create Programs
  await prisma.program.upsert({
    where: { departmentId_code: { departmentId: csDept.id, code: 'BCA' } },
    update: {},
    create: {
      departmentId: csDept.id,
      name: 'Bachelor of Computer Applications',
      code: 'BCA',
      degreeLevel: 'UG',
      durationYears: 3,
      totalSemesters: 6,
    }
  });

  await prisma.program.upsert({
    where: { departmentId_code: { departmentId: csDept.id, code: 'MCA' } },
    update: {},
    create: {
      departmentId: csDept.id,
      name: 'Master of Computer Applications',
      code: 'MCA',
      degreeLevel: 'PG',
      durationYears: 2,
      totalSemesters: 4,
    }
  });

  console.log('Seeding completed successfully!');
  console.log('--- Test Accounts ---');
  console.log('Admin: admin@placement.edu / admin123');
  console.log('Coordinator: cs.coord@placement.edu / coord123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
