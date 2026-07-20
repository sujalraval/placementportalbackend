import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client.ts';
import { ApiError } from '../lib/http-error.ts';
import { isProduction } from '../config/env.ts';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};

/// Every error the API returns takes this shape:
///   { error: { code, message, details? } }
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 unique violation, P2025 record not found, P2003 FK violation.
    const map: Record<string, { status: number; code: string; message: string }> = {
      P2002: { status: 409, code: 'ALREADY_EXISTS', message: 'That record already exists' },
      P2025: { status: 404, code: 'NOT_FOUND', message: 'Record not found' },
      P2003: { status: 400, code: 'INVALID_REFERENCE', message: 'Referenced record does not exist' },
    };
    const hit = map[err.code];
    if (hit) {
      res.status(hit.status).json({
        error: {
          code: hit.code,
          message: hit.message,
          // `meta` names tables, columns and constraints. Useful at a dev
          // console, free schema reconnaissance in production.
          details: isProduction ? undefined : err.meta,
        },
      });
      return;
    }
  }

  // A CHECK constraint rejection lands here — those encode real domain rules
  // (role/scope consistency, visibility scope), so surface them rather than
  // swallowing them into a blank 500.
  if (
    err instanceof Prisma.PrismaClientUnknownRequestError &&
    /violates check constraint/i.test(err.message)
  ) {
    res.status(422).json({
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'The change would leave the data inconsistent',
        details: isProduction ? undefined : err.message,
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      details: isProduction ? undefined : String(err instanceof Error ? err.stack : err),
    },
  });
};
