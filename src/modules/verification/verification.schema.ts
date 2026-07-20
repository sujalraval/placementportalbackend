import { z } from 'zod';

export const verificationItemIdParam = z.object({
  id: z.string().uuid('Not a valid verification item id'),
});

export const submitVerificationBody = z.object({
  itemType: z.enum(['DOCUMENT', 'PROFILE_FIELD', 'STATUS_CHANGE']),
  documentId: z.string().uuid().nullable().optional(),
  fieldName: z.string().max(100).nullable().optional(),
  oldValue: z.string().max(1000).nullable().optional(),
  newValue: z.string().max(1000).nullable().optional(),
}).refine(data => {
  if (data.itemType === 'DOCUMENT' && !data.documentId) {
    return false;
  }
  if ((data.itemType === 'PROFILE_FIELD' || data.itemType === 'STATUS_CHANGE') && !data.fieldName) {
    return false;
  }
  return true;
}, {
  message: 'DOCUMENT requires documentId. PROFILE_FIELD and STATUS_CHANGE require fieldName.',
});

export const reviewVerificationBody = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().trim().max(2000).nullable().optional(),
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationBody>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationBody>;
