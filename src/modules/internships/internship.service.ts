import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  CreateInternshipPostingInput,
  UpdateInternshipPostingInput,
  UpdateInternshipPostingStatusInput,
  ApplyInternshipInput,
  UpdateInternshipStageInput,
  RequestApprovalInput,
  DecideApprovalInput,
  SubmitReportInput,
  EvaluateInternshipInput,
} from './internship.schema.ts';

// --- Visibility and Access Helpers ---

function buildPostingVisibilityFilter(user: Express.Request['user']): any {
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

  return deptScope;
}

function checkPostingWriteAccess(user: Express.Request['user'], companyId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return;
  if (user.role === 'RECRUITER') {
    if (user.companyId !== companyId) {
      throw ApiError.forbidden('You can only modify your own company postings');
    }
    return;
  }
  throw ApiError.forbidden('Not authorized to modify this posting');
}

async function checkInternshipAccess(user: Express.Request['user'], internshipId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return;

  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { internshipPosting: { select: { companyId: true } } }
  });
  if (!internship) throw ApiError.notFound('Internship not found');

  if (user.role === 'RECRUITER') {
    if (internship.internshipPosting.companyId !== user.companyId) {
      throw ApiError.forbidden('Not authorized to access this internship');
    }
    return;
  }
  
  if (user.role === 'STUDENT') {
    if (internship.studentId !== user.studentId) {
      throw ApiError.forbidden('Not authorized to access this internship');
    }
    return;
  }
  
  if (user.role === 'FACULTY') {
     const mentee = await prisma.menteeRecord.findUnique({ where: { internshipId } });
     if (!mentee || mentee.facultyUserId !== user.sub) {
       throw ApiError.forbidden('You are not the assigned mentor for this internship');
     }
     return;
  }
  
  throw ApiError.forbidden('Not authorized to access this internship');
}

// --- Postings ---

export async function listPostings(user: Express.Request['user']) {
  const where = buildPostingVisibilityFilter(user);
  return prisma.internshipPosting.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true, logoUrl: true } }
    }
  });
}

export async function getPostingById(id: string, user: Express.Request['user']) {
  const where = { id, ...buildPostingVisibilityFilter(user) };
  const posting = await prisma.internshipPosting.findFirst({
    where,
    include: {
      company: { select: { id: true, name: true, logoUrl: true, about: true } },
      department: { select: { id: true, name: true } },
    }
  });

  if (!posting) throw ApiError.notFound('Internship posting not found');
  return posting;
}

export async function createPosting(input: CreateInternshipPostingInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  let companyId = input.companyId;

  if (user.role === 'RECRUITER') {
    companyId = user.companyId!;
  } else if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
    if (!companyId) throw ApiError.badRequest('companyId is required for admins creating postings');
  } else {
    throw ApiError.forbidden('Not authorized to create postings');
  }

  let startDate: Date | undefined;
  if (input.startDate) startDate = new Date(input.startDate);
  
  let deadline: Date | undefined;
  if (input.applicationDeadline) deadline = new Date(input.applicationDeadline);

  return prisma.internshipPosting.create({
    data: {
      ...input,
      companyId: companyId!,
      status: 'DRAFT',
      createdByUserId: user.sub,
      startDate,
      applicationDeadline: deadline,
    }
  });
}

export async function updatePosting(id: string, input: UpdateInternshipPostingInput, user: Express.Request['user']) {
  const posting = await prisma.internshipPosting.findUnique({ where: { id } });
  if (!posting) throw ApiError.notFound('Posting not found');

  checkPostingWriteAccess(user, posting.companyId);

  return prisma.internshipPosting.update({
    where: { id },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : undefined,
    }
  });
}

