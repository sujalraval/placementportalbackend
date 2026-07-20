import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  EvaluateRoundInput,
  ScheduleInterviewInput,
  UpdateInterviewOutcomeInput,
  ReleaseOfferInput,
  RevokeOfferInput,
  RespondOfferInput,
} from './application.schema.ts';

// Helper to check if a recruiter/staff has access to an application
async function checkApplicationAccess(user: Express.Request['user'], applicationId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return;

  if (user.role === 'RECRUITER') {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: { select: { companyId: true } } }
    });
    if (!app) throw ApiError.notFound('Application not found');
    if (app.jobPosting.companyId !== user.companyId) {
      throw ApiError.forbidden('Not authorized to access this application');
    }
    return;
  }
  
  throw ApiError.forbidden('Not authorized to manage applications');
}

export async function listApplications(user: Express.Request['user'], jobPostingId?: string) {
  if (user?.role === 'STUDENT') {
    throw ApiError.forbidden('Students should use /applications/me');
  }
  
  const where: any = {};
  if (jobPostingId) {
    where.jobPostingId = jobPostingId;
    
    // Check if recruiter owns this posting
    if (user?.role === 'RECRUITER') {
      const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
      if (!posting || posting.companyId !== user.companyId) {
        throw ApiError.forbidden('Not authorized to view these applications');
      }
    }
  } else if (user?.role === 'RECRUITER') {
    // If no postingId provided, default to all postings for this recruiter's company
    where.jobPosting = { companyId: user.companyId };
  }

  return prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, userId: true, enrollmentNo: true, user: { select: { fullName: true, email: true } } } },
      rounds: true,
      offer: true,
    }
  });
}

export async function getMyApplications(user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can fetch their own applications');
  }

  return prisma.application.findMany({
    where: { studentId: user.studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      jobPosting: { select: { id: true, title: true, company: { select: { name: true, logoUrl: true } } } },
      interviews: true,
      offer: true,
      // Intentionally omitting rounds to hide internal evaluation remarks from students
    }
  });
}

export async function applyForJob(input: CreateApplicationInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can apply for jobs');
  }

  const student = await prisma.student.findUnique({ where: { id: user.studentId } });
  if (!student) throw ApiError.notFound('Student profile not found');

  // Verify eligibility (e.g. UNPLACED)
  if (student.placementStatus !== 'UNPLACED') {
    throw ApiError.conflict('You cannot apply because you are already placed or opted out');
  }

  const posting = await prisma.jobPosting.findUnique({ where: { id: input.jobPostingId } });
  if (!posting || posting.status !== 'PUBLISHED') {
    throw ApiError.conflict('This job posting is not currently accepting applications');
  }

  // Check if already applied
  const existing = await prisma.application.findUnique({
    where: { studentId_jobPostingId: { studentId: user.studentId, jobPostingId: input.jobPostingId } }
  });
  if (existing) {
    throw ApiError.conflict('You have already applied for this job');
  }

  // Calculate Match Score logic placeholder
  const matchScore = 80; 

  return prisma.application.create({
    data: {
      studentId: user.studentId,
      jobPostingId: input.jobPostingId,
      coverNote: input.coverNote,
      matchScore,
      status: 'APPLIED',
    }
  });
}

export async function updateStatus(id: string, input: UpdateApplicationStatusInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, id);

  const application = await prisma.application.findUnique({
    where: { id },
    include: { offer: true }
  });
  if (!application) throw ApiError.notFound('Application not found');

  // Enforce Offer consistency invariant
  if (application.offer && (application.offer.status === 'RELEASED' || application.offer.status === 'ACCEPTED')) {
    if (input.status !== 'OFFER' && input.status !== 'JOINED') {
      throw ApiError.conflict(`Cannot change status to ${input.status} because a valid offer exists. Status must be OFFER or JOINED.`);
    }
  }

  const updateData: any = { status: input.status, rejectionReason: input.rejectionReason };
  if (input.status === 'SHORTLISTED' && application.status !== 'SHORTLISTED') updateData.shortlistedAt = new Date();
  if (input.status === 'REJECTED' && application.status !== 'REJECTED') updateData.rejectedAt = new Date();
  if (input.status === 'WITHDRAWN' && application.status !== 'WITHDRAWN') updateData.withdrawnAt = new Date();

  return prisma.application.update({
    where: { id },
    data: updateData
  });
}

