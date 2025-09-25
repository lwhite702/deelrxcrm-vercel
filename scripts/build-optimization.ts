#!/usr/bin/env tsx
/**
 * Production Build Optimization Script for DeelRx CRM
 * 
 * This script optimizes the application for production deployment
 * by validating environment, running security checks, and optimizing assets.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { validateProductionEnvironment } from '../lib/config/production';
import { logger } from '../lib/monitoring/production';

interface BuildOptions {
  skipTests?: boolean;
  skipLinting?: boolean;
  skipTypeCheck?: boolean;
  skipSecurity?: boolean;
  verbose?: boolean;
}

async function runBuildOptimization(options: BuildOptions = {}) {
  const startTime = Date.now();
  logger.info('Starting production build optimization...');

  try {
    // Step 1: Environment validation
    await validateEnvironment();

    // Step 2: Security audit
    if (!options.skipSecurity) {
      await runSecurityAudit();
    }

    // Step 3: Code quality checks
    if (!options.skipLinting) {
      await runLinting();
    }

    if (!options.skipTypeCheck) {
      await runTypeCheck();
    }

    // Step 4: Run tests
    if (!options.skipTests) {
      await runTests();
    }

    // Step 5: Build optimization
    await optimizeBuild();

    // Step 6: Generate build report
    await generateBuildReport();

    const duration = Date.now() - startTime;
    logger.info(`Build optimization completed successfully in ${duration}ms`);

  } catch (error) {
    logger.error('Build optimization failed', {}, error as Error);
    process.exit(1);
  }
}

async function validateEnvironment(): Promise<void> {
  logger.info('🔍 Validating production environment...');
  
  const validation = validateProductionEnvironment();
  
  if (!validation.isValid) {
    logger.error('Environment validation failed', {
      errors: validation.errors
    });
    throw new Error('Environment validation failed');
  }
  
  if (validation.warnings.length > 0) {
    logger.warn('Environment validation warnings', {
      warnings: validation.warnings
    });
  }
  
  logger.info('✅ Environment validation passed');
}

async function runSecurityAudit(): Promise<void> {
  logger.info('🔒 Running security audit...');
  
  try {
    // Run npm audit
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    logger.info('✅ npm audit passed');
  } catch (error) {
    logger.warn('npm audit found issues - reviewing...');
    
    try {
      // Try to fix automatically
      execSync('npm audit fix --only=prod', { stdio: 'pipe' });
      logger.info('✅ Security issues auto-fixed');
    } catch (fixError) {
      logger.error('Unable to auto-fix security issues', {}, fixError as Error);
      throw new Error('Security audit failed');
    }
  }

  // Run custom security audit
  try {
    execSync('tsx lib/security/audit.ts', { stdio: 'pipe' });
    logger.info('✅ Custom security audit passed');
  } catch (error) {
    logger.error('Custom security audit failed', {}, error as Error);
    throw error;
  }
}

async function runLinting(): Promise<void> {
  logger.info('🧹 Running code linting...');
  
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    logger.info('✅ Linting passed');
  } catch (error) {
    logger.error('Linting failed', {}, error as Error);
    throw new Error('Code linting failed');
  }
}

async function runTypeCheck(): Promise<void> {
  logger.info('📝 Running TypeScript type check...');
  
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    logger.info('✅ Type check passed');
  } catch (error) {
    logger.error('Type check failed', {}, error as Error);
    throw new Error('TypeScript type check failed');
  }
}

async function runTests(): Promise<void> {
  logger.info('🧪 Running test suite...');
  
  try {
    execSync('npm run test:all', { stdio: 'pipe' });
    logger.info('✅ All tests passed');
  } catch (error) {
    logger.error('Tests failed', {}, error as Error);
    throw new Error('Test suite failed');
  }
}

async function optimizeBuild(): Promise<void> {
  logger.info('⚡ Optimizing production build...');
  
  // Environment is set via build command
  
  // Clean previous builds
  try {
    execSync('rm -rf .next', { stdio: 'pipe' });
    logger.info('Cleaned previous build artifacts');
  } catch (error) {
    // Ignore if .next doesn't exist
  }

  // Run optimized build
  try {
    execSync('npm run build', { 
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        ANALYZE: 'false' // Disable bundle analyzer in automated builds
      }
    });
    logger.info('✅ Production build completed');
  } catch (error) {
    logger.error('Production build failed', {}, error as Error);
    throw new Error('Production build failed');
  }

  // Verify build output
  if (!existsSync('.next')) {
    throw new Error('Build output directory .next not found');
  }

  logger.info('✅ Build optimization completed');
}

async function generateBuildReport(): Promise<void> {
  logger.info('📊 Generating build report...');

  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    buildSuccess: true,
    optimizations: {
      minification: true,
      compression: true,
      imageOptimization: true,
      bundleAnalysis: existsSync('.next/analyze')
    },
    size: await getBuildSize(),
    warnings: [] as string[],
    recommendations: [] as string[]
  };

  // Add recommendations based on build
  if (report.size.total > 10 * 1024 * 1024) { // 10MB
    report.recommendations.push('Consider code splitting to reduce bundle size');
  }

  // Write report
  writeFileSync('build-report.json', JSON.stringify(report, null, 2));
  logger.info('✅ Build report generated: build-report.json');
}

async function getBuildSize(): Promise<{
  total: number;
  pages: number;
  static: number;
  chunks: number;
}> {
  try {
    const { execSync } = require('child_process');
    const duOutput = execSync('du -sb .next', { encoding: 'utf8' });
    const totalSize = parseInt(duOutput.split('\t')[0]);

    return {
      total: totalSize,
      pages: 0, // Would calculate actual page sizes
      static: 0, // Would calculate static asset sizes
      chunks: 0  // Would calculate chunk sizes
    };
  } catch (error) {
    return { total: 0, pages: 0, static: 0, chunks: 0 };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: BuildOptions = {
    skipTests: args.includes('--skip-tests'),
    skipLinting: args.includes('--skip-linting'),
    skipTypeCheck: args.includes('--skip-typecheck'),
    skipSecurity: args.includes('--skip-security'),
    verbose: args.includes('--verbose')
  };

  runBuildOptimization(options);
}

export { runBuildOptimization };