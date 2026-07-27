import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import type {
  AcademicRecordInput,
  ListStudentsFilters,
  UpdateOwnProfileInput,
  UpdatePlacementStatusInput,
  UpsertPreferenceInput,
  ImportStudentsInput,
} from './student.schema.ts';

const rosterSelect = {
  id: true,
  enrollmentNo: true,
  batchStartYear: true,
  batchEndYear: true,
  cgpa: true,
  activeBacklogs: true,
  placementStatus: true,
  profileCompleteness: true,
  readinessScore: true,
  department: { select: { id: true, name: true, code: true } },
  program: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.StudentSelect;

const detailInclude = {
  department: { select: { id: true, name: true, code: true } },
  program: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
  links: { orderBy: { createdAt: 'asc' } },
  skills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
  projects: { orderBy: { createdAt: 'desc' } },
  experiences: { orderBy: { startedOn: 'desc' } },
  certifications: { orderBy: { issuedOn: 'desc' } },
  achievements: { orderBy: { achievedOn: 'desc' } },
  positions: { orderBy: { startedOn: 'desc' } },
  semesterRecords: { orderBy: { semester: 'asc' } },
  preference: true,
  documents: { orderBy: { uploadedAt: 'desc' } },
} satisfies Prisma.StudentInclude;

async function assertStaffCanSee(
  studentId: string,
  user: { role: string; departmentId: string | null },
): Promise<void> {
  if (user.role === 'ADMIN') return;
  if (user.role === 'COORDINATOR') {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { departmentId: true },
    });
    if (!student) throw ApiError.notFound('Student not found');
    if (student.departmentId !== user.departmentId) {
      throw ApiError.forbidden('This student is outside your department');
    }
    return;
  }
  // Recruiter/faculty scoped reads depend on applications/internships, which
  // don't exist yet — see the note in student.routes.ts.
  throw ApiError.forbidden();
}

export async function getStudentById(
  studentId: string,
  user: { role: string; departmentId: string | null },
) {
  await assertStaffCanSee(studentId, user);
  return findStudentById(studentId);
}

