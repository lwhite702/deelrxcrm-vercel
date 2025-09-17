import serverless from 'serverless-http';

import { createApp } from '../server/app';

export const config = {
  runtime: 'nodejs'
};

const app = createApp();

export default serverless(app);
