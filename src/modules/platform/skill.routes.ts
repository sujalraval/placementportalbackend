import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';
import * as controller from './skill.controller.ts';

const router = Router();

// Everyone can list skills (e.g. students, recruiters filling out forms)
router.get('/', requireAuth, controller.listSkills);
router.get('/:id', requireAuth, controller.getSkill);

// Only admins manage skills
router.post('/', requireAuth, requireRole('ADMIN'), controller.createSkill);
router.patch('/:id', requireAuth, requireRole('ADMIN'), controller.updateSkill);
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteSkill);

export const skillRoutes = router;
