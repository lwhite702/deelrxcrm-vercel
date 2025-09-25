import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireRole, AuthError } from '@/lib/auth/jwt';
import { generateEmailBody } from '@/lib/ai/email';

const BodyRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  audience: z.string().min(1).max(200),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual', 'urgent']),
  keyPoints: z.array(z.string()).min(1).max(10),
  callToAction: z.string().optional(),
  constraints: z.object({
    maxLength: z.number().min(100).max(10000).optional(),
    includeDisclaimer: z.boolean().optional().default(false),
    mustInclude: z.array(z.string()).optional(),
    mustAvoid: z.array(z.string()).optional(),
  }).optional().default({}),
  options: z.object({
    temperature: z.number().min(0).max(2).optional().default(0.4),
    maxTokens: z.number().min(100).max(3000).optional().default(2000),
  }).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    // Enforce superAdmin role
    const payload = await requireRole(request, 'superAdmin');
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = BodyRequestSchema.parse(body);

    // Generate email body using AI
    const result = await generateEmailBody(
      {
        subject: validatedData.subject,
        purpose: validatedData.purpose,
        audience: validatedData.audience,
        tone: validatedData.tone,
        keyPoints: validatedData.keyPoints,
        callToAction: validatedData.callToAction,
        constraints: validatedData.constraints,
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
        model: process.env.VERCEL_AI_EMAIL_BODY_MODEL || 'gpt-4o',
        safetyScore: result.safetyScore,
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

    console.error('AI body generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}