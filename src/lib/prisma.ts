import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { env, isProduction } from '../config/env.ts';

/// Prisma 7 has no direct-connection mode: the client always reaches the
/// database through a driver adapter, so the pg pool is ours to configure.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
});

/// Cached on globalThis so tsx's watch-mode reloads reuse one pool instead of
/// opening a new one per reload until Postgres refuses connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });

if (!isProduction) globalForPrisma.prisma = prisma;
