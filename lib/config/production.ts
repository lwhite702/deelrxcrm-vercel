/**
 * Production Environment Configuration for DeelRx CRM
 * 
 * This file validates and manages production environment variables
 * and configurations required for deployment readiness.
 */

// Critical environment variables required for production
export const REQUIRED_PRODUCTION_ENV = {
  // Database
  DATABASE_URL: {
    required: true,
    description: 'Neon Postgres database URL with SSL',
    validation: (value: string) => {
      if (!value.includes('neon.tech') && !value.includes('postgres://')) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
      }
      if (!value.includes('sslmode=require')) {
        console.warn('DATABASE_URL should include sslmode=require for production');
      }
      return true;
    }
  },
  
  // Authentication
  NEXTAUTH_SECRET: {
    required: true,
    description: 'Secret for NextAuth.js sessions',
    validation: (value: string) => {
      if (value.length < 32) {
        throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
      }
      return true;
    }
  },
  
  NEXTAUTH_URL: {
    required: true,
    description: 'Canonical URL for the application',
    validation: (value: string) => {
      if (!value.startsWith('https://')) {
        throw new Error('NEXTAUTH_URL must use HTTPS in production');
      }
      return true;
    }
  },
  
  // Stripe (if payments enabled)
  STRIPE_SECRET_KEY: {
    required: false,
    description: 'Stripe secret key for payments',
    validation: (value: string) => {
      if (value && !value.startsWith('sk_')) {
        throw new Error('STRIPE_SECRET_KEY must start with sk_');
      }
      return true;
    }
  },
  
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    description: 'Stripe webhook secret for event verification',
    validation: (value: string) => {
      if (value && !value.startsWith('whsec_')) {
        throw new Error('STRIPE_WEBHOOK_SECRET must start with whsec_');
      }
      return true;
    }
  },
  
  // Email services
  RESEND_API_KEY: {
    required: false,
    description: 'Resend API key for email delivery',
    validation: (value: string) => {
      if (value && !value.startsWith('re_')) {
        throw new Error('RESEND_API_KEY must start with re_');
      }
      return true;
    }
  },
  
  // Vercel Blob (for file uploads)
  BLOB_READ_WRITE_TOKEN: {
    required: false,
    description: 'Vercel Blob token for file storage',
    validation: (value: string) => {
      if (value && value.length < 32) {
        throw new Error('BLOB_READ_WRITE_TOKEN appears to be invalid');
      }
      return true;
    }
  },
  
  // Feature flags
  STATSIG_SERVER_SECRET_KEY: {
    required: false,
    description: 'Statsig server secret for feature flags',
    validation: () => true
  },
  
  // AI services
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API key for AI features',
    validation: (value: string) => {
      if (value && !value.startsWith('sk-')) {
        throw new Error('OPENAI_API_KEY must start with sk-');
      }
      return true;
    }
  },
  
  ANTHROPIC_API_KEY: {
    required: false,
    description: 'Anthropic API key for Claude AI',
    validation: (value: string) => {
      if (value && !value.startsWith('sk-ant-')) {
        throw new Error('ANTHROPIC_API_KEY must start with sk-ant-');
      }
      return true;
    }
  }
} as const;

// Optional environment variables with defaults
export const OPTIONAL_PRODUCTION_ENV = {
  NODE_ENV: 'production',
  PORT: '3000',
  CORS_ORIGIN: 'https://deelrxcrm.app,https://www.deelrxcrm.app',
  LOG_LEVEL: 'info',
  RATE_LIMIT_MAX: '100',
  RATE_LIMIT_WINDOW: '15',
  SESSION_TIMEOUT: '24h',
  CACHE_TTL: '300'
} as const;

// Production-specific validations
export function validateProductionEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, config] of Object.entries(REQUIRED_PRODUCTION_ENV)) {
    const value = process.env[key];
    
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key} - ${config.description}`);
      continue;
    }
    
    if (value) {
      try {
        config.validation(value);
      } catch (error) {
        errors.push(`Invalid ${key}: ${(error as Error).message}`);
      }
    }
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to "production"');
  }

  // Check for development-only variables
  const devOnlyVars = ['NEXT_DEV', 'DEVELOPMENT', 'DEV_MODE'];
  for (const devVar of devOnlyVars) {
    if (process.env[devVar]) {
      warnings.push(`Development variable ${devVar} is set in production`);
    }
  }

  // Database connection validation
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sslmode=require')) {
    warnings.push('DATABASE_URL should include sslmode=require for production security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Environment configuration object
export const productionConfig = {
  // Database
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    ssl: process.env.NODE_ENV === 'production'
  },
  
  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || [],
    sessionTimeout: process.env.SESSION_TIMEOUT || '24h',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000
    }
  },
  
  // Caching
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'),
    redis: process.env.REDIS_URL
  },
  
  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: true,
    enableTracing: process.env.NODE_ENV === 'production'
  },
  
  // Features
  features: {
    enablePayments: !!process.env.STRIPE_SECRET_KEY,
    enableEmail: !!process.env.RESEND_API_KEY,
    enableFileUploads: !!process.env.BLOB_READ_WRITE_TOKEN,
    enableAI: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    enableFeatureFlags: !!process.env.STATSIG_SERVER_SECRET_KEY
  }
};

// Health check configuration
export const healthCheckConfig = {
  endpoints: [
    {
      name: 'database',
      check: async () => {
        // Database connection check would go here
        return true;
      }
    },
    {
      name: 'external_apis',
      check: async () => {
        // External API health checks would go here
        return true;
      }
    }
  ],
  timeout: 5000
};

export default {
  REQUIRED_PRODUCTION_ENV,
  OPTIONAL_PRODUCTION_ENV,
  validateProductionEnvironment,
  productionConfig,
  healthCheckConfig
};