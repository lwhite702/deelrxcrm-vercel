import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { aliases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

/**
 * Handles the GET request to fetch user aliases.
 *
 * This function first retrieves the current user and checks if the user has the 'owner' role, which is required for access.
 * If the user is unauthorized, a 403 response is returned. If authorized, it queries the database for all aliases associated
 * with the user, including relevant user information, and returns the results along with the total count of aliases.
 * In case of an error during the process, a 500 response is returned with an error message.
 *
 * @param request - The incoming NextRequest object.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'owner') { // Assuming 'owner' is the superadmin role
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all aliases with user information
    const aliasRecords = await db
      .select({
        id: aliases.id,
        userId: aliases.userId,
        userEmail: users.email,
        alias: aliases.alias,
        aliasId: aliases.aliasId,
        active: aliases.active,
        note: aliases.note,
        deliveryStatus: aliases.deliveryStatus,
        bounceCount: aliases.bounceCount,
        createdAt: aliases.createdAt,
        deactivatedAt: aliases.deactivatedAt,
      })
      .from(aliases)
      .leftJoin(users, eq(aliases.userId, users.id))
      .orderBy(aliases.createdAt);

    return NextResponse.json({
      aliases: aliasRecords,
      totalCount: aliasRecords.length,
    });
  } catch (error) {
    console.error('Error fetching aliases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aliases' },
      { status: 500 }
    );
  }
}