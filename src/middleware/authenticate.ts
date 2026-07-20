import type { RequestHandler } from 'express';
import { ApiError } from '../lib/http-error.ts';
import { verifyAccessToken } from '../lib/tokens.ts';
import type { UserRole } from '../generated/prisma/enums.ts';

/// Rejects the request unless it carries a valid `Authorization: Bearer`
/// access token. Populates `req.user`.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing bearer token'));
    return;
  }

  try {
    req.user = verifyAccessToken(header.slice('Bearer '.length));
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

/// Route guard for the coarse persona fence — "is this an admin console
/// route". It does NOT check row ownership: a coordinator passing
/// requireRole('COORDINATOR') still has to be scoped to their own department
/// by the query itself. Use `departmentScope`/`companyScope` for that.
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`This route requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };

/// The department fence, as a Prisma `where` fragment. An admin sees
/// everything, so they get an empty filter; a coordinator or faculty member
/// is pinned to their own department.
export function departmentScope(user: Express.Request['user']): { departmentId?: string } {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN') return {};
  if (!user.departmentId) throw ApiError.forbidden('Account is not scoped to a department');
  return { departmentId: user.departmentId };
}

/// The recruiter fence. An admin sees every company's rows.
export function companyScope(user: Express.Request['user']): { companyId?: string } {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN') return {};
  if (!user.companyId) throw ApiError.forbidden('Account is not scoped to a company');
  return { companyId: user.companyId };
}

/// Resolves "which student" from the session — the thing the frontend
/// currently hardcodes to Aarav Shah's enrolment number.
export function currentStudentId(user: Express.Request['user']): string {
  if (!user) throw ApiError.unauthorized();
  if (user.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('This route is only available to students');
  }
  return user.studentId;
}
