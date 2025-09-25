import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { emailEvents, emails, emailStatusEnum } from '@/db/schema/email';

const statusByEvent: Record<
  string,
  (typeof emailStatusEnum.enumValues)[number]
> = {
  'email.queued': 'queued',
  'email.sending': 'sending',
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
};

function resolveOccurredAt(event: any): Date {
  const timestamp =
    event?.timestamp || event?.created_at || event?.data?.timestamp;
  return timestamp ? new Date(timestamp) : new Date();
}

function resolveEmailId(event: any): string | null {
  return (
    event?.email_id ||
    event?.data?.email_id ||
    event?.data?.emailId ||
    event?.data?.message?.email_id ||
    null
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', details: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }

  const events = Array.isArray(payload) ? payload : [payload];

  if (events.length === 0) {
    return NextResponse.json({ received: 0 });
  }

  let processed = 0;

  await db.transaction(async (tx) => {
    for (const rawEvent of events) {
      const event = rawEvent as Record<string, any>;
      const type = event?.type || event?.event;
      const emailId = resolveEmailId(event);

      if (!type || !emailId) {
        continue;
      }

      const occurredAt = resolveOccurredAt(event);
      const providerEventId =
        event?.id || event?.data?.id || event?.data?.event_id || null;

      try {
        await tx
          .insert(emailEvents)
          .values({
            emailId,
            eventType: type,
            providerEventId,
            payload: event,
            occurredAt,
          })
          .onConflictDoNothing({ target: emailEvents.providerEventId });
      } catch (error) {
        console.error('Failed to store email event', error);
        continue;
      }

      const status = statusByEvent[type];

      if (status) {
        try {
          const updatePayload: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
          };

          if (status === 'sent') {
            updatePayload.sentAt = occurredAt;
          } else if (status === 'delivered') {
            updatePayload.deliveredAt = occurredAt;
          } else if (status === 'opened') {
            updatePayload.openedAt = occurredAt;
          }

          await tx
            .update(emails)
            .set(updatePayload)
            .where(eq(emails.id, emailId));
        } catch (error) {
          console.error('Failed to update email status from webhook', error);
        }
      }

      processed += 1;
    }
  });

  return NextResponse.json({ received: events.length, processed });
}
