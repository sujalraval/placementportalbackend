import * as client from 'openid-client';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.ts';
import { env } from '../../config/env.ts';
import { ApiError } from '../../lib/http-error.ts';
import { getProviderConfig, getProviderScope } from './oauth-providers.ts';
import { issueSession } from './session.service.ts';
import type { IssuedSession } from './session.service.ts';
import type { AuthProvider } from '../../generated/prisma/enums.ts';
import type { CompleteRecruiterInput, CompleteStudentInput } from './auth.schema.ts';
import type { PublicUser } from './auth.service.ts';

/// State carried across the provider round-trip. Lives in a short-lived
/// httpOnly cookie rather than a table — it's per-browser, single-use, and
/// worthless after two minutes.
export interface OAuthTransaction {
  provider: AuthProvider;
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

export const OAUTH_COOKIE = 'pp_oauth_tx';
export const OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

export function redirectUri(provider: AuthProvider): string {
  return `${env.API_PUBLIC_URL}/api/v1/auth/oauth/${provider.toLowerCase()}/callback`;
}

/// Only ever redirect back into our own frontend. Without this check, a
/// crafted `returnTo` turns the callback into an open redirect that leaks a
/// freshly minted session to whatever host the attacker names.
export function safeReturnTo(returnTo: string | undefined): string {
  if (!returnTo) return env.FRONTEND_URL;
  try {
    const target = new URL(returnTo, env.FRONTEND_URL);
    const allowed = new URL(env.FRONTEND_URL);
    if (target.origin !== allowed.origin) return env.FRONTEND_URL;
    return target.toString();
  } catch {
    return env.FRONTEND_URL;
  }
}

export async function beginOAuth(
  provider: AuthProvider,
  returnTo: string | undefined,
): Promise<{ authorizationUrl: string; transaction: OAuthTransaction }> {
  const config = await getProviderConfig(provider);

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(provider),
    scope: getProviderScope(provider),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  });

  return {
    authorizationUrl: authorizationUrl.href,
    transaction: { provider, state, nonce, codeVerifier, returnTo: safeReturnTo(returnTo) },
  };
}

export interface ProviderProfile {
  provider: AuthProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

/// Exchanges the authorization code and reads the verified identity. The
/// library validates the id_token signature, issuer, audience, nonce and PKCE;
/// `sub` is the only identifier we trust for resolving who this is.
export async function exchangeCode(
  currentUrl: URL,
  tx: OAuthTransaction,
): Promise<ProviderProfile> {
  const config = await getProviderConfig(tx.provider);

  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: tx.codeVerifier,
    expectedState: tx.state,
    expectedNonce: tx.nonce,
  });

  const claims = tokens.claims();
  if (!claims?.sub) throw ApiError.unauthorized('Provider did not return an identity');

  const info = await client.fetchUserInfo(config, tokens.access_token, claims.sub);

  return {
    provider: tx.provider,
    providerAccountId: claims.sub,
    email: typeof info.email === 'string' ? info.email.toLowerCase() : null,
    emailVerified: info.email_verified === true,
    displayName: info.name ?? null,
    avatarUrl: typeof info.picture === 'string' ? info.picture : null,
  };
}

// ---------------------------------------------------------------------------
// Registration tickets
// ---------------------------------------------------------------------------

interface RegistrationTicket {
  purpose: 'oauth-registration';
  provider: AuthProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

/// A signed, 30-minute proof that this browser controls a given provider
/// account — but has no portal account yet.
///
/// Deliberately not a database row: replay is already impossible because
/// completing it writes an auth_identity, and (provider, providerAccountId) is
/// unique. A second attempt hits that constraint.
///
/// Signed with the REFRESH secret, and carries a `purpose` claim, so a ticket
/// can never be presented as an access token.
function signTicket(profile: ProviderProfile): string {
  const payload: RegistrationTicket = { purpose: 'oauth-registration', ...profile };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '30m' });
}

function verifyTicket(ticket: string): RegistrationTicket {
  let decoded: RegistrationTicket;
  try {
    decoded = jwt.verify(ticket, env.JWT_REFRESH_SECRET) as RegistrationTicket;
  } catch {
    throw ApiError.unauthorized('That registration link expired. Please sign in again.');
  }
  if (decoded.purpose !== 'oauth-registration') {
    throw ApiError.unauthorized('Invalid registration ticket');
  }
  return decoded;
}

export type OAuthOutcome =
  | { kind: 'signed-in'; user: PublicUser; session: IssuedSession }
  | { kind: 'needs-registration'; ticket: string; profile: ProviderProfile };

