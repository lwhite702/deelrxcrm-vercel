/**
 * Knowledge Base Link Verifier Service
 * Periodically verifies that canonical URLs in kb-index.json are accessible
 * Phase 5 implementation for DeelRxCRM
 */

import fs from 'fs/promises';
import path from 'path';

interface KBIndexEntry {
  slug: string;
  title: string;
  canonical_url: string;
  last_verified_at: string;
}

interface KBTelemetry {
  broken_slug: string;
  canonical_url: string;
  error_type: 'timeout' | '404' | '500' | 'network_error' | 'other';
  error_message: string;
  referrer?: string;
  timestamp: string;
  status_code?: number;
}

class KBVerifierService {
  private kbIndexPath = path.join(process.cwd(), 'client/public/content/kb-index.json');
  private telemetryPath = path.join(process.cwd(), 'logs/kb-telemetry.log');
  private verificationInterval = 24 * 60 * 60 * 1000; // 24 hours
  private requestTimeout = 10000; // 10 seconds
  private verificationTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      const logsDir = path.dirname(this.telemetryPath);
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  /**
   * Load KB index from file
   */
  private async loadKBIndex(): Promise<KBIndexEntry[]> {
    try {
      const indexContent = await fs.readFile(this.kbIndexPath, 'utf-8');
      return JSON.parse(indexContent);
    } catch (error) {
      console.error('Failed to load KB index:', error);
      return [];
    }
  }

  /**
   * Save KB index with updated verification timestamps
   */
  private async saveKBIndex(entries: KBIndexEntry[]): Promise<void> {
    try {
      await fs.writeFile(this.kbIndexPath, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error('Failed to save KB index:', error);
    }
  }

  /**
   * Log telemetry data for broken KB links
   */
  private async logTelemetry(telemetry: KBTelemetry): Promise<void> {
    try {
      const logEntry = JSON.stringify(telemetry) + '\n';
      await fs.appendFile(this.telemetryPath, logEntry);
      console.warn(`KB Link Issue: ${telemetry.broken_slug} - ${telemetry.error_type}: ${telemetry.error_message}`);
    } catch (error) {
      console.error('Failed to log KB telemetry:', error);
    }
  }

  /**
   * Verify a single URL is accessible
   */
  private async verifyUrl(url: string): Promise<{ success: boolean; statusCode?: number; error?: string; errorType?: KBTelemetry['error_type'] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to avoid downloading content
        signal: controller.signal,
        headers: {
          'User-Agent': 'DeelRxCRM-KB-Verifier/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, statusCode: response.status };
      } else if (response.status === 404) {
        return { 
          success: false, 
          statusCode: response.status, 
          error: `URL returned ${response.status} ${response.statusText}`,
          errorType: '404'
        };
      } else if (response.status >= 500) {
        return { 
          success: false, 
          statusCode: response.status, 
          error: `Server error: ${response.status} ${response.statusText}`,
          errorType: '500'
        };
      } else {
        return { 
          success: false, 
          statusCode: response.status, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          errorType: 'other'
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Request timeout', 
          errorType: 'timeout' 
        };
      } else {
        return { 
          success: false, 
          error: error.message || 'Network error', 
          errorType: 'network_error' 
        };
      }
    }
  }

  /**
   * Verify all URLs in the KB index
   */
  public async verifyAllUrls(): Promise<{ verified: number; failed: number; errors: KBTelemetry[] }> {
    const entries = await this.loadKBIndex();
    let verified = 0;
    let failed = 0;
    const errors: KBTelemetry[] = [];

    console.log(`Starting KB verification for ${entries.length} entries...`);

    for (const entry of entries) {
      const result = await this.verifyUrl(entry.canonical_url);
      
      if (result.success) {
        // Update last verified timestamp
        entry.last_verified_at = new Date().toISOString();
        verified++;
        console.log(`✓ Verified: ${entry.slug}`);
      } else {
        failed++;
        const telemetry: KBTelemetry = {
          broken_slug: entry.slug,
          canonical_url: entry.canonical_url,
          error_type: result.errorType || 'other',
          error_message: result.error || 'Unknown error',
          timestamp: new Date().toISOString(),
          status_code: result.statusCode
        };
        
        errors.push(telemetry);
        await this.logTelemetry(telemetry);
      }

      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save updated KB index with verification timestamps
    await this.saveKBIndex(entries);

    console.log(`KB verification complete: ${verified} verified, ${failed} failed`);
    return { verified, failed, errors };
  }

  /**
   * Get verification status for a specific slug
   */
  public async getVerificationStatus(slug: string): Promise<KBIndexEntry | null> {
    const entries = await this.loadKBIndex();
    return entries.find(entry => entry.slug === slug) || null;
  }

  /**
   * Log a broken KB link access attempt (for telemetry)
   */
  public async logBrokenLinkAccess(slug: string, referrer?: string): Promise<void> {
    const entry = await this.getVerificationStatus(slug);
    
    if (entry) {
      const telemetry: KBTelemetry = {
        broken_slug: slug,
        canonical_url: entry.canonical_url,
        error_type: 'other',
        error_message: 'User attempted to access broken link',
        referrer,
        timestamp: new Date().toISOString()
      };
      
      await this.logTelemetry(telemetry);
    }
  }

  /**
   * Start periodic verification
   */
  public startPeriodicVerification(): void {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
    }

    // Run initial verification
    this.verifyAllUrls();

    // Set up periodic verification
    this.verificationTimer = setInterval(() => {
      this.verifyAllUrls();
    }, this.verificationInterval);

    console.log(`KB verifier started - will check URLs every ${this.verificationInterval / (60 * 60 * 1000)} hours`);
  }

  /**
   * Stop periodic verification
   */
  public stopPeriodicVerification(): void {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
      this.verificationTimer = null;
      console.log('KB verifier stopped');
    }
  }

  /**
   * Get recent telemetry data
   */
  public async getRecentTelemetry(limit: number = 100): Promise<KBTelemetry[]> {
    try {
      const content = await fs.readFile(this.telemetryPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const telemetryEntries = lines
        .slice(-limit) // Get last N entries
        .map(line => JSON.parse(line) as KBTelemetry)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return telemetryEntries;
    } catch (error) {
      console.error('Failed to read telemetry data:', error);
      return [];
    }
  }
}

// Create singleton instance
export const kbVerifier = new KBVerifierService();

// Export types for use elsewhere
export type { KBIndexEntry, KBTelemetry };