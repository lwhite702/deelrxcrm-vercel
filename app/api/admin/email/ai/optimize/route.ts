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

/**
 * Handles the POST request to optimize an email template.
 *
 * This function enforces the 'superAdmin' role, parses and validates the request body, and then optimizes the email template using AI. It constructs a response containing the optimization results along with metadata. If any errors occur during processing, it handles authentication and validation errors appropriately, returning relevant status codes and messages.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response with the optimization results and metadata.
 * @throws AuthError If the user does not have the required role.
 * @throws z.ZodError If the request data is invalid.
 */
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