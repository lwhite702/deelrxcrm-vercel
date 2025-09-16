import serverless from 'serverless-http';

import { createApp } from '../server/app';

export const config = {
  runtime: 'nodejs18.x'
};

const app = createApp();

export default serverless(app);