/// Resolves a verified provider identity to an outcome.
///
/// Note what is NOT here: any lookup by email. An unrecognised provider
/// subject always means "register", never "probably this existing user".
export async function resolveIdentity(
  profile: ProviderProfile,
  ctx: { userAgent?: string | undefined; ipAddress?: string | undefined },
): Promise<OAuthOutcome> {
  const identity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          avatarUrl: true,
          departmentId: true,
          companyId: true,
        },
      },
    },
  });

  if (!identity) {
    return { kind: 'needs-registration', ticket: signTicket(profile), profile };
  }

  const { user } = identity;
  if (user.status === 'PENDING') {
    throw ApiError.forbidden(
      'Your account is awaiting approval. You will be notified once it is reviewed.',
    );
  }
  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('This account has been suspended. Contact the Placement Cell.');
  }

  await prisma.authIdentity.update({
    where: { id: identity.id },
    data: { lastLoginAt: new Date(), email: profile.email, avatarUrl: profile.avatarUrl },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { kind: 'signed-in', user, session: await issueSession(user, ctx) };
}

/// Links a provider to the account that is ALREADY signed in. This is the only
/// way two providers end up on one account — deliberately, since it proves
/// control of the portal account rather than inferring it from an email.
export async function linkIdentity(userId: string, profile: ProviderProfile): Promise<void> {
  const existing = await prisma.authIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    select: { userId: true },
  });

  if (existing && existing.userId !== userId) {
    throw ApiError.conflict('That provider account is already linked to a different user');
  }
  if (existing) return;

  await prisma.authIdentity.create({
    data: {
      userId,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      lastLoginAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// Completing OAuth-bootstrapped registration
// ---------------------------------------------------------------------------

/// The email on a ticket is provider-reported and, with any-Microsoft-account
/// sign-in allowed, unverifiable. If it already belongs to someone, refuse
/// rather than attach — otherwise this is the account-takeover path that
/// keying on `sub` was meant to close.
async function assertEmailFree(email: string | null): Promise<string> {
  if (!email) {
    throw ApiError.badRequest('Your provider did not share an email address');
  }
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) {
    throw ApiError.conflict(
      'An account with that email already exists. Sign in with your password, then link this provider from your profile.',
    );
  }
  return email;
}

export async function completeStudentRegistration(
  input: CompleteStudentInput,
): Promise<PublicUser> {
  const profile = verifyTicket(input.ticket);
  const email = await assertEmailFree(profile.email);

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true },
  });
  if (!department) throw ApiError.badRequest('That department does not exist');

  const enrollmentTaken = await prisma.student.findUnique({
    where: { enrollmentNo: input.enrollmentNo },
    select: { id: true },
  });
  if (enrollmentTaken) throw ApiError.conflict('That enrolment number is already registered');

  return prisma.user.create({
    data: {
      email,
      // No password: this account signs in through the provider only, until
      // the user sets one.
      passwordHash: null,
      fullName: profile.displayName ?? email,
      phone: input.phone ?? null,
      avatarUrl: profile.avatarUrl,
      role: 'STUDENT',
      status: 'PENDING',
      authIdentities: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
          emailVerified: profile.emailVerified,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          lastLoginAt: new Date(),
        },
      },
      student: {
        create: {
          enrollmentNo: input.enrollmentNo,
          departmentId: input.departmentId,
          programId: input.programId ?? null,
          batchStartYear: input.batchStartYear,
          batchEndYear: input.batchEndYear,
          cgpa: input.cgpa,
        },
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      avatarUrl: true,
      departmentId: true,
      companyId: true,
    },
  });
}

export async function completeRecruiterRegistration(
  input: CompleteRecruiterInput,
): Promise<PublicUser> {
  const profile = verifyTicket(input.ticket);
  const email = await assertEmailFree(profile.email);

  const base =
    input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'company';
  let slug = base;
  for (let attempt = 1; attempt < 50; attempt++) {
    const taken = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) break;
    slug = `${base}-${attempt + 1}`;
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: null,
      fullName: profile.displayName ?? email,
      phone: input.phone ?? null,
      designation: input.designation ?? null,
      avatarUrl: profile.avatarUrl,
      role: 'RECRUITER',
      status: 'PENDING',
      authIdentities: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
          emailVerified: profile.emailVerified,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          lastLoginAt: new Date(),
        },
      },
      company: {
        create: {
          name: input.companyName,
          slug,
          type: input.companyType,
          website: input.website ?? null,
          sectorId: input.sectorId ?? null,
          hqCity: input.hqCity ?? null,
          onboardingStage: 'REGISTERED',
          verificationStatus: 'PENDING',
          isActive: false,
          visibilityScope: 'UNIVERSITY_WIDE',
        },
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      avatarUrl: true,
      departmentId: true,
      companyId: true,
    },
  });
}
