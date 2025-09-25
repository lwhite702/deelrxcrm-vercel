import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireRole, AuthError } from '@/lib/auth/jwt';
import { optimizeEmailTemplate } from '@/lib/ai/email';

const OptimizeRequestSchema = z.object({
  html: z.string().min(1),
  text: z.string().optional(),
  purpose: z.string().min(1).max(500),
  targetMetrics: z.object({
    openRate: z.number().min(0).max(100).optional(),
    clickRate: z.number().min(0).max(100).optional(),
    conversionRate: z.number().min(0).max(100).optional(),
  }).optional().default({}),
  options: z.object({
    temperature: z.number().min(0).max(2).optional().default(0.2),
    maxTokens: z.number().min(500).max(3000).optional().default(1500),
  }).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    // Enforce superAdmin role
    const payload = await requireRole(request, 'superAdmin');
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = OptimizeRequestSchema.parse(body);

    // Optimize email template using AI
    const result = await optimizeEmailTemplate(
      {
        html: validatedData.html,
        text: validatedData.text,
        purpose: validatedData.purpose,
        targetMetrics: validatedData.targetMetrics,
      },
      {
        teamId: (payload as any).teamId || 1, // Default team if not specified
        userId: parseInt(payload.sub),
        temperature: validatedData.options.temperature,
        maxTokens: validatedData.options.maxTokens,
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        userId: payload.sub,
        timestamp: new Date().toISOString(),
        model: process.env.VERCEL_AI_EMAIL_TEMPLATE_MODEL || 'gpt-4o-mini',
        originalLength: validatedData.html.length,
        optimizedLength: result.template.length,
      },
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('AI template optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}