import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateContactInput,
  UpdateContactInput,
  UpsertMouInput,
  VerifyCompanyInput,
} from './company.schema.ts';
import type { UserRole } from '../../generated/prisma/enums.ts';

/// Defines who can see what.
function buildVisibilityFilter(user: Express.Request['user']): any {
  if (!user) throw ApiError.unauthorized();
  
  if (user.role === 'ADMIN') {
    return {};
  }
  
  if (user.role === 'COORDINATOR' || user.role === 'FACULTY') {
    if (!user.departmentId) throw ApiError.forbidden('No department scope');
    return {
      OR: [
        { visibilityScopes: { has: 'UNIVERSITY_WIDE' } },
        { departmentId: user.departmentId },
      ],
    };
  }

  // Students and Recruiters only see active, approved companies that are
  // university-wide or in their department (if they have one).
  const scope: any = {
    isActive: true,
    verificationStatus: 'APPROVED',
  };

  if (user.departmentId) {
    scope.OR = [
      { visibilityScopes: { has: 'UNIVERSITY_WIDE' } },
      { departmentId: user.departmentId },
    ];
  } else {
    scope.visibilityScopes = { has: 'UNIVERSITY_WIDE' };
  }

  return scope;
}

/// Checks write access
function checkWriteAccess(user: Express.Request['user'], companyId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN') return;
  if (user.role === 'RECRUITER') {
    if (user.companyId !== companyId) {
      throw ApiError.forbidden('You can only modify your own company');
    }
    return;
  }
  // Coordinator? Maybe Coordinators can update companies in their department?
  // We'll restrict to Admin and the Recruiter themselves for now.
  throw ApiError.forbidden('Not authorized to modify this company');
}

export async function listCompanies(user: Express.Request['user']) {
  const where = buildVisibilityFilter(user);
  return prisma.company.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      sectors: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    }
  });
}

export async function getCompanyById(id: string, user: Express.Request['user']) {
  // If the user is a recruiter requesting their own company, bypass the public visibility filters
  // (e.g. they need to see their profile even if it's pending/inactive).
  const isOwnCompany = user?.role === 'RECRUITER' && user?.companyId === id;
  const where = isOwnCompany ? { id } : { id, ...buildVisibilityFilter(user) };

  const company = await prisma.company.findFirst({
    where,
    include: {
      sectors: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    }
  });

  if (!company) throw ApiError.notFound('Company not found');
  return company;
}

export async function createCompany(input: CreateCompanyInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins and coordinators can manually create companies');
  }

  const clash = await prisma.company.findUnique({
    where: { slug: input.slug },
    select: { slug: true }
  });
  if (clash) throw ApiError.conflict('A company with that slug already exists');

  const { sectorIds, visibilityScopes, ...restInput } = input;

  return prisma.company.create({
    data: {
      ...restInput,
      visibilityScopes: visibilityScopes?.length ? visibilityScopes : ['UNIVERSITY_WIDE'],
      sectors: sectorIds?.length ? { connect: sectorIds.map(id => ({ id })) } : undefined,
      onboardedByUserId: user.sub,
      // For Admins/Coordinators, we auto-approve them.
      verificationStatus: 'APPROVED',
      onboardingStage: 'ACTIVATED',
      isActive: true,
    }
  });
}

export async function updateCompany(id: string, input: UpdateCompanyInput, user: Express.Request['user']) {
  checkWriteAccess(user, id);
  await getCompanyById(id, user); // ensures it exists

  if (input.slug) {
    const clash = await prisma.company.findUnique({ where: { slug: input.slug } });
    if (clash && clash.id !== id) {
      throw ApiError.conflict('A company with that slug already exists');
    }
  }

  const { sectorIds, visibilityScopes, ...restInput } = input;

  const dataPayload: any = { ...restInput };
  if (visibilityScopes !== undefined) dataPayload.visibilityScopes = visibilityScopes;
  if (sectorIds !== undefined) dataPayload.sectors = { set: sectorIds.map(sid => ({ id: sid })) };

  return prisma.company.update({
    where: { id },
    data: dataPayload,
  });
}

export async function verifyCompany(id: string, input: VerifyCompanyInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN') {
    throw ApiError.forbidden('Only admins can verify companies');
  }
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound('Company not found');

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      verificationStatus: input.verificationStatus,
      isActive: input.isActive ?? company.isActive,
      onboardingStage: input.verificationStatus === 'APPROVED' ? 'VERIFIED' : company.onboardingStage,
    }
  });

  if (input.verificationStatus === 'APPROVED') {
    await prisma.user.updateMany({
      where: { companyId: id, role: 'RECRUITER', status: 'PENDING' },
      data: { status: 'ACTIVE' },
    });
  }

  return updatedCompany;
}

// --- Contacts ---

export async function listContacts(companyId: string, user: Express.Request['user']) {
  // If they can see the company, they can see the contacts (or restrict to staff/recruiters only?)
  // Let's assume contacts are private to staff and the company itself.
  if (user?.role === 'STUDENT') {
    throw ApiError.forbidden('Students cannot view company contacts directly');
  }
  
  if (user?.role === 'RECRUITER' && user.companyId !== companyId) {
    throw ApiError.forbidden('You can only view your own company contacts');
  }

  return prisma.companyContact.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function addContact(companyId: string, input: CreateContactInput, user: Express.Request['user']) {
  checkWriteAccess(user, companyId);
  return prisma.companyContact.create({
    data: {
      companyId,
      ...input
    }
  });
}

export async function updateContact(companyId: string, contactId: string, input: UpdateContactInput, user: Express.Request['user']) {
  checkWriteAccess(user, companyId);
  
  const contact = await prisma.companyContact.findUnique({ where: { id: contactId } });
  if (!contact || contact.companyId !== companyId) {
    throw ApiError.notFound('Contact not found in this company');
  }

  return prisma.companyContact.update({
    where: { id: contactId },
    data: input
  });
}

export async function removeContact(companyId: string, contactId: string, user: Express.Request['user']) {
  checkWriteAccess(user, companyId);
  
  const contact = await prisma.companyContact.findUnique({ where: { id: contactId } });
  if (!contact || contact.companyId !== companyId) {
    throw ApiError.notFound('Contact not found in this company');
  }

  await prisma.companyContact.delete({ where: { id: contactId } });
}

// --- MOU ---

export async function getMou(companyId: string, user: Express.Request['user']) {
  if (user?.role === 'STUDENT') {
    throw ApiError.forbidden('Students cannot view MOUs');
  }
  if (user?.role === 'RECRUITER' && user.companyId !== companyId) {
    throw ApiError.forbidden('You can only view your own MOU');
  }

  return prisma.mou.findUnique({ where: { companyId } });
}

export async function upsertMou(companyId: string, input: UpsertMouInput, user: Express.Request['user']) {
  // Only Admin or Coordinator can manage MOUs.
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins and coordinators can manage MOUs');
  }

  const existing = await prisma.mou.findUnique({ where: { companyId } });

  // Convert string datetimes to JS Dates for Prisma
  const validFromDate = new Date(input.validFrom);
  const validToDate = new Date(input.validTo);
  const signedAtDate = input.signedAt ? new Date(input.signedAt) : null;

  if (existing) {
    return prisma.mou.update({
      where: { companyId },
      data: {
        ...input,
        validFrom: validFromDate,
        validTo: validToDate,
        signedAt: signedAtDate,
      }
    });
  } else {
    return prisma.mou.create({
      data: {
        companyId,
        ...input,
        validFrom: validFromDate,
        validTo: validToDate,
        signedAt: signedAtDate,
      }
    });
  }
}
