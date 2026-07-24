import { z } from 'zod';
const STAFF_ROLES = ['COORDINATOR', 'FACULTY', 'ADMIN'] as const;
const createStaffUserBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
  role: z.enum(STAFF_ROLES),
  departmentId: z.string().uuid().optional(),
  phone: z.string().trim().max(20).optional(),
  designation: z.string().trim().max(120).optional(),
  assignAsCoordinator: z.boolean().default(false),
}).refine((v) => (v.role === 'ADMIN' ? v.departmentId === undefined : v.departmentId !== undefined), {
  message: 'departmentId is required for COORDINATOR/FACULTY and must be omitted for ADMIN',
  path: ['departmentId'],
});
const res = createStaffUserBody.safeParse({
  fullName: 'test coordinator',
  email: 'test@coordinator.com',
  password: 'testpassword',
  role: 'COORDINATOR',
  departmentId: 'some-uuid'
});
console.dir(res, {depth: null});
