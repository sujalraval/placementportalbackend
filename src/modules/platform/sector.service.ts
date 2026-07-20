import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateSectorInput, UpdateSectorInput } from './sector.schema.ts';

/// The industry-sector registry used to categorise companies and job
/// openings. Small and rarely written to, so no pagination — the doc's
/// "Sectors" admin module is just add/edit/delete over a short list.

export async function listSectors() {
  return prisma.sector.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { companies: true } } },
  });
}

export async function getSectorById(id: string) {
  const sector = await prisma.sector.findUnique({
    where: { id },
    include: { _count: { select: { companies: true } } },
  });
  if (!sector) throw ApiError.notFound('Sector not found');
  return sector;
}

export async function createSector(input: CreateSectorInput) {
  const clash = await prisma.sector.findFirst({
    where: { OR: [{ name: input.name }, ...(input.code ? [{ code: input.code }] : [])] },
    select: { name: true, code: true },
  });
  if (clash) {
    const field = input.code && clash.code === input.code ? 'code' : 'name';
    throw ApiError.conflict(`A sector with that ${field} already exists`);
  }

  return prisma.sector.create({ data: input });
}

export async function updateSector(id: string, input: UpdateSectorInput) {
  await getSectorById(id);
  return prisma.sector.update({ where: { id }, data: input });
}

export async function deleteSector(id: string) {
  const sector = await prisma.sector.findUnique({
    where: { id },
    include: { _count: { select: { companies: true } } },
  });
  if (!sector) throw ApiError.notFound('Sector not found');

  const { companies } = sector._count;
  if (companies > 0) {
    throw ApiError.conflict(
      `Cannot delete a sector with ${companies} compan${companies === 1 ? 'y' : 'ies'} assigned to it. Reassign them first.`,
    );
  }

  await prisma.sector.delete({ where: { id } });
}
