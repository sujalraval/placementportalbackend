import { Router } from 'express';
import { prisma } from '../lib/prisma.ts';
import { authRouter } from '../modules/auth/auth.routes.ts';
import { departmentRouter } from '../modules/platform/department.routes.ts';
import { programRouter } from '../modules/platform/program.routes.ts';
import { sectorRouter } from '../modules/platform/sector.routes.ts';
import { skillRoutes } from '../modules/platform/skill.routes.ts';
import { genericMasterRoutes } from '../modules/platform/masters/generic.routes.ts';
import { userRouter } from '../modules/platform/user.routes.ts';
import { studentRouter } from '../modules/students/student.routes.ts';
import { companyRouter } from '../modules/companies/company.routes.ts';
import { postingRouter } from '../modules/postings/posting.routes.ts';
import { applicationRouter } from '../modules/applications/application.routes.ts';
import { internshipRouter } from '../modules/internships/internship.routes.ts';
import { driveRouter } from '../modules/drives/drive.routes.ts';
import { verificationRouter } from '../modules/verification/verification.routes.ts';
import { notificationRouter } from '../modules/notifications/notification.routes.ts';
import { supportRouter } from '../modules/support/support.routes.ts';
import { contentRouter } from '../modules/content/content.routes.ts';
import { trainingRouter } from '../modules/training/training.routes.ts';
import { alumniRouter } from '../modules/alumni/alumni.routes.ts';
import { reportRouter } from '../modules/reports/report.routes.ts';

export const router = Router();

/// Liveness + a real round-trip to Postgres, so this failing means something.
/// Not a domain module — infrastructure, so it stays here.
router.get('/health', async (_req, res) => {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'up', latencyMs: Date.now() - startedAt });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      database: 'down',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---------------------------------------------------------------------------
// Domain modules. Each owns its own routes/controller/service/schema and
// declares its own role guards; see src/modules/platform/department.* for the
// pattern every module follows.
//
// Mounted by domain, not by persona — the internship lifecycle alone crosses
// four personas, and splitting it by console would scatter one stage machine
// across four folders.
// ---------------------------------------------------------------------------

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/programs', programRouter);
router.use('/sectors', sectorRouter);
router.use('/skills', skillRoutes);
router.use('/masters', genericMasterRoutes);
router.use('/users', userRouter);
router.use('/students', studentRouter);

router.use('/companies', companyRouter);
router.use('/postings', postingRouter);
router.use('/applications', applicationRouter);
router.use('/internships', internshipRouter);
router.use('/drives', driveRouter);
router.use('/verification', verificationRouter);
router.use('/notifications', notificationRouter);
router.use('/support', supportRouter);
router.use('/content', contentRouter);
router.use('/training', trainingRouter);
router.use('/alumni', alumniRouter);
router.use('/reports', reportRouter);

// Error handling middleware
