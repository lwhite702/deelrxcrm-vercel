import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Placeholder: integrate Clerk webhook verification once secret available.
// Events: organization.created, organization.updated, organization.deleted, organizationMembership.created, organizationMembership.deleted, organizationMembership.updated

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('svix-signature');
  if (!sig) {
    return new NextResponse('Missing signature', { status: 400 });
  }
  // TODO: verify signature with svix library using CLERK_WEBHOOK_SECRET.
  // For now just acknowledge to avoid retries during dev.
  try {
    // Parse minimal JSON if possible
    let json: any = null;
    try { json = JSON.parse(body); } catch {}
    // TODO: switch on json.type to sync tenants + tenant_members.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error', e);
    return new NextResponse('Webhook handling error', { status: 500 });
  }
}
