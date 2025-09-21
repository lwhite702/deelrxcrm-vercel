import compression from 'compression';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { registerRoutes } from './routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const origins = env.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowAllOrigins = origins.includes('*');

  app.use(
    cors({
      origin: allowAllOrigins ? true : origins,
      credentials: true
    })
  );

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'production' ? 'tiny' : 'dev'));

  registerRoutes(app);

  // Serve static client when running in production or when explicitly requested.
  const shouldServeStatic = process.env.SERVE_STATIC === 'true' || env.nodeEnv === 'production';
  if (shouldServeStatic) {
    const staticDir = path.resolve(process.cwd(), 'dist', 'public');
    app.use(express.static(staticDir, { index: false }));

    // For any GET request not handled by API routes, serve index.html for SPA routing
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(staticDir, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const responseMessage = env.nodeEnv === 'production' ? 'Internal server error' : message;
    res.status(500).json({ error: responseMessage });
  });

  return app;
}
