const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'KNOCK_API_KEY',
  'STATSIG_SERVER_SECRET_KEY',
  'NEXT_PUBLIC_STATSIG_CLIENT_KEY',
] as const;

const PRODUCTION_REQUIRED_ENV_VARS = [
  ...REQUIRED_ENV_VARS,
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'DATA_ENCRYPTION_KEY',
] as const;

const OPTIONAL_ENV_VARS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY',
  'SIMPLELOGIN_API_KEY',
  'BLOB_READ_WRITE_TOKEN',
] as const;

/**
 * Validates the presence of required environment variables and exits if any are missing.
 */
export function validateRequiredEnvVars() {
  const missing: string[] = [];
  const envVarsToCheck = process.env.NODE_ENV === 'production' 
    ? PRODUCTION_REQUIRED_ENV_VARS 
    : REQUIRED_ENV_VARS;
  
  for (const envVar of envVarsToCheck) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Additional production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Check JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      missing.push('JWT_SECRET (must be at least 32 characters in production)');
    }
    
    // Check database pooling
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pooler')) {
      console.warn('⚠️  DATABASE_URL should use Neon pooled connection in production');
    }
    
    // Check encryption key
    if (process.env.DATA_ENCRYPTION_KEY && process.env.DATA_ENCRYPTION_KEY.length < 32) {
      missing.push('DATA_ENCRYPTION_KEY (must be at least 32 characters)');
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
  const missing: string[] = [];
  
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missing.forEach(envVar => console.warn(`  - ${envVar}`));
    console.warn('Some features may be disabled.\n');
  }
}