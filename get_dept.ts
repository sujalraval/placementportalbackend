import { prisma } from './src/lib/prisma.ts';

async function main() {
  const dept = await prisma.department.findFirst();
  if (dept) {
    console.log('Department ID:', dept.id);
  } else {
    console.log('No departments found.');
    // Let's create one
    const newDept = await prisma.department.create({
      data: {
        name: 'Computer Science',
        slug: 'cse-dept-' + Date.now(),
        type: 'ACADEMIC',
      }
    });
    console.log('Created Department ID:', newDept.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
