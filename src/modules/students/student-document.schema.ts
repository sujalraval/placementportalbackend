import { z } from 'zod';

export const documentIdParam = z.object({
  id: z.uuid('Not a valid document id'),
});

/// No file bytes travel through this API — see the "Documents have no
/// storage" note in the README. The client uploads to wherever storage ends
/// up living and gives us the resulting URL; this just records the metadata
/// and opens the verification-queue entry.
export const uploadDocumentBody = z.object({
  type: z.enum([
    'RESUME',
    'MARKSHEET',
    'CERTIFICATE',
    'ID_PROOF',
    'OFFER_LETTER',
    'COMPANY_REGISTRATION',
    'OTHER',
  ]),
  title: z.string().trim().min(1).max(160),
  fileName: z.string().trim().min(1).max(255),
  fileUrl: z.url('Not a valid URL'),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().trim().max(120).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentBody>;