export async function updatePostingStatus(id: string, input: UpdateInternshipPostingStatusInput, user: Express.Request['user']) {
  const posting = await prisma.internshipPosting.findUnique({ where: { id } });
  if (!posting) throw ApiError.notFound('Posting not found');

  checkPostingWriteAccess(user, posting.companyId);

  if (user?.role === 'RECRUITER' && input.status === 'PUBLISHED') {
    throw ApiError.forbidden('Recruiters cannot publish postings directly. Submit for approval instead.');
  }

  const updateData: any = { status: input.status };
  if (input.status === 'PUBLISHED' && posting.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  return prisma.internshipPosting.update({
    where: { id },
    data: updateData
  });
}

// --- Internships (Applications / Trackers) ---

export async function listInternships(user: Express.Request['user'], internshipPostingId?: string) {
  if (user?.role === 'STUDENT') {
    throw ApiError.forbidden('Students should use /internships/me');
  }
  
  const where: any = {};
  if (internshipPostingId) {
    where.internshipPostingId = internshipPostingId;
    if (user?.role === 'RECRUITER') {
      const posting = await prisma.internshipPosting.findUnique({ where: { id: internshipPostingId } });
      if (!posting || posting.companyId !== user.companyId) {
        throw ApiError.forbidden('Not authorized to view these internships');
      }
    }
  } else if (user?.role === 'RECRUITER') {
    where.internshipPosting = { companyId: user.companyId };
  } else if (user?.role === 'FACULTY') {
    where.menteeRecord = { facultyUserId: user.sub };
  }

  return prisma.internship.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, enrollmentNo: true, user: { select: { fullName: true } } } },
      approval: true,
      menteeRecord: true,
    }
  });
}

export async function getMyInternships(user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can fetch their own internships');
  }

  return prisma.internship.findMany({
    where: { studentId: user.studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      internshipPosting: { select: { id: true, title: true, company: { select: { name: true, logoUrl: true } } } },
      approval: true,
      menteeRecord: { select: { faculty: { select: { fullName: true } } } },
      report: true,
    }
  });
}

export async function applyForInternship(input: ApplyInternshipInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can apply for internships');
  }

  const posting = await prisma.internshipPosting.findUnique({ where: { id: input.internshipPostingId } });
  if (!posting || posting.status !== 'PUBLISHED') {
    throw ApiError.conflict('This internship posting is not currently accepting applications');
  }

  const existing = await prisma.internship.findUnique({
    where: { studentId_internshipPostingId: { studentId: user.studentId, internshipPostingId: input.internshipPostingId } }
  });
  if (existing) {
    throw ApiError.conflict('You have already applied for this internship');
  }

  return prisma.internship.create({
    data: {
      studentId: user.studentId,
      internshipPostingId: input.internshipPostingId,
      stage: 'APPLIED',
    }
  });
}

export async function updateStage(id: string, input: UpdateInternshipStageInput, user: Express.Request['user']) {
  await checkInternshipAccess(user, id);

  const internship = await prisma.internship.findUnique({ where: { id } });
  if (!internship) throw ApiError.notFound('Internship not found');

  if (user?.role === 'STUDENT') {
    throw ApiError.forbidden('Students cannot manually update the internship stage directly');
  }

  const updateData: any = { stage: input.stage };
  if (input.stage === 'SELECTED' && internship.stage !== 'SELECTED') updateData.selectedAt = new Date();
  if (input.stage === 'REJECTED' && internship.stage !== 'REJECTED') updateData.rejectedAt = new Date();
  if (input.stage === 'COMPLETED' && internship.stage !== 'COMPLETED') updateData.completedAt = new Date();

  return prisma.internship.update({
    where: { id },
    data: updateData
  });
}

// --- College Approval Flow ---

export async function requestApproval(id: string, input: RequestApprovalInput, user: Express.Request['user']) {
  await checkInternshipAccess(user, id);
  
  if (user?.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can request approval');
  }

  const internship = await prisma.internship.findUnique({ 
    where: { id },
    include: { internshipPosting: true } 
  });
  if (!internship) throw ApiError.notFound('Internship not found');

  if (internship.stage !== 'SELECTED') {
    throw ApiError.conflict('You can only request approval if you have been SELECTED');
  }

  const existingApproval = await prisma.internshipApproval.findUnique({ where: { internshipId: id } });
  if (existingApproval) {
    throw ApiError.conflict('Approval has already been requested');
  }

  return prisma.$transaction(async (tx) => {
    const approval = await tx.internshipApproval.create({
      data: {
        internshipId: id,
        requestNote: input.requestNote,
        courseCode: input.courseCode,
        creditCount: input.creditCount,
        evaluationBasis: input.evaluationBasis,
        status: 'PENDING',
      }
    });

    await tx.internship.update({
      where: { id },
      data: { stage: 'APPROVAL_REQUESTED' }
    });

    return approval;
  });
}

