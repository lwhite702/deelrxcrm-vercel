import { NextRequest } from 'next/server';
import { GET as healthCheck } from '@/lib/monitoring/ai-email';

export { healthCheck as GET };