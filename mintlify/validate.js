#!/usr/bin/env node

/**
 * Mintlify Documentation Validation Script
 * 
 * Validates the Mintlify documentation structure, checks for missing files,
 * and ensures all referenced pages exist.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

class MintlifyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const colorMap = {
      error: colors.red,
      warn: colors.yellow,
      info: colors.blue,
      success: colors.green
    };
    
    const color = colorMap[level] || colors.reset;
    console.log(`${color}${colors.bold}[${level.toUpperCase()}]${colors.reset} ${color}${message}${colors.reset}`);
    
    if (level === 'error') this.errors.push(message);
    if (level === 'warn') this.warnings.push(message);
    if (level === 'info') this.info.push(message);
  }

  validateMintConfig() {
    this.log('info', 'Validating mint.json configuration...');
    
    if (!fs.existsSync('mint.json')) {
      this.log('error', 'mint.json not found');
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync('mint.json', 'utf8'));
      
      // Check required fields
      const requiredFields = ['name', 'navigation'];
      for (const field of requiredFields) {
        if (!config[field]) {
          this.log('error', `Missing required field in mint.json: ${field}`);
        }
      }

      // Validate navigation structure
      if (config.navigation && Array.isArray(config.navigation)) {
        this.validateNavigation(config.navigation);
      } else {
        this.log('error', 'Invalid navigation structure in mint.json');
      }

      // Check optional but recommended fields
      const recommendedFields = ['logo', 'colors', 'favicon'];
      for (const field of recommendedFields) {
        if (!config[field]) {
          this.log('warn', `Missing recommended field in mint.json: ${field}`);
        }
      }

      this.log('success', 'mint.json structure is valid');
      return true;
    } catch (error) {
      this.log('error', `Failed to parse mint.json: ${error.message}`);
      return false;
    }
  }

  validateNavigation(navigation) {
    this.log('info', 'Validating navigation structure...');
    
    for (const section of navigation) {
      if (!section.group) {
        this.log('warn', 'Navigation section missing group name');
        continue;
      }

      if (!section.pages || !Array.isArray(section.pages)) {
        this.log('warn', `Navigation section "${section.group}" has no pages`);
        continue;
      }

      this.validatePages(section.pages, section.group);
    }
  }

  validatePages(pages, groupName) {
    for (const page of pages) {
      if (typeof page === 'string') {
        this.validatePageFile(page, groupName);
      } else if (typeof page === 'object' && page.group && page.pages) {
        // Nested group
        this.validatePages(page.pages, `${groupName}/${page.group}`);
      } else {
        this.log('warn', `Invalid page structure in group "${groupName}": ${JSON.stringify(page)}`);
      }
    }
  }

  validatePageFile(pagePath, groupName) {
    // Try both with and without .mdx extension
    const possiblePaths = [
      `${pagePath}.mdx`,
      `${pagePath}.md`,
      pagePath.endsWith('.mdx') ? pagePath : null,
      pagePath.endsWith('.md') ? pagePath : null
    ].filter(Boolean);

    let fileExists = false;
    let actualPath = null;

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        fileExists = true;
        actualPath = testPath;
        break;
      }
    }

    if (!fileExists) {
      this.log('error', `Missing file for page "${pagePath}" in group "${groupName}". Tried: ${possiblePaths.join(', ')}`);
    } else {
      this.validatePageContent(actualPath, pagePath);
    }
  }

  validatePageContent(filePath, pagePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for frontmatter
      if (!content.startsWith('---')) {
        this.log('warn', `File "${filePath}" is missing frontmatter`);
      } else {
        // Basic frontmatter validation
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd === -1) {
          this.log('warn', `File "${filePath}" has malformed frontmatter`);
        } else {
          const frontmatter = content.substring(3, frontmatterEnd);
          if (!frontmatter.includes('title:')) {
            this.log('warn', `File "${filePath}" is missing title in frontmatter`);
          }
        }
      }

      // Check for basic content
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---/, '').trim();
      if (contentWithoutFrontmatter.length < 50) {
        this.log('warn', `File "${filePath}" appears to have minimal content`);
      }

    } catch (error) {
      this.log('error', `Failed to read file "${filePath}": ${error.message}`);
    }
  }

  validateAssets() {
    this.log('info', 'Validating assets...');
    
    try {
      const config = JSON.parse(fs.readFileSync('mint.json', 'utf8'));
      
      // Check logo files
      if (config.logo) {
        if (config.logo.dark && !fs.existsSync(config.logo.dark.replace('/', ''))) {
          this.log('warn', `Dark logo file not found: ${config.logo.dark}`);
        }
        if (config.logo.light && !fs.existsSync(config.logo.light.replace('/', ''))) {
          this.log('warn', `Light logo file not found: ${config.logo.light}`);
        }
      }

      // Check favicon
      if (config.favicon && !fs.existsSync(config.favicon.replace('/', ''))) {
        this.log('warn', `Favicon file not found: ${config.favicon}`);
      }

    } catch (error) {
      this.log('error', `Failed to validate assets: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}${colors.blue}MINTLIFY VALIDATION REPORT${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`\n${colors.green}✓ Info: ${this.info.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}✗ Errors: ${this.errors.length}${colors.reset}`);

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bold}ERRORS:${colors.reset}`);
      this.errors.forEach(error => console.log(`  ${colors.red}• ${error}${colors.reset}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}WARNINGS:${colors.reset}`);
      this.warnings.forEach(warning => console.log(`  ${colors.yellow}• ${warning}${colors.reset}`));
    }

    const success = this.errors.length === 0;
    console.log(`\n${colors.bold}${success ? colors.green : colors.red}VALIDATION ${success ? 'PASSED' : 'FAILED'}${colors.reset}\n`);
    
    return success;
  }

  validate() {
    this.log('info', 'Starting Mintlify documentation validation...');
    
    this.validateMintConfig();
    this.validateAssets();
    
    return this.generateReport();
  }
}

// Run validation
const validator = new MintlifyValidator();
const success = validator.validate();

process.exit(success ? 0 : 1);