import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { 
  CreateMentorshipRequestInput, 
  CreateReferralRequestInput, 
  UpdateRequestStatusInput 
} from './alumni.schema.ts';

export async function listRequests(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const isStudent = user.role === 'STUDENT';
  if (isStudent && !user.studentId) throw ApiError.forbidden('Student profile missing');

  const mentorshipWhere: any = isStudent ? { studentId: user.studentId as string } : {};
  const referralWhere: any = isStudent ? { studentId: user.studentId as string } : {};

  const mentorships = await prisma.mentorshipRequest.findMany({
    where: mentorshipWhere,
    orderBy: { createdAt: 'desc' },
    include: { alumni: { select: { fullName: true, currentCompany: true } } }
  });

  const referrals = await prisma.referralRequest.findMany({
    where: referralWhere,
    orderBy: { createdAt: 'desc' },
    include: { alumni: { select: { fullName: true, currentCompany: true } } }
  });

  return { mentorships, referrals };
}

export async function createMentorshipRequest(input: CreateMentorshipRequestInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can request mentorship');
  }

  const alumni = await prisma.alumniProfile.findUnique({ where: { id: input.alumniId } });
  if (!alumni) throw ApiError.notFound('Alumni profile not found');
  if (!alumni.isMentor) throw ApiError.forbidden('This alumni is not accepting mentorship requests');

  const existing = await prisma.mentorshipRequest.findUnique({
    where: { studentId_alumniId: { studentId: user.studentId, alumniId: input.alumniId } }
  });
  if (existing) throw ApiError.conflict('You have already submitted a mentorship request to this alumni');

  return prisma.mentorshipRequest.create({
    data: {
      ...input,
      studentId: user.studentId,
      status: 'PENDING'
    }
  });
}

export async function createReferralRequest(input: CreateReferralRequestInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can request referrals');
  }

  const alumni = await prisma.alumniProfile.findUnique({ where: { id: input.alumniId } });
  if (!alumni) throw ApiError.notFound('Alumni profile not found');
  if (!alumni.isOpenToReferrals) throw ApiError.forbidden('This alumni is not accepting referral requests');

  return prisma.referralRequest.create({
    data: {
      ...input,
      studentId: user.studentId,
      status: 'PENDING'
    }
  });
}

export async function updateRequestStatus(type: 'mentorship' | 'referral', id: string, input: UpdateRequestStatusInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can update request statuses');
  }

  const data: any = { status: input.status };
  if (input.status === 'APPROVED' || input.status === 'REJECTED') {
    data.respondedAt = new Date();
  }

  if (type === 'mentorship') {
    return prisma.mentorshipRequest.update({ where: { id }, data });
  } else {
    return prisma.referralRequest.update({ where: { id }, data });
  }
}
