import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { aliases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { disableAlias as disableSimpleLoginAlias } from '@/lib/alias/simplelogin';

const disableAliasSchema = z.object({
  aliasId: z.string(),
});

/**
 * Handles the POST request to disable an alias.
 *
 * This function first verifies the user's role, ensuring only an 'owner' can proceed. It then parses the request body to extract the aliasId and checks if the alias exists and is active. If the alias is found, it attempts to disable it in SimpleLogin, while also updating the local database. Errors are caught and handled appropriately, returning relevant status codes and messages.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response indicating success or error details.
 * @throws Error If the request data is invalid or if an unexpected error occurs during processing.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'owner') { // Assuming 'owner' is the superadmin role
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { aliasId } = disableAliasSchema.parse(body);

    // Find the alias
    const [alias] = await db
      .select()
      .from(aliases)
      .where(eq(aliases.aliasId, aliasId))
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