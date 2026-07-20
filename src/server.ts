import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { prisma } from './lib/prisma.ts';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});

/// Finish in-flight requests, then let go of the pool. Without this, tsx
/// watch-mode restarts leave connections parked until Postgres times them out.
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
