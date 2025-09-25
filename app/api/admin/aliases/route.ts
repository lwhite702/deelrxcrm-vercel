import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { aliases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

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