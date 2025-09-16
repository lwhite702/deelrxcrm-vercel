import { config as loadEnv } from 'dotenv';

loadEnv();

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: getEnv('NODE_ENV') ?? 'development',
  corsOrigin: getEnv('CORS_ORIGIN') ?? '*',
  databaseUrl: getEnv('DATABASE_URL')
};
