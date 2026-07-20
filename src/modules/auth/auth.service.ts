import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import { fakeVerify, hashPassword, verifyPassword } from './password.ts';
import { issueSession } from './session.service.ts';
import type { IssuedSession } from './session.service.ts';
import type {
  LoginInput,
  RegisterRecruiterInput,
  RegisterStudentInput,
} from './auth.schema.ts';
import type { User } from '../../generated/prisma/client.ts';

interface RequestContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

/// The shape every auth endpoint returns for the signed-in user. Never
/// includes passwordHash — selected explicitly rather than deleted after the
/// fact, so a future column can't leak by being added.
const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatarUrl: true,
  departmentId: true,
  companyId: true,
} as const;

export type PublicUser = Pick<User, keyof typeof publicUserSelect>;

/// A PENDING account exists but cannot act — the doc's recruiter onboarding
/// and admin account-approval both depend on that gap. SUSPENDED is an admin
/// action. Only ACTIVE gets tokens.
function assertCanSignIn(user: Pick<User, 'status'>): void {
  if (user.status === 'PENDING') {
    throw ApiError.forbidden(
      'Your account is awaiting approval. You will be notified once it is reviewed.',
    );
  }
  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('This account has been suspended. Contact the Placement Cell.');
  }
}

export async function login(
  input: LoginInput,
  ctx: RequestContext,
): Promise<{ user: PublicUser; session: IssuedSession }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  // Same error and roughly the same timing whether the account is missing or
  // the password is wrong: otherwise this endpoint tells an attacker which of
  // your students have accounts.
  if (!user?.passwordHash) {
    await fakeVerify();
    throw ApiError.unauthorized('Incorrect email or password');
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Incorrect email or password');

  assertCanSignIn(user);

  const { passwordHash: _drop, ...publicUser } = user;
  const session = await issueSession(user, ctx);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { user: publicUser, session };
}

export async function registerStudent(input: RegisterStudentInput): Promise<PublicUser> {
  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true },
  });
  if (!department) throw ApiError.badRequest('That department does not exist');

  const [emailTaken, enrollmentTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
    prisma.student.findUnique({
      where: { enrollmentNo: input.enrollmentNo },
      select: { id: true },
    }),
  ]);
  if (emailTaken) throw ApiError.conflict('An account with that email already exists');
  if (enrollmentTaken) throw ApiError.conflict('That enrolment number is already registered');

  const passwordHash = await hashPassword(input.password);

  // Student rows carry the department; the user row must not (the
  // user_role_scope_consistent CHECK enforces exactly that).
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone ?? null,
      role: 'STUDENT',
      status: 'PENDING',
      student: {
        create: {
          enrollmentNo: input.enrollmentNo,
          departmentId: input.departmentId,
          programId: input.programId ?? null,
          batchStartYear: input.batchStartYear,
          batchEndYear: input.batchEndYear,
          cgpa: input.cgpa,
        },
      },
    },
    select: publicUserSelect,
  });
}

export async function registerRecruiter(input: RegisterRecruiterInput): Promise<PublicUser> {
  const emailTaken = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (emailTaken) throw ApiError.conflict('An account with that email already exists');

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueCompanySlug(input.companyName);

  // Company and recruiter are created together or not at all — a RECRUITER
  // with a null company_id is rejected by the database, so there is no
  // half-registered state to clean up.
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone ?? null,
      designation: input.designation ?? null,
      role: 'RECRUITER',
      status: 'PENDING',
      company: {
        create: {
          name: input.companyName,
          slug,
          type: input.companyType,
          website: input.website ?? null,
          sectorId: input.sectorId ?? null,
          hqCity: input.hqCity ?? null,
          about: input.about ?? null,
          // Onboarding is a five-step checklist ending in MOU + activation;
          // registering only gets you to the first step.
          onboardingStage: 'REGISTERED',
          verificationStatus: 'PENDING',
          isActive: false,
          visibilityScope: 'UNIVERSITY_WIDE',
        },
      },
    },
    select: publicUserSelect,
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser & { studentId: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...publicUserSelect, student: { select: { id: true } } },
  });
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  const { student, ...rest } = user;
  return { ...rest, studentId: student?.id ?? null };
}

/// `company.slug` is unique. Derive from the name and suffix on collision
/// rather than letting a second "TCS" fail registration.
async function uniqueCompanySlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'company';

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.company.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}
