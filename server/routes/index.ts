import { type Express, Router } from 'express';

import { healthRouter } from './health';
import { uploadsRouter } from './uploads';

export function registerRoutes(app: Express): void {
  const router = Router();

  router.use('/health', healthRouter);
  router.use('/uploads', uploadsRouter);

  app.use('/api', router);
}
