import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import { recomputeProfileCompleteness } from './student.service.ts';
import type { UploadDocumentInput } from './student-document.schema.ts';

export const listDocuments = (studentId: string) =>
  prisma.document.findMany({ where: { studentId }, orderBy: { uploadedAt: 'desc' } });

/// Anything a student uploads goes through the department first (the doc's
/// profile-verification flow), so the document and its queue entry are
/// created together — there is no state where a document exists but isn't
/// somewhere in the queue.
export async function uploadDocument(studentId: string, input: UploadDocumentInput) {
  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({ data: { studentId, ...input } });
    await tx.verificationItem.create({
      data: {
        studentId,
        itemType: 'DOCUMENT',
        documentId: created.id,
      },
    });
    return created;
  });

  await recomputeProfileCompleteness(studentId);
  return document;
}

/// Only a PENDING upload can be withdrawn. Once a coordinator has acted on it
/// (APPROVED or REJECTED), deleting it would also cascade-delete the
/// verification_item and erase the department's audit trail — the doc lists
/// "verification log" as one of the coordinator's report types, and that
/// report is only honest if approved/rejected items can't quietly disappear.
export async function deleteDocument(studentId: string, id: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    select: { studentId: true, status: true },
  });
  if (!document || document.studentId !== studentId) {
    throw ApiError.notFound('Document not found');
  }
  if (document.status !== 'PENDING') {
    throw ApiError.conflict(
      `This document has already been ${document.status.toLowerCase()} and is part of the verification record. It can no longer be withdrawn.`,
    );
  }

  await prisma.document.delete({ where: { id } });
  await recomputeProfileCompleteness(studentId);
}
