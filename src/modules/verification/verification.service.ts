import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  SubmitVerificationInput,
  ReviewVerificationInput,
} from './verification.schema.ts';

const ALLOWED_PROFILE_FIELDS = [
  'cgpa', 'activeBacklogs', 'totalBacklogs', 'tenthMarks', 'twelfthMarks',
  'resumeUrl', 'githubUrl', 'linkedinUrl',
];

export async function listItems(user: Express.Request['user']) {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
    throw ApiError.forbidden('Only admins and coordinators can view the verification queue');
  }

  const where: any = {};
  if (user.role === 'COORDINATOR' && user.departmentId) {
    where.student = { departmentId: user.departmentId };
  }

  return prisma.verificationItem.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: {
      student: { select: { id: true, enrollmentNo: true, user: { select: { fullName: true } } } },
      document: { select: { id: true, title: true, fileUrl: true } }
    }
  });
}

export async function getMyItems(user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can fetch their verification items');
  }

  return prisma.verificationItem.findMany({
    where: { studentId: user.studentId },
    orderBy: { submittedAt: 'desc' },
    include: {
      document: { select: { id: true, title: true, fileUrl: true } }
    }
  });
}

export async function submitItem(input: SubmitVerificationInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can submit verification items');
  }

  if (input.itemType === 'DOCUMENT' && input.documentId) {
    // Verify document belongs to student
    const doc = await prisma.document.findUnique({ where: { id: input.documentId } });
    if (!doc || doc.studentId !== user.studentId) {
      throw ApiError.forbidden('Document not found or does not belong to you');
    }
  }

  return prisma.verificationItem.create({
    data: {
      studentId: user.studentId,
      itemType: input.itemType,
      documentId: input.documentId,
      fieldName: input.fieldName,
      oldValue: input.oldValue,
      newValue: input.newValue,
      status: 'PENDING',
    }
  });
}

export async function reviewItem(id: string, input: ReviewVerificationInput, user: Express.Request['user']) {
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINATOR')) {
    throw ApiError.forbidden('Only admins and coordinators can review items');
  }

  const item = await prisma.verificationItem.findUnique({
    where: { id },
    include: { student: true }
  });

  if (!item) throw ApiError.notFound('Verification item not found');

  // If coordinator, check department
  if (user.role === 'COORDINATOR' && user.departmentId) {
    if (item.student.departmentId !== user.departmentId) {
      throw ApiError.forbidden('You can only review items for students in your department');
    }
  }

  if (item.status !== 'PENDING') {
    throw ApiError.conflict('This item has already been reviewed');
  }

  return prisma.$transaction(async (tx) => {
    const updatedItem = await tx.verificationItem.update({
      where: { id },
      data: {
        status: input.status,
        reviewedByUserId: user.sub,
        reviewedAt: new Date(),
        remarks: input.remarks,
      }
    });

    if (input.status === 'APPROVED') {
      if (item.itemType === 'DOCUMENT' && item.documentId) {
        await tx.document.update({
          where: { id: item.documentId },
          data: { status: 'APPROVED', reviewedByUserId: user.sub, reviewedAt: new Date() }
        });
      } else if (item.itemType === 'PROFILE_FIELD' && item.fieldName && item.newValue) {
        // Automatically apply safe profile fields
        if (ALLOWED_PROFILE_FIELDS.includes(item.fieldName)) {
          let parsedValue: any = item.newValue;
          // Cast numbers
          if (['cgpa', 'activeBacklogs', 'totalBacklogs', 'tenthMarks', 'twelfthMarks'].includes(item.fieldName)) {
             parsedValue = Number(item.newValue);
             if (isNaN(parsedValue)) parsedValue = null;
          }

          if (parsedValue !== null) {
            await tx.student.update({
              where: { id: item.studentId },
              data: { [item.fieldName]: parsedValue }
            });
          }
        }
      }
    } else if (input.status === 'REJECTED') {
       if (item.itemType === 'DOCUMENT' && item.documentId) {
         await tx.document.update({
          where: { id: item.documentId },
          data: { status: 'REJECTED', reviewedByUserId: user.sub, reviewedAt: new Date(), remarks: input.remarks }
        });
       }
    }

    return updatedItem;
  });
}
