import { z } from 'zod';

export const skillIdParam = z.object({
  id: z.string().uuid('Not a valid skill id'),
});

export const createSkillBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  category: z.string().trim().max(50).optional(),
});

export const updateSkillBody = createSkillBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateSkillInput = z.infer<typeof createSkillBody>;
export type UpdateSkillInput = z.infer<typeof updateSkillBody>;
