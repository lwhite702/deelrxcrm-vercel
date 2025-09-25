#!/usr/bin/env tsx
/**
 * Comprehensive test runner for DeelRx CRM
 * 
 * This script runs all tests in the proper order and provides detailed reporting.
 * Run with: tsx tests/run-all-tests.ts
 */

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Security Audit',
    command: 'npm run security:audit',
    description: 'Check for security vulnerabilities and run security audit',
    required: true
  },
  {
    name: 'Type Checking',
    command: 'npm run typecheck',
    description: 'Validate TypeScript types across the codebase',
    required: true
  },
  {
    name: 'Linting',
    command: 'npm run lint',
    description: 'Check code style and potential issues',
    required: true
  },
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    description: 'Run unit tests for individual components and functions',
    required: true
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'Run integration tests for workflows and API endpoints',
    required: true
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    description: 'Verify that the application builds successfully',
    required: true
  }
];

interface TestResult {
  suite: TestSuite;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(`\n🧪 Running ${suite.name}...`);
  console.log(`   ${suite.description}`);
  
  const startTime = performance.now();
  
  try {
    const output = execSync(suite.command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    
    const duration = performance.now() - startTime;
    console.log(`   ✅ ${suite.name} passed (${Math.round(duration)}ms)`);
    
    return {
      suite,
      success: true,
      duration,
      output
    };
    
  } catch (error: any) {
    const duration = performance.now() - startTime;
    console.log(`   ❌ ${suite.name} failed (${Math.round(duration)}ms)`);
    
    return {
      suite,
      success: false,
      duration,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 DeelRx CRM - Comprehensive Test Suite');
  console.log('=' .repeat(50));
  
  const startTime = performance.now();
  const results: TestResult[] = [];
  
  // Run each test suite
  for (const suite of testSuites) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    // Stop on critical failures
    if (!result.success && suite.required) {
      console.log(`\n❌ Critical test failure in ${suite.name}. Stopping test run.`);
      break;
    }
  }
  
  // Generate summary report
  const totalDuration = performance.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTests = results.length;
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('=' .repeat(50));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Test Suites: ${totalTests}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ❌`);
  console.log(`   Success Rate: ${Math.round((passed / totalTests) * 100)}%`);
  console.log(`   Total Duration: ${Math.round(totalDuration / 1000)}s`);
  
  // Detailed results
  console.log(`\n📋 Detailed Results:`);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = Math.round(result.duration / 1000);
    console.log(`   ${status} ${result.suite.name} (${duration}s)`);
    
    if (!result.success && result.error) {
      console.log(`      Error: ${result.error.substring(0, 200)}...`);
    }
  });
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (failed === 0) {
    console.log('   🎉 All tests passed! Your code is ready for production.');
    console.log('   Consider running the manual QA checklist next.');
  } else {
    console.log('   🔧 Fix the failing tests before proceeding.');
    console.log('   Review the error messages above for specific issues.');
    
    const failedRequired = results.filter(r => !r.success && r.suite.required);
    if (failedRequired.length > 0) {
      console.log('   ⚠️  Critical failures detected - deployment blocked.');
    }
  }
  
  // Environment info
  console.log(`\n🌍 Environment Information:`);
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  
  console.log('\n' + '=' .repeat(50));
  
  // Exit with appropriate code
  const hasRequiredFailures = results.some(r => !r.success && r.suite.required);
  process.exit(hasRequiredFailures ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testSuites };