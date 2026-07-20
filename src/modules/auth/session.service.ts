import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.ts';
import { env } from '../../config/env.ts';
import { ApiError } from '../../lib/http-error.ts';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.ts';
import type { AccessTokenPayload } from '../../lib/tokens.ts';
import type { User } from '../../generated/prisma/client.ts';

/// Refresh tokens are stored hashed, never raw — a database dump should not be
/// a pile of working sessions.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/// Builds the access-token claims for a user. `studentId` is resolved here so
/// that student routes can answer "which student is this" from the token
/// alone — the thing the frontend currently hardcodes to Aarav Shah.
export async function buildAccessPayload(userId: string): Promise<AccessTokenPayload> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      companyId: true,
      student: { select: { id: true } },
    },
  });
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  return {
    sub: user.id,
    role: user.role,
    departmentId: user.departmentId,
    companyId: user.companyId,
    studentId: user.student?.id ?? null,
  };
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface RequestContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

/// Refresh-token lifetime, parsed from JWT_REFRESH_TTL so the database row and
/// the token itself always expire together.
function refreshExpiryDate(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_TTL);
  if (!match) {
    throw new Error(`JWT_REFRESH_TTL is not a duration like "7d": ${env.JWT_REFRESH_TTL}`);
  }
  const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]!]!;
  return new Date(Date.now() + Number(match[1]) * unit);
}

export async function issueSession(
  user: Pick<User, 'id'>,
  ctx: RequestContext = {},
): Promise<IssuedSession> {
  const payload = await buildAccessPayload(user.id);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL };
}

/// Rotates a refresh token: the presented one is retired and a fresh pair is
/// issued.
///
/// If a token that was ALREADY rotated is presented again, that means it
/// leaked — the legitimate client would have discarded it. Every live session
/// for that user is revoked rather than guessing which side is the attacker.
export async function rotateSession(
  presented: string,
  ctx: RequestContext = {},
): Promise<IssuedSession> {
  let claims: { sub: string };
  try {
    claims = verifyRefreshToken(presented);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(presented);
  const session = await prisma.refreshSession.findUnique({ where: { tokenHash } });

  if (!session) throw ApiError.unauthorized('Refresh token not recognised');

  if (session.revokedAt) {
    await prisma.refreshSession.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized(
      'This session was already refreshed. All sessions have been signed out as a precaution.',
    );
  }

  if (session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  const next = signRefreshToken({ sub: claims.sub });
  const nextHash = hashToken(next);

  // Retire the old row and record the new one atomically — a crash between
  // the two would otherwise leave a usable token with no successor.
  await prisma.$transaction([
    prisma.refreshSession.update({
      where: { tokenHash },
      data: { revokedAt: new Date(), replacedByHash: nextHash },
    }),
    prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: nextHash,
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
        expiresAt: refreshExpiryDate(),
      },
    }),
  ]);

  const payload = await buildAccessPayload(session.userId);
  return {
    accessToken: signAccessToken(payload),
    refreshToken: next,
    expiresIn: env.JWT_ACCESS_TTL,
  };
}

export async function revokeSession(presented: string): Promise<void> {
  // Logout is idempotent: an unknown or already-dead token is still a
  // successful logout from the caller's point of view.
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashToken(presented), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string): Promise<number> {
  const { count } = await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}
