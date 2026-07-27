import type { Request, Response } from 'express';
import * as schema from './skill.schema.ts';
import * as service from './skill.service.ts';

export async function listSkills(req: Request, res: Response) {
  const skills = await service.listSkills();
  res.json({ data: skills });
}

export async function getSkill(req: Request, res: Response) {
  const { id } = schema.skillIdParam.parse(req.params);
  const skill = await service.getSkillById(id);
  res.json({ data: skill });
}

export async function createSkill(req: Request, res: Response) {
  const input = schema.createSkillBody.parse(req.body);
  const skill = await service.createSkill(input);
  res.status(201).json({ data: skill });
}

export async function updateSkill(req: Request, res: Response) {
  const { id } = schema.skillIdParam.parse(req.params);
  const input = schema.updateSkillBody.parse(req.body);
  const skill = await service.updateSkill(id, input);
  res.json({ data: skill });
}

export async function deleteSkill(req: Request, res: Response) {
  const { id } = schema.skillIdParam.parse(req.params);
  await service.deleteSkill(id);
  res.status(204).end();
}