export async function decideApproval(id: string, input: DecideApprovalInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins and coordinators can approve internships');
  }

  const internship = await prisma.internship.findUnique({ 
    where: { id },
    include: { approval: true } 
  });
  if (!internship || !internship.approval) {
    throw ApiError.notFound('Pending approval request not found');
  }

  if (input.status === 'APPROVED' && !input.facultyUserId) {
    throw ApiError.badRequest('You must assign a faculty mentor when approving an internship');
  }

  // Enforce Mentee Record Integrity Check
  if (input.status === 'APPROVED' && input.facultyUserId) {
    const faculty = await prisma.user.findUnique({ where: { id: input.facultyUserId } });
    if (!faculty || faculty.role !== 'FACULTY') {
      throw ApiError.badRequest('The assigned mentor must be a user with the FACULTY role');
    }
  }

  return prisma.$transaction(async (tx) => {
    const approval = await tx.internshipApproval.update({
      where: { internshipId: id },
      data: {
        status: input.status,
        decidedByUserId: user.sub,
        decidedAt: new Date(),
        remarks: input.remarks,
      }
    });

    if (input.status === 'APPROVED') {
      await tx.menteeRecord.create({
        data: {
          internshipId: id,
          facultyUserId: input.facultyUserId!,
        }
      });
      await tx.internship.update({
        where: { id },
        data: { 
          stage: 'APPROVED',
          complianceStartedAt: new Date(),
        }
      });
    } else {
      await tx.internship.update({
        where: { id },
        data: { stage: 'REJECTED' }
      });
    }

    return approval;
  });
}

// --- Reports & Evaluation ---

export async function submitReport(id: string, input: SubmitReportInput, user: Express.Request['user']) {
  await checkInternshipAccess(user, id);
  if (user?.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can submit reports');
  }

  const internship = await prisma.internship.findUnique({ where: { id } });
  if (!internship) throw ApiError.notFound('Internship not found');

  if (internship.stage !== 'APPROVED' && internship.stage !== 'ONGOING') {
    throw ApiError.conflict('You can only submit a report when the internship is APPROVED or ONGOING');
  }

  return prisma.$transaction(async (tx) => {
    const existingReport = await tx.internshipReport.findUnique({ where: { internshipId: id } });
    let report;
    if (existingReport) {
      report = await tx.internshipReport.update({
        where: { internshipId: id },
        data: input
      });
    } else {
      report = await tx.internshipReport.create({
        data: {
          internshipId: id,
          ...input
        }
      });
    }

    await tx.internship.update({
      where: { id },
      data: { stage: 'REPORT_SUBMITTED' }
    });

    return report;
  });
}

export async function evaluateInternship(id: string, input: EvaluateInternshipInput, user: Express.Request['user']) {
  await checkInternshipAccess(user, id);
  if (user?.role !== 'FACULTY') {
    throw ApiError.forbidden('Only assigned faculty mentors can evaluate internships');
  }

  const internship = await prisma.internship.findUnique({ 
    where: { id },
    include: { menteeRecord: true }
  });
  if (!internship || !internship.menteeRecord) {
    throw ApiError.notFound('Mentee record not found');
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.menteeRecord.update({
      where: { internshipId: id },
      data: {
        grade: input.grade,
        marks: input.marks,
        remarks: input.remarks,
        evaluatedAt: new Date(),
      }
    });

    await tx.internship.update({
      where: { id },
      data: { stage: 'EVALUATED' }
    });

    return record;
  });
}
