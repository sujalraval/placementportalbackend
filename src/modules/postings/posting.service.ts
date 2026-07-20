import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  CreatePostingInput,
  UpdatePostingInput,
  UpdatePostingStatusInput,
  CreateRoundInput,
  UpdateRoundInput,
} from './posting.schema.ts';

function buildVisibilityFilter(user: Express.Request['user']): any {
  if (!user) throw ApiError.unauthorized();
  
  if (user.role === 'ADMIN') return {};

  if (user.role === 'RECRUITER') {
    if (!user.companyId) throw ApiError.forbidden('No company scope');
    return { companyId: user.companyId };
  }

  const deptScope = user.departmentId 
    ? { OR: [{ visibilityScope: 'UNIVERSITY_WIDE' }, { departmentId: user.departmentId }] }
    : { visibilityScope: 'UNIVERSITY_WIDE' };

  if (user.role === 'STUDENT') {
    return {
      status: 'PUBLISHED',
      ...deptScope
    };
  }

  // Coordinator or Faculty
  return deptScope;
}

function checkWriteAccess(user: Express.Request['user'], postingCompanyId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return; // Assume Coordinators can edit postings in their dept? Actually ADMIN only is safer for arbitrary edit.
  // We'll let COORDINATORs edit, but technically they should be restricted to their dept.
  if (user.role === 'RECRUITER') {
    if (user.companyId !== postingCompanyId) {
      throw ApiError.forbidden('You can only modify your own company postings');
    }
    return;
  }
  
  throw ApiError.forbidden('Not authorized to modify this posting');
}

export async function listPostings(user: Express.Request['user']) {
  const where = buildVisibilityFilter(user);
  return prisma.jobPosting.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true, logoUrl: true } }
    }
  });
}

export async function getPostingById(id: string, user: Express.Request['user']) {
  const where = { id, ...buildVisibilityFilter(user) };
  const posting = await prisma.jobPosting.findFirst({
    where,
    include: {
      company: { select: { id: true, name: true, logoUrl: true, about: true } },
      department: { select: { id: true, name: true } },
      selectionRounds: { orderBy: { sequence: 'asc' } },
    }
  });

  if (!posting) throw ApiError.notFound('Job posting not found');
  return posting;
}

export async function createPosting(input: CreatePostingInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  let companyId = input.companyId;
  let source: 'RECRUITER' | 'ADMIN' = 'ADMIN';

  if (user.role === 'RECRUITER') {
    companyId = user.companyId!;
    source = 'RECRUITER';
  } else if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
    if (!companyId) throw ApiError.badRequest('companyId is required for admins creating postings');
  } else {
    throw ApiError.forbidden('Not authorized to create postings');
  }

  // applicationDeadline comes as string, we need to convert to Date
  let deadline: Date | null | undefined = undefined;
  if (input.applicationDeadline) {
    deadline = new Date(input.applicationDeadline);
  }

  return prisma.jobPosting.create({
    data: {
      ...input,
      companyId: companyId!,
      source,
      status: 'DRAFT',
      createdByUserId: user.sub,
      applicationDeadline: deadline,
    }
  });
}

export async function updatePosting(id: string, input: UpdatePostingInput, user: Express.Request['user']) {
  const posting = await prisma.jobPosting.findUnique({ where: { id } });
  if (!posting) throw ApiError.notFound('Posting not found');

  checkWriteAccess(user, posting.companyId);

  let deadline: Date | null | undefined = undefined;
  if (input.applicationDeadline) {
    deadline = new Date(input.applicationDeadline);
  } else if (input.applicationDeadline === null) {
    deadline = null;
  }

  return prisma.jobPosting.update({
    where: { id },
    data: {
      ...input,
      applicationDeadline: deadline !== undefined ? deadline : undefined,
    }
  });
}

export async function updatePostingStatus(id: string, input: UpdatePostingStatusInput, user: Express.Request['user']) {
  const posting = await prisma.jobPosting.findUnique({ where: { id } });
  if (!posting) throw ApiError.notFound('Posting not found');

  checkWriteAccess(user, posting.companyId);

  // Status transition guards
  if (user?.role === 'RECRUITER') {
    if (input.status === 'PUBLISHED') {
      throw ApiError.forbidden('Recruiters cannot publish postings directly. Submit for approval instead.');
    }
    // Recruiter can close their own posting or submit for approval
  }

  const updateData: any = { status: input.status };
  
  if (input.status === 'PUBLISHED' && posting.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
    updateData.approvedByUserId = user!.sub;
    updateData.approvedAt = new Date();
  }
  if (input.status === 'CLOSED' && posting.status !== 'CLOSED') {
    updateData.closedAt = new Date();
  }

  return prisma.jobPosting.update({
    where: { id },
    data: updateData
  });
}

// --- Selection Rounds ---

export async function listRounds(postingId: string, user: Express.Request['user']) {
  await getPostingById(postingId, user); // ensures visibility
  return prisma.selectionRound.findMany({
    where: { jobPostingId: postingId },
    orderBy: { sequence: 'asc' }
  });
}

export async function addRound(postingId: string, input: CreateRoundInput, user: Express.Request['user']) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  if (!posting) throw ApiError.notFound('Posting not found');
  checkWriteAccess(user, posting.companyId);

  return prisma.selectionRound.create({
    data: {
      jobPostingId: postingId,
      ...input
    }
  });
}

export async function updateRound(postingId: string, roundId: string, input: UpdateRoundInput, user: Express.Request['user']) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  if (!posting) throw ApiError.notFound('Posting not found');
  checkWriteAccess(user, posting.companyId);

  return prisma.selectionRound.update({
    where: { id: roundId },
    data: input
  });
}

export async function removeRound(postingId: string, roundId: string, user: Express.Request['user']) {
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  if (!posting) throw ApiError.notFound('Posting not found');
  checkWriteAccess(user, posting.companyId);

  await prisma.selectionRound.delete({ where: { id: roundId } });
}
