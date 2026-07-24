import { z } from 'zod';

export const userIdParam = z.object({
  id: z.uuid('Not a valid user id'),
});

const STAFF_ROLES = ['COORDINATOR', 'FACULTY', 'ADMIN'] as const;

export const listUsersQuery = z.object({
  role: z.enum(['STUDENT', 'RECRUITER', 'COORDINATOR', 'FACULTY', 'ADMIN']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  departmentId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  /// Matches full name (case-insensitive) or email.
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/// Admin creates STAFF accounts directly — coordinator, faculty, another
/// admin — and they land ACTIVE rather than PENDING, same as the doc's
/// "Admin vouches for someone they already know" pattern for recruiters.
/// STUDENT and RECRUITER are deliberately not creatable here: those roles
/// need a nested student/company record that the schema's CHECK constraint
/// requires, which is what /auth/register/* exists to set up correctly.
export const createStaffUserBody = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.email().toLowerCase().trim(),
    password: z.string().min(8).max(100),
    role: z.enum(STAFF_ROLES),
    departmentId: z.uuid().optional(),
    phone: z.string().trim().max(20).optional(),
    designation: z.string().trim().max(120).optional(),
    /// Only meaningful when role is COORDINATOR: also sets this user as the
    /// department's official coordinator (department.coordinatorUserId).
    assignAsCoordinator: z.boolean().default(false),
  })
  .refine((v) => (v.role === 'ADMIN' ? v.departmentId === undefined : v.departmentId !== undefined), {
    message: 'departmentId is required for COORDINATOR/FACULTY and must be omitted for ADMIN',
    path: ['departmentId'],
  });

/// Deliberately excludes email and role — an email change wants a
/// verification step that doesn't exist yet, and a role change is a different
/// account in disguise (it flips which CHECK-constraint shape applies).
export const updateUserBody = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(20).optional(),
    designation: z.string().trim().max(120).optional(),
    departmentId: z.uuid(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

/// PENDING is not a settable target — it only ever happens at registration.
/// This is both "approve a pending account" and "suspend/reactivate" from the
/// doc's Users & roles module, since both are just a status transition.
export const setUserStatusBody = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().trim().max(500).optional(),
});

export type CreateStaffUserInput = z.infer<typeof createStaffUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
export type SetUserStatusInput = z.infer<typeof setUserStatusBody>;
