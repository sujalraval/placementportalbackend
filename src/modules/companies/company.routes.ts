import { Router } from 'express';
import * as controller from './company.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const companyRouter = Router();

// Base company routes
companyRouter.get('/', requireAuth, controller.list);
companyRouter.get('/:id', requireAuth, controller.getById);

// Admin / Coordinator manual creation
companyRouter.post('/', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.create);

// Profile updates (Admin, or Recruiter via checkWriteAccess)
companyRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'RECRUITER'), controller.update);

// Admin-only verification
companyRouter.patch('/:id/verification', requireAuth, requireRole('ADMIN'), controller.verify);

// Contacts
companyRouter.get('/:id/contacts', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'FACULTY', 'RECRUITER'), controller.listContacts);
companyRouter.post('/:id/contacts', requireAuth, requireRole('ADMIN', 'RECRUITER'), controller.addContact);
companyRouter.patch('/:id/contacts/:contactId', requireAuth, requireRole('ADMIN', 'RECRUITER'), controller.updateContact);
companyRouter.delete('/:id/contacts/:contactId', requireAuth, requireRole('ADMIN', 'RECRUITER'), controller.removeContact);

// MOU
companyRouter.get('/:id/mou', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.getMou);
companyRouter.patch('/:id/mou', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.upsertMou);
