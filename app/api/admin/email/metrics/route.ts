import { NextRequest } from 'next/server';
import { getEmailAiMetrics } from '@/lib/monitoring/ai-email';

export async function GET(request: NextRequest) {
  return await getEmailAiMetrics(request);
}