import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { aliases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

/**
 * Handles the GET request to export user aliases as a CSV file.
 *
 * The function first retrieves the current user and checks if they have the 'owner' role. If not, it returns a 403 Unauthorized response.
 * It then fetches alias records from the database, constructs CSV content from these records, and returns it with appropriate headers for download.
 *
 * @param request - The NextRequest object representing the incoming request.
 * @returns A NextResponse object containing the CSV content and a 200 status if successful.
 * @throws Error If there is an issue during the process, a 500 status response is returned with an error message.
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

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'User ID',
      'User Email',
      'Alias',
      'Active',
      'Delivery Status',
      'Bounce Count',
      'Created At',
      'Deactivated At',
      'Note'
    ];

    const csvRows = aliasRecords.map(record => [
      record.id,
      record.userId,
      record.userEmail || '',
      record.alias,
      record.active ? 'Yes' : 'No',
      record.deliveryStatus || 'Unknown',
      record.bounceCount,
      record.createdAt.toISOString(),
      record.deactivatedAt ? record.deactivatedAt.toISOString() : '',
      record.note || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes if needed
            : field
        ).join(',')
      )
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="aliases-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting aliases:', error);
    return NextResponse.json(
      { error: 'Failed to export aliases' },
      { status: 500 }
    );
  }
}