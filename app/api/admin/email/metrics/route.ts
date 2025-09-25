import { NextRequest } from 'next/server';
import { getEmailAiMetrics } from '@/lib/monitoring/ai-email';

/**
 * Handles GET requests and retrieves email AI metrics.
 */
export async function GET(request: NextRequest) {
  return await getEmailAiMetrics(request);
}