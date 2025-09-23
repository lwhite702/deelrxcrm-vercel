const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'STATSIG_SERVER_SECRET_KEY',
  'NEXT_PUBLIC_STATSIG_CLIENT_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'KNOCK_SECRET_KEY',
  'RESEND_API_KEY',
] as const;

/**
 * Validates the presence of required environment variables and exits if any are missing.
 */
export function validateRequiredEnvVars() {
  const missing: string[] = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nApplication cannot start without these environment variables.');
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');
}

/**
 * Checks for missing optional environment variables and logs a warning if any are not set.
 */
export function checkOptionalEnvVars() {
  const optional = [
    'BLOB_READ_WRITE_TOKEN',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'MEILISEARCH_URL',
    'MEILISEARCH_KEY',
    'POSTHOG_KEY',
  ];

  const missing = optional.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missing.forEach(envVar => console.warn(`  - ${envVar}`));
    console.warn('Some features may be disabled.\n');
  }
}