// --- Rounds & Interviews ---

export async function evaluateRound(applicationId: string, input: EvaluateRoundInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, applicationId);
  
  // Upsert ApplicationRound
  const existing = await prisma.applicationRound.findUnique({
    where: { applicationId_selectionRoundId: { applicationId, selectionRoundId: input.selectionRoundId } }
  });

  if (existing) {
    return prisma.applicationRound.update({
      where: { id: existing.id },
      data: {
        marks: input.marks ?? undefined,
        result: input.result,
        remarks: input.remarks,
        evaluatedByUserId: user!.sub,
        evaluatedAt: new Date(),
      }
    });
  } else {
    return prisma.applicationRound.create({
      data: {
        applicationId,
        selectionRoundId: input.selectionRoundId,
        marks: input.marks ?? undefined,
        result: input.result,
        remarks: input.remarks,
        evaluatedByUserId: user!.sub,
        evaluatedAt: new Date(),
      }
    });
  }
}

export async function scheduleInterview(applicationId: string, input: ScheduleInterviewInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, applicationId);

  return prisma.interview.create({
    data: {
      applicationId,
      selectionRoundId: input.selectionRoundId,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      venue: input.venue,
      meetingUrl: input.meetingUrl,
      panelMembers: input.panelMembers ?? [],
    }
  });
}

export async function updateInterview(applicationId: string, interviewId: string, input: UpdateInterviewOutcomeInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, applicationId);
  
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview || interview.applicationId !== applicationId) {
    throw ApiError.notFound('Interview not found for this application');
  }

  return prisma.interview.update({
    where: { id: interviewId },
    data: {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    }
  });
}

// --- Offers ---

export async function releaseOffer(applicationId: string, input: ReleaseOfferInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, applicationId);

  const existing = await prisma.offer.findUnique({ where: { applicationId } });
  if (existing) {
    throw ApiError.conflict('An offer has already been created for this application');
  }

  // Create offer and update application status to OFFER in a transaction
  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({
      data: {
        applicationId,
        referenceNo: input.referenceNo,
        ctc: input.ctc,
        ctcCurrency: input.ctcCurrency,
        designation: input.designation,
        location: input.location,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
        respondByDate: input.respondByDate ? new Date(input.respondByDate) : undefined,
        status: 'RELEASED',
      }
    });

    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'OFFER' }
    });

    return offer;
  });
}

export async function revokeOffer(applicationId: string, input: RevokeOfferInput, user: Express.Request['user']) {
  await checkApplicationAccess(user, applicationId);

  const offer = await prisma.offer.findUnique({ where: { applicationId } });
  if (!offer || offer.status === 'REVOKED') {
    throw ApiError.notFound('Active offer not found');
  }

  return prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: input.revokeReason,
    }
  });
}

export async function respondToOffer(applicationId: string, input: RespondOfferInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can respond to offers');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { offer: true }
  });

  if (!application || application.studentId !== user.studentId) {
    throw ApiError.notFound('Application not found');
  }
  
  const offer = application.offer;
  if (!offer || offer.status !== 'RELEASED') {
    throw ApiError.conflict('No pending offer available to respond to');
  }

  const newStatus = input.accept ? 'ACCEPTED' : 'DECLINED';
  
  return prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id: offer.id },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      }
    });

    if (input.accept) {
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'JOINED' }
      });
      await tx.student.update({
        where: { id: user.studentId! },
        data: { placementStatus: 'PLACED' }
      });
    } else {
      // If they declined, revert application status or leave it at OFFER?
      // Usually it goes back to INTERVIEW or REJECTED or WITHDRAWN depending on workflow. 
      // We will mark the application as WITHDRAWN or keep it at OFFER but offer is declined.
      // Let's set it to WITHDRAWN for simplicity, or we can just leave it as OFFER but offer is declined.
      // The instruction just says "an application with an offer must sit in OFFER/JOINED". If offer is DECLINED, it is no longer an active offer.
    }

    return updatedOffer;
  });
}
