import { prisma } from '../../lib/prisma.ts';

export async function getDashboardStats() {
  const [
    totalCompanies,
    activeDrives,
    totalOffers,
    totalInternships
  ] = await Promise.all([
    prisma.company.count(),
    prisma.drive.count({ where: { status: { in: ['SCHEDULED', 'ONGOING'] } } }),
    prisma.offer.count({ where: { status: 'ACCEPTED' } }),
    prisma.internship.count({ where: { stage: { in: ['APPROVED', 'EVALUATED', 'COMPLETED'] } } })
  ]);

  const maxCtcRecord = await prisma.offer.findFirst({
    where: { status: 'ACCEPTED' },
    orderBy: { ctc: 'desc' },
    select: { ctc: true }
  });

  return {
    totalCompanies,
    activeDrives,
    totalOffers,
    totalInternships,
    highestCtc: maxCtcRecord?.ctc || 0
  };
}

export async function getPlacementAnalytics(batchYear?: number) {
  const where: any = { status: 'ACCEPTED' };
  
  const offers = await prisma.offer.findMany({
    where,
    include: {
      application: {
        include: {
          student: {
            select: {
              batchEndYear: true,
              departmentName: true
            }
          },
          jobPosting: {
            include: {
              company: {
                include: {
                  sector: true
                }
              }
            }
          }
        }
      }
    }
  });

  const filteredOffers = batchYear 
    ? offers.filter(o => o.application.student.batchEndYear === batchYear)
    : offers;

  const byDepartment: Record<string, number> = {};
  const bySector: Record<string, number> = {};

  filteredOffers.forEach(o => {
    const dept = o.application.student.departmentName || 'Unknown';
    const sector = o.application.jobPosting.company.sector?.name || 'Unknown';

    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    bySector[sector] = (bySector[sector] || 0) + 1;
  });

  return {
    total: filteredOffers.length,
    byDepartment,
    bySector
  };
}

export async function getStudentReadiness(batchYear?: number) {
  const where: any = {};
  if (batchYear) {
    where.student = { batchEndYear: batchYear };
  }

  const cvScores = await prisma.cvScoreSnapshot.findMany({
    where,
    orderBy: { computedAt: 'desc' },
    distinct: ['studentId'],
    select: { total: true }
  });

  const readinessScores = await prisma.readinessSnapshot.findMany({
    where,
    orderBy: { capturedAt: 'desc' },
    distinct: ['studentId'],
    select: { score: true }
  });

  const avgCvScore = cvScores.length > 0 
    ? cvScores.reduce((acc, curr) => acc + curr.total, 0) / cvScores.length
    : 0;
    
  const avgReadiness = readinessScores.length > 0 
    ? readinessScores.reduce((acc, curr) => acc + curr.score, 0) / readinessScores.length
    : 0;

  return {
    studentsTracked: Math.max(cvScores.length, readinessScores.length),
    avgCvScore: Math.round(avgCvScore),
    avgReadiness: Math.round(avgReadiness)
  };
}

export async function getAuditLogs(limit: number = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: { select: { fullName: true, email: true } }
    }
  });
}

export async function getSelectionFunnel() {
  const jobs = await prisma.jobPosting.findMany({
    include: {
      company: true,
      applications: {
        include: {
          rounds: {
            include: {
              selectionRound: true
            }
          },
          offers: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return jobs.map(job => {
    let applied = 0;
    let appeared = 0;
    let tech = 0;
    let hr = 0;
    let offer = 0;
    let joined = 0;

    job.applications.forEach(app => {
      applied++;
      
      // If they progressed past APPLIED, they appeared in some round or got shortlisted
      if (app.status !== 'APPLIED' && app.status !== 'WITHDRAWN') {
        appeared++;
      }
      
      const hasTechRound = app.rounds.some(r => r.selectionRound.type === 'TECHNICAL');
      const hasHrRound = app.rounds.some(r => r.selectionRound.type === 'HR');
      
      if (hasTechRound) tech++;
      if (hasHrRound) hr++;
      
      if (app.status === 'OFFER' || app.status === 'JOINED' || app.offers.length > 0) {
        offer++;
      }
      
      if (app.status === 'JOINED' || app.offers.some(o => o.status === 'ACCEPTED')) {
        joined++;
      }
    });

    return {
      label: `${job.company.name} · ${job.title}`,
      data: {
        applied,
        appeared,
        tech,
        hr,
        offer,
        joined
      }
    };
  });
}

