import type { AccessTokenPayload } from '../lib/tokens.ts';

declare global {
  namespace Express {
    interface Request {
      /// Set by `requireAuth`. Undefined on public routes.
      user?: AccessTokenPayload;
    }
  }
}

export {};
