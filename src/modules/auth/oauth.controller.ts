import type { RequestHandler } from 'express';
import { env, isProduction } from '../../config/env.ts';
import { ApiError } from '../../lib/http-error.ts';
import * as oauth from './oauth.service.ts';
import { isProviderConfigured } from './oauth-providers.ts';
import {
  completeRecruiterBody,
  completeStudentBody,
  oauthProviderParam,
  oauthStartQuery,
} from './auth.schema.ts';
import type { AuthProvider } from '../../generated/prisma/enums.ts';

const txCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // `lax` still sends the cookie on the provider's top-level GET redirect back
  // to us, which is exactly the case that must work. `strict` would drop it
  // and break every callback.
  sameSite: 'lax' as const,
  maxAge: oauth.OAUTH_COOKIE_MAX_AGE_MS,
  path: '/api/v1/auth/oauth',
};

/// Which providers the frontend should render buttons for. Lets the SPA avoid
/// showing a LinkedIn button on a server with no LinkedIn credentials.
export const listProviders: RequestHandler = (_req, res) => {
  const providers: AuthProvider[] = ['LINKEDIN', 'MICROSOFT'];
  res.json({
    data: providers.map((p) => ({
      provider: p,
      id: p.toLowerCase(),
      configured: isProviderConfigured(p),
      startUrl: `${env.API_PUBLIC_URL}/api/v1/auth/oauth/${p.toLowerCase()}/start`,
    })),
  });
};

/// Kicks off the round-trip. The browser is redirected to the provider; state,
/// nonce and the PKCE verifier ride in an httpOnly cookie that only the
/// callback path can read.
export const start: RequestHandler = async (req, res) => {
  const { provider } = oauthProviderParam.parse(req.params);
  const { returnTo } = oauthStartQuery.parse(req.query);

  const { authorizationUrl, transaction } = await oauth.beginOAuth(provider, returnTo);

  res.cookie(oauth.OAUTH_COOKIE, JSON.stringify(transaction), txCookieOptions);
  res.redirect(authorizationUrl);
};

function readTransaction(req: Parameters<RequestHandler>[0]): oauth.OAuthTransaction {
  const raw = req.cookies?.[oauth.OAUTH_COOKIE] as string | undefined;
  if (!raw) {
    throw ApiError.badRequest(
      'Sign-in session expired or cookies are blocked. Please try again.',
    );
  }
  try {
    return JSON.parse(raw) as oauth.OAuthTransaction;
  } catch {
    throw ApiError.badRequest('Malformed sign-in state');
  }
}

/// The provider redirects a *browser* here, so failures render as a redirect
/// back to the SPA with an error code — a JSON body would just be shown as raw
/// text in the address bar.
export const callback: RequestHandler = async (req, res) => {
  const { provider } = oauthProviderParam.parse(req.params);
  const tx = readTransaction(req);
  res.clearCookie(oauth.OAUTH_COOKIE, { path: txCookieOptions.path });

  if (tx.provider !== provider) throw ApiError.badRequest('Provider mismatch');

  const currentUrl = new URL(`${env.API_PUBLIC_URL}${req.originalUrl}`);

  let outcome: oauth.OAuthOutcome;
  try {
    const profile = await oauth.exchangeCode(currentUrl, tx);
    outcome = await oauth.resolveIdentity(profile, {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Sign-in failed';
    const url = new URL('/auth/callback', tx.returnTo);
    url.searchParams.set('status', 'error');
    url.searchParams.set('message', message);
    res.redirect(url.toString());
    return;
  }

  const url = new URL('/auth/callback', tx.returnTo);

  if (outcome.kind === 'needs-registration') {
    // No account yet. Hand the SPA a ticket proving the provider identity; it
    // collects enrolment/company details and posts to /oauth/complete/*.
    url.searchParams.set('status', 'register');
    url.searchParams.set('ticket', outcome.ticket);
    url.searchParams.set('email', outcome.profile.email ?? '');
    url.searchParams.set('name', outcome.profile.displayName ?? '');
    res.redirect(url.toString());
    return;
  }

  // Tokens go in the URL fragment, not the query string: fragments are not
  // sent to servers and stay out of access logs, Referer headers and browser
  // history sync.
  const fragment = new URLSearchParams({
    accessToken: outcome.session.accessToken,
    refreshToken: outcome.session.refreshToken,
    expiresIn: outcome.session.expiresIn,
  });
  url.searchParams.set('status', 'ok');
  res.redirect(`${url.toString()}#${fragment.toString()}`);
};

/// Links a provider to the already-signed-in account. Same round-trip, but the
/// callback attaches instead of creating.
export const linkCallback: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { provider } = oauthProviderParam.parse(req.params);
  const tx = readTransaction(req);
  res.clearCookie(oauth.OAUTH_COOKIE, { path: txCookieOptions.path });

  if (tx.provider !== provider) throw ApiError.badRequest('Provider mismatch');

  const currentUrl = new URL(`${env.API_PUBLIC_URL}${req.originalUrl}`);
  const profile = await oauth.exchangeCode(currentUrl, tx);
  await oauth.linkIdentity(req.user.sub, profile);

  res.json({ data: { linked: provider } });
};

export const completeStudent: RequestHandler = async (req, res) => {
  const body = completeStudentBody.parse(req.body);
  const user = await oauth.completeStudentRegistration(body);
  res.status(201).json({
    data: { user },
    message: 'Registration received. Your account is pending approval.',
  });
};

export const completeRecruiter: RequestHandler = async (req, res) => {
  const body = completeRecruiterBody.parse(req.body);
  const user = await oauth.completeRecruiterRegistration(body);
  res.status(201).json({
    data: { user },
    message:
      'Registration received. The Placement Cell will verify your company before your account is activated.',
  });
};
