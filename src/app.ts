import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env.ts';
import { router } from './routes/index.ts';
import { errorHandler, notFoundHandler } from './middleware/error-handler.ts';
import path from 'path';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // The OAuth round-trip parks its state/nonce/PKCE verifier in an httpOnly
  // cookie; the callback can't read it without this.
  app.use(cookieParser());
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  app.use('/api/v1', router);

  // Serve Frontend Static Files in Production
  if (isProduction) {
    const frontendPath = process.env.FRONTEND_BUILD_PATH || '../placement.gujaratuniversity.ac.in/dist';
    const resolvedPath = path.resolve(frontendPath);
    
    app.use(express.static(resolvedPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.resolve(resolvedPath, 'index.html'));
    });
  } else {
    app.use(notFoundHandler);
  }

  app.use(errorHandler);

  return app;
}
