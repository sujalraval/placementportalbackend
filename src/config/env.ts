import 'dotenv/config';
import { z } from 'zod';

/// Parsed once at import. A missing or malformed value kills the process here
/// rather than at the first request that happens to need it.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  /// Where the SPA lives. OAuth callbacks bounce back here, and it's the only
  /// place we'll redirect to after a provider round-trip.
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  /// Public base URL of *this* API. Must match the redirect URI registered
  /// with LinkedIn and Microsoft exactly, or the provider rejects the call.
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),

  // OAuth credentials. Optional: a provider with no client id is simply
  // switched off, and its endpoints return a clear "not configured" error
  // rather than the server refusing to boot.
  LINKEDIN_CLIENT_ID: z.string().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().default(''),
  MICROSOFT_CLIENT_ID: z.string().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().default(''),
  /// `common` = any Microsoft account (work, school or personal). Replace with
  /// a tenant id to restrict sign-in to the university's Entra directory.
  MICROSOFT_TENANT: z.string().default('common'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
