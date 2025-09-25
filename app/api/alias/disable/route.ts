import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { aliases } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { disableAlias as disableSimpleLoginAlias } from '@/lib/alias/simplelogin';

const disableAliasSchema = z.object({
  aliasId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { aliasId } = disableAliasSchema.parse(body);

    // Find the alias belonging to this user
    const [alias] = await db
      .select()
      .from(aliases)
      .where(
        and(
          eq(aliases.aliasId, aliasId),
          eq(aliases.userId, user.id)
        )
      )
      .limit(1);

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias not found' },
        { status: 404 }
      );
    }

    if (!alias.active) {
      return NextResponse.json(
        { error: 'Alias is already disabled' },
        { status: 400 }
      );
    }

    // Disable the alias in SimpleLogin
    try {
      if (aliasId !== 'client-generated') {
        await disableSimpleLoginAlias({ aliasId });
      }
    } catch (simpleLoginError) {
      console.error('Failed to disable alias in SimpleLogin:', simpleLoginError);
      // Continue with local disable even if SimpleLogin fails
    }

    // Update local database
    await db
      .update(aliases)
      .set({
        active: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aliases.id, alias.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling alias:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Failed to disable alias';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}