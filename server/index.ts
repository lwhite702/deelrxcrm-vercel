import { createApp } from './app';

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10) || 3000;

createApp().listen(PORT, () => {
  console.log(`[dev] http://localhost:${PORT}`);
});
