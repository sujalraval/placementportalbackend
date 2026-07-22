import { z } from 'zod';

export const studentIdParam = z.object({
  id: z.uuid('Not a valid student id'),
});

/// Roster query for the coordinator ("Students" module — CGPA, backlogs,
/// readiness, application count) and admin ("Students" — university-wide
/// sample). departmentId is accepted here but overridden by departmentScope()
/// in the service for anyone who isn't ADMIN.
export const listStudentsQuery = z.object({
  departmentId: z.uuid().optional(),
  programId: z.uuid().optional(),
  placementStatus: z.enum(['UNPLACED', 'PLACED', 'OPTED_OUT', 'HIGHER_STUDIES']).optional(),
  batchEndYear: z.coerce.number().int().optional(),
  /// Matches enrolment number or full name.
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/// A student's self-editable fields. Deliberately excludes enrollmentNo,
/// departmentId, programId, batchYears, cgpa and activeBacklogs — those are
/// registrar-controlled data a self-edit shouldn't be able to touch, since
/// cgpa/backlogs feed directly into every posting's eligibility check.
/// Corrections to those go through `academicRecordBody` (staff-only, below).
export const updateOwnProfileBody = z
  .object({
    fullName: z.string().trim().max(160),
    phone: z.string().trim().max(20),
    headline: z.string().trim().max(160),
    bio: z.string().trim().max(2000),
    dateOfBirth: z.iso.date(),
    gender: z.string().trim().max(40),
    category: z.string().trim().max(40),
    addressLine: z.string().trim().max(200),
    city: z.string().trim().max(80),
    state: z.string().trim().max(80),
    pincode: z.string().trim().max(12),
    cgpa: z.number().min(0).max(10),
    activeBacklogs: z.number().int().min(0),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

/// A student may move themselves to OPTED_OUT or HIGHER_STUDIES, or back to
/// UNPLACED. They cannot self-report PLACED — per the doc, accepting an offer
/// is "the one action in the whole system that writes to the student's own
/// placement status from outside the student portal", and that write belongs
/// to the (not yet built) applications module, not here.
export const updatePlacementStatusBody = z.object({
  status: z.enum(['UNPLACED', 'OPTED_OUT', 'HIGHER_STUDIES']),
});

/// Registrar-controlled corrections. Coordinator (own department) or Admin
/// only — this is what the doc calls the "Students" roster's implicit source
/// of truth, distinct from anything the student can edit about themselves.
export const academicRecordBody = z
  .object({
    cgpa: z.number().min(0).max(10),
    activeBacklogs: z.number().int().min(0),
    programId: z.uuid().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const upsertPreferenceBody = z.object({
  preferredRoles: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  preferredLocations: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  preferredKinds: z.array(z.enum(['PLACEMENT', 'INTERNSHIP', 'OJT'])).max(3).default([]),
  minExpectedCtc: z.number().min(0).optional(),
  openToRelocate: z.boolean().default(true),
});

export type ListStudentsFilters = z.infer<typeof listStudentsQuery>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileBody>;
export type UpdatePlacementStatusInput = z.infer<typeof updatePlacementStatusBody>;
export type AcademicRecordInput = z.infer<typeof academicRecordBody>;
export type UpsertPreferenceInput = z.infer<typeof upsertPreferenceBody>;
