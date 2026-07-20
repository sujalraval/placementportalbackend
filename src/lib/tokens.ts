import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import type { UserRole } from '../generated/prisma/enums.ts';

/// What every authenticated request resolves to. `departmentId` and
/// `companyId` ride in the token because they are the data-visibility fence —
/// almost every scoped query needs one of them, and re-reading the user row
/// on each request to get them would be a join per call.
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  departmentId: string | null;
  companyId: string | null;
  /// Present only for role STUDENT.
  studentId: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
