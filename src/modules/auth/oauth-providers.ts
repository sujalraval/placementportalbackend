import * as client from 'openid-client';
import { env } from '../../config/env.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { AuthProvider } from '../../generated/prisma/enums.ts';

/// Both providers are OpenID Connect, so both are discovered rather than
/// hand-configured — the library reads their well-known document and handles
/// id_token signature validation, nonce and PKCE for us. Hand-rolling JWKS
/// verification is exactly the sort of thing that looks fine and isn't.

interface ProviderConfig {
  issuer: URL;
  clientId: string;
  clientSecret: string;
  scope: string;
}

function providerConfig(provider: AuthProvider): ProviderConfig {
  switch (provider) {
    case 'LINKEDIN':
      return {
        issuer: new URL('https://www.linkedin.com/oauth'),
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        scope: 'openid profile email',
      };
    case 'MICROSOFT':
      // `common` accepts any Microsoft account — work, school or personal —
      // per the "allow any Microsoft account" decision. Swapping this for a
      // tenant id is the one-line change that restricts it to the university.
      return {
        issuer: new URL(`https://login.microsoftonline.com/${env.MICROSOFT_TENANT}/v2.0`),
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        scope: 'openid profile email',
      };
  }
}

const cache = new Map<AuthProvider, Promise<client.Configuration>>();

/// Discovery is a network round-trip, so the resulting Configuration is cached
/// per provider for the process lifetime.
export function getProviderConfig(provider: AuthProvider): Promise<client.Configuration> {
  const cached = cache.get(provider);
  if (cached) return cached;

  const cfg = providerConfig(provider);
  if (!cfg.clientId || !cfg.clientSecret) {
    throw ApiError.badRequest(
      `${provider} sign-in is not configured on this server`,
      { hint: `Set ${provider}_CLIENT_ID and ${provider}_CLIENT_SECRET` },
    );
  }

  const discovered = client
    .discovery(cfg.issuer, cfg.clientId, cfg.clientSecret)
    .catch((err: unknown) => {
      // Don't cache a failed discovery — a provider blip would otherwise
      // disable that provider until the process restarts.
      cache.delete(provider);
      throw err;
    });

  cache.set(provider, discovered);
  return discovered;
}

export function getProviderScope(provider: AuthProvider): string {
  return providerConfig(provider).scope;
}

export function isProviderConfigured(provider: AuthProvider): boolean {
  try {
    const cfg = providerConfig(provider);
    return Boolean(cfg.clientId && cfg.clientSecret);
  } catch {
    return false;
  }
}
