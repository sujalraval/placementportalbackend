import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/authenticate.ts';
import { generateMasterController } from './generic.controller.ts';

const router = Router();

export const generateMasterRoutes = (modelName: string) => {
  const r = Router();
  const ctrl = generateMasterController(modelName);
  r.get('/', requireAuth, ctrl.list);
  r.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);
  r.patch('/:id', requireAuth, requireRole('ADMIN'), ctrl.update);
  r.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.remove);
  return r;
};

// Mount all generic masters
export const genericMasterRoutes = router;
genericMasterRoutes.use('/colleges', generateMasterRoutes('college'));
genericMasterRoutes.use('/industries', generateMasterRoutes('industry'));
genericMasterRoutes.use('/application-areas', generateMasterRoutes('applicationArea'));
genericMasterRoutes.use('/industry-domains', generateMasterRoutes('industryDomain'));
genericMasterRoutes.use('/industry-sub-domains', generateMasterRoutes('industrySubDomain'));
genericMasterRoutes.use('/partner-types', generateMasterRoutes('partnerType'));
