import { NextRequest, NextResponse } from 'next/server';

import { AuthError, requireRole } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'superAdmin');
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    // Ignore JSON errors for stub implementation
  }

  return NextResponse.json({
    status: 'pending',
    message: 'Broadcast orchestration coming soon.',
    payload,
  });
}
