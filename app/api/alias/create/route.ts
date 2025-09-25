import { NextRequest, NextResponse } from 'next/server';
import { createAlias } from '@/lib/alias/simplelogin';
import { z } from 'zod';

const createAliasSchema = z.object({
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { note } = createAliasSchema.parse(body);
    
    const result = await createAlias({ note });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating alias:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Failed to create alias';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}