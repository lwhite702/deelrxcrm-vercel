import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireRole, AuthError } from '@/lib/auth/jwt';
import { generateEmailSubject } from '@/lib/ai/email';

const SubjectRequestSchema = z.object({
  purpose: z.string().min(1).max(500),
  audience: z.string().min(1).max(200),
  tone: z.enum(['professional', 'friendly', 'urgent', 'formal']).optional().default('professional'),
  keywords: z.array(z.string()).optional(),
  existingContent: z.string().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional().default(0.3),
    maxTokens: z.number().min(10).max(500).optional().default(100),
  }).optional().default({}),
});

/**
 * Handles the POST request to generate an email subject based on the provided data.
 *
 * This function enforces the 'superAdmin' role, parses and validates the request body,
 * and then generates an email subject using AI based on the validated data. It returns
 * a JSON response containing the result, user metadata, and a timestamp. In case of
 * errors, it handles authentication and validation errors appropriately.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response with the success status, generated data, and metadata.
 * @throws AuthError If the user does not have the required role.
 * @throws z.ZodError If the request data is invalid.
 */
export async function POST(request: NextRequest) {
  try {
    // Enforce superAdmin role
    const payload = await requireRole(request, 'superAdmin');
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = SubjectRequestSchema.parse(body);

    // Generate email subject using AI
    const result = await generateEmailSubject(
      {
        purpose: validatedData.purpose,
        audience: validatedData.audience,
        tone: validatedData.tone,
        keywords: validatedData.keywords,
        existingContent: validatedData.existingContent,
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
        model: process.env.VERCEL_AI_EMAIL_SUBJECT_MODEL || 'gpt-4o-mini',
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

    console.error('AI subject generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}