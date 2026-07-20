import { z } from 'zod';

export const driveIdParam = z.object({
  id: z.string().uuid('Not a valid drive id'),
});

export const driveStudentIdParam = z.object({
  id: z.string().uuid('Not a valid drive id'),
  studentId: z.string().uuid('Not a valid student id'),
});

export const createDriveBody = z.object({
  companyId: z.string().uuid('Not a valid company id').optional(), // Required for Admin/Coordinator
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  driveDate: z.string().datetime(),
  venue: z.string().trim().max(255).nullable().optional(),
  mode: z.string().trim().max(50).nullable().optional(),
  
  visibilityScope: z.enum(['UNIVERSITY_WIDE', 'DEPARTMENT_ONLY']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

export const updateDriveBody = createDriveBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateDriveStatusBody = z.object({
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
});

export const markAttendanceBody = z.object({
  attended: z.boolean(),
});

export type CreateDriveInput = z.infer<typeof createDriveBody>;
export type UpdateDriveInput = z.infer<typeof updateDriveBody>;
export type UpdateDriveStatusInput = z.infer<typeof updateDriveStatusBody>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceBody>;