export async function listStudents(filters: ListStudentsFilters) {
  const where: Prisma.StudentWhereInput = {
    departmentId: filters.departmentId,
    programId: filters.programId,
    placementStatus: filters.placementStatus,
    batchEndYear: filters.batchEndYear,
    ...(filters.q
      ? {
          OR: [
            { enrollmentNo: { contains: filters.q, mode: 'insensitive' } },
            { user: { fullName: { contains: filters.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      select: rosterSelect,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    students,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  };
}

export async function updateOwnProfile(studentId: string, input: UpdateOwnProfileInput) {
  const { fullName, phone, ...studentInput } = input;
  const data: Prisma.StudentUpdateInput = { ...studentInput };
  if (studentInput.dateOfBirth) data.dateOfBirth = new Date(studentInput.dateOfBirth);

  if (fullName !== undefined || phone !== undefined) {
    data.user = {
      update: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    };
  }

  await prisma.student.update({ where: { id: studentId }, data });
  await recomputeProfileCompleteness(studentId);
  return findStudentById(studentId);
}

export async function updatePlacementStatus(
  studentId: string,
  input: UpdatePlacementStatusInput,
) {
  await prisma.student.update({
    where: { id: studentId },
    data: { placementStatus: input.status },
  });
  return findStudentById(studentId);
}

export async function updateAcademicRecord(studentId: string, input: AcademicRecordInput) {
  if (input.programId) {
    const program = await prisma.program.findUnique({
      where: { id: input.programId },
      select: { id: true },
    });
    if (!program) throw ApiError.badRequest('That program does not exist');
  }

  await prisma.student.update({ where: { id: studentId }, data: input });
  return findStudentById(studentId);
}

export async function findStudentById(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: detailInclude,
  });
  if (!student) throw ApiError.notFound('Student not found');
  return student;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function upsertPreference(studentId: string, input: UpsertPreferenceInput) {
  const preference = await prisma.studentPreference.upsert({
    where: { studentId },
    create: { studentId, ...input },
    update: input,
  });
  await recomputeProfileCompleteness(studentId);
  return preference;
}

export async function importStudents(data: ImportStudentsInput) {
  const departments = await prisma.department.findMany();
  const deptMap = new Map(departments.map((d) => [d.code.toLowerCase(), d.id]));

  const programs = await prisma.program.findMany();
  const progMap = new Map(programs.map((p) => [p.code.toLowerCase(), p.id]));

  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const row of data) {
    const deptId = deptMap.get(row.departmentCode.toLowerCase());
    if (!deptId) {
      errors.push(`Row for ${row.enrollmentNo}: Unknown department code "${row.departmentCode}"`);
      skippedCount++;
      continue;
    }

    let programId: string | undefined = undefined;
    if (row.programCode) {
      programId = progMap.get(row.programCode.toLowerCase());
      if (!programId) {
        errors.push(`Row for ${row.enrollmentNo}: Unknown program code "${row.programCode}"`);
        skippedCount++;
        continue;
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Check if user with this email or enrollmentNo already exists
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              { email: row.email },
              { student: { enrollmentNo: row.enrollmentNo } }
            ]
          },
          include: { student: true }
        });

        if (existingUser) {
          // If the student profile already exists, skip it for now.
          // In a real ERP sync, we might update fields like CGPA instead.
          if (existingUser.student) {
            skippedCount++;
            return;
          }
          // If user exists but is not a student (rare case), fail this row
          throw new Error(`User with email ${row.email} exists but is not a student.`);
        }

        // Create the user
        const user = await tx.user.create({
          data: {
            email: row.email,
            fullName: row.fullName,
            phone: row.phone || null,
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });

        // Create the student profile
        await tx.student.create({
          data: {
            userId: user.id,
            enrollmentNo: row.enrollmentNo,
            departmentId: deptId,
            programId: programId,
            batchStartYear: row.batchStartYear,
            batchEndYear: row.batchEndYear,
            cgpa: row.cgpa,
            activeBacklogs: row.activeBacklogs,
            gender: row.gender || null,
            category: row.category || null,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            placementStatus: 'UNPLACED',
          },
        });

        importedCount++;
      });
    } catch (err: any) {
      errors.push(`Failed to import ${row.enrollmentNo}: ${err.message}`);
      skippedCount++;
    }
  }

  return { importedCount, skippedCount, errors };
}

// ---------------------------------------------------------------------------
// Profile completeness
// ---------------------------------------------------------------------------

/// Maps to the 7 tabs on "My profile" in the doc: Overview, Personal,
/// Academics, Experience, Skills, Projects, Documents. Each tab counts as
/// complete once it has *something* in it — this is a coverage score, not a
/// quality score (that's cv_score, computed separately by CV Studio and out
/// of scope here). Recomputed after any write that touches one of these
/// areas rather than kept as a stored formula, so it can never drift.
export async function recomputeProfileCompleteness(studentId: string): Promise<number> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      headline: true,
      bio: true,
      _count: {
        select: {
          skills: true,
          projects: true,
          experiences: true,
          positions: true,
          documents: true,
          semesterRecords: true,
        },
      },
      preference: { select: { studentId: true } },
    },
  });
  if (!student) return 0;

  const checks = [
    Boolean(student.headline || student.bio), // Overview
    Boolean(student.preference), // Personal (preferences double as "tell us about yourself")
    student._count.semesterRecords > 0, // Academics
    student._count.experiences > 0 || student._count.positions > 0, // Experience
    student._count.skills > 0, // Skills
    student._count.projects > 0, // Projects
    student._count.documents > 0, // Documents
  ];

  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  await prisma.student.update({
    where: { id: studentId },
    data: { profileCompleteness: score },
  });

  return score;
}
