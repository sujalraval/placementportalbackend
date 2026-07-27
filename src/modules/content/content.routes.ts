import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as controller from './content.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'public/uploads');
      // Node 20+ fs.mkdirSync(uploadPath, { recursive: true }) is fine, but multer handles it if it exists
      import('fs').then(fs => fs.mkdirSync(uploadPath, { recursive: true })).catch(() => {});
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const contentRouter = Router();

// --- Uploads ---
contentRouter.post('/upload', requireAuth, requireRole('ADMIN', 'COORDINATOR'), upload.single('file'), controller.uploadFile);

// --- News ---
contentRouter.get('/news', requireAuth, controller.listNews);
contentRouter.get('/news/:slug', requireAuth, controller.getNews);
contentRouter.post('/news', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createNews);
contentRouter.patch('/news/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateNewsStatus);

// --- Events ---
contentRouter.get('/events', requireAuth, controller.listEvents);
contentRouter.get('/events/:slug', requireAuth, controller.getEvent);
contentRouter.post('/events', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createEvent);
contentRouter.patch('/events/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateEventStatus);
contentRouter.post('/events/:id/register', requireAuth, requireRole('STUDENT'), controller.registerForEvent);
contentRouter.get('/events/:id/registrations', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.listEventRegistrations);

// --- Broadcasts ---
contentRouter.get('/broadcasts', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.listBroadcasts);
contentRouter.post('/broadcasts', requireAuth, requireRole('ADMIN'), controller.sendBroadcast);
