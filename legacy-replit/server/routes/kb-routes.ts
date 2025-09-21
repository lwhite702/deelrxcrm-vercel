/**
 * Knowledge Base Link Health and Telemetry Routes
 * Phase 5 implementation for DeelRxCRM KB system
 */

import { Router } from 'express';
import { z } from 'zod';
import { kbVerifier } from '../kb-verifier';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Schema for telemetry logging
const logBrokenLinkSchema = z.object({
  slug: z.string(),
  referrer: z.string().optional()
});

/**
 * GET /api/kb/health/status
 * Get overall KB link health status
 */
router.get('/health/status', isAuthenticated, async (req, res) => {
  try {
    const telemetry = await kbVerifier.getRecentTelemetry(50);
    
    // Aggregate statistics
    const last24h = telemetry.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
    );
    
    const errorsByType = last24h.reduce((acc, t) => {
      acc[t.error_type] = (acc[t.error_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brokenSlugs = Array.from(new Set(last24h.map(t => t.broken_slug)));

    res.json({
      health: {
        total_errors_24h: last24h.length,
        unique_broken_slugs: brokenSlugs.length,
        error_types: errorsByType,
        broken_slugs: brokenSlugs
      },
      last_check: telemetry[0]?.timestamp || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/kb/health/verify
 * Manually trigger KB link verification (Super Admin only)
 */
router.post('/health/verify', isAuthenticated, async (req, res) => {
  try {
    const result = await kbVerifier.verifyAllUrls();
    
    res.json({
      message: 'KB verification completed',
      verified: result.verified,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kb/health/telemetry
 * Get recent KB telemetry data (Super Admin only)
 */
router.get('/health/telemetry', isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const telemetry = await kbVerifier.getRecentTelemetry(limit);
    
    res.json({
      telemetry,
      count: telemetry.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/kb/health/log-broken-link
 * Log a broken KB link access attempt for telemetry
 */
router.post('/health/log-broken-link', isAuthenticated, async (req, res) => {
  try {
    const { slug, referrer } = logBrokenLinkSchema.parse(req.body);
    
    await kbVerifier.logBrokenLinkAccess(slug, referrer);
    
    res.json({ message: 'Broken link logged for telemetry' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kb/health/verification/:slug
 * Get verification status for a specific KB article slug
 */
router.get('/health/verification/:slug', isAuthenticated, async (req, res) => {
  try {
    const { slug } = req.params;
    const status = await kbVerifier.getVerificationStatus(slug);
    
    if (!status) {
      return res.status(404).json({ error: 'KB article slug not found in index' });
    }

    res.json({
      slug: status.slug,
      title: status.title,
      canonical_url: status.canonical_url,
      last_verified_at: status.last_verified_at,
      is_verified: new Date(status.last_verified_at).getTime() > Date.now() - (25 * 60 * 60 * 1000) // Within last 25 hours
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;