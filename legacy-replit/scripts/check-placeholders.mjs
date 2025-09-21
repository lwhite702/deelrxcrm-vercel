#!/usr/bin/env node

/**
 * Placeholder Scanner - Phase 4 CI Tool
 * 
 * Scans codebase for placeholder strings that violate the "No Placeholder Policy".
 * This tool prevents hardcoded text from being merged without proper content map entries.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Placeholder patterns that should fail CI
const PLACEHOLDER_PATTERNS = [
  /(lorem|ipsum|tbd|placeholder|dummy|sample)/gi,
  /TODO:\s*replace/gi,
  /FIXME:\s*placeholder/gi,
  /\b(test|example)\s*(text|content|copy)\b/gi,
];

// File patterns to scan
const INCLUDE_PATTERNS = [
  /\.(ts|tsx|js|jsx)$/,
  /\.json$/,
];

// Only scan frontend UI source code directories
const INCLUDE_DIRECTORIES = [
  /^client\/src/,
  /^client\/index\.html$/,
];

// Directories and files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /build/,
  /dist/,
  /\.next/,
  /coverage/,
  /\.config/,
  /public/,
  /scripts\/check-placeholders\.mjs$/, // Don't scan this file itself
  /content-map\.json$/, // Content map can contain these words as legitimate content
  /package-lock\.json$/,
  /package\.json$/,
  /\.test\.(ts|tsx|js|jsx)$/, // Test files can have placeholders for testing
  /\.spec\.(ts|tsx|js|jsx)$/,
  /drizzle\.config\.ts$/,
  /vite\.config\.ts$/,
  /tailwind\.config\.ts$/,
  /tsconfig\.json$/,
];

async function scanDirectory(dirPath, violations = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Only include source code directories and skip excluded paths
    if (!INCLUDE_DIRECTORIES.some(pattern => pattern.test(relativePath)) || 
        EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      await scanDirectory(fullPath, violations);
    } else if (INCLUDE_PATTERNS.some(pattern => pattern.test(entry.name))) {
      await scanFile(fullPath, relativePath, violations);
    }
  }
  
  return violations;
}

async function scanFile(filePath, relativePath, violations) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      PLACEHOLDER_PATTERNS.forEach((pattern) => {
        const matches = [...line.matchAll(pattern)];
        
        matches.forEach((match) => {
          // Skip matches inside comments that are explaining the policy
          if (line.includes('No Placeholder Policy') || line.includes('placeholder strings')) {
            return;
          }
          
          violations.push({
            file: relativePath,
            line: lineIndex + 1,
            column: match.index + 1,
            text: match[0],
            context: line.trim(),
            pattern: pattern.source
          });
        });
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

function formatViolations(violations) {
  const output = [];
  
  output.push('');
  output.push('❌ PLACEHOLDER POLICY VIOLATION');
  output.push('');
  output.push('The "No Placeholder Policy" requires all UI text to come from the content map.');
  output.push('Found placeholder strings that must be replaced with content map references:');
  output.push('');
  
  // Group by file
  const byFile = violations.reduce((acc, violation) => {
    if (!acc[violation.file]) acc[violation.file] = [];
    acc[violation.file].push(violation);
    return acc;
  }, {});
  
  Object.entries(byFile).forEach(([file, fileViolations]) => {
    output.push(`📁 ${file}`);
    
    fileViolations.forEach(violation => {
      output.push(`   Line ${violation.line}:${violation.column} - "${violation.text}"`);
      output.push(`   Context: ${violation.context}`);
      output.push('');
    });
  });
  
  output.push('🔧 How to fix:');
  output.push('1. Add your text to client/src/content/content-map.json');
  output.push('2. Import and use getContent("path.to.content") from @/lib/content');
  output.push('3. Replace hardcoded strings with content map references');
  output.push('');
  output.push(`Total violations: ${violations.length}`);
  output.push('');
  
  return output.join('\n');
}

async function main() {
  console.log('🔍 Scanning for placeholder strings...');
  
  const projectRoot = path.resolve(__dirname, '..');
  const violations = await scanDirectory(projectRoot);
  
  if (violations.length > 0) {
    console.error(formatViolations(violations));
    process.exit(1);
  } else {
    console.log('✅ No placeholder violations found! Content map policy is being followed.');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Scanner failed:', error);
    process.exit(1);
  });
}

export { scanDirectory, scanFile, PLACEHOLDER_PATTERNS };