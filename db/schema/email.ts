import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const emailStatusEnum = pgEnum('email_status', [
  'queued',
  'sending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'complained',
]);

export const broadcastStatusEnum = pgEnum('broadcast_status', [
  'draft',
  'scheduled',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const broadcasts = pgTable(
  'broadcasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    template: varchar('template', { length: 128 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    from: text('from').notNull(),
    replyTo: text('reply_to'),
    tenantId: text('tenant_id'),
    filters: jsonb('filters'),
    payload: jsonb('payload'),
    metadata: jsonb('metadata'),
    status: broadcastStatusEnum('status').notNull().default('draft'),
    scheduledFor: timestamp('scheduled_for'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (broadcast) => ({
    tenantIdx: index('broadcasts_tenant_idx').on(broadcast.tenantId),
    statusIdx: index('broadcasts_status_idx').on(broadcast.status),
    scheduledIdx: index('broadcasts_scheduled_idx').on(broadcast.scheduledFor),
  })
);

export const emails = pgTable(
  'emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    template: varchar('template', { length: 128 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    to: text('to').notNull(),
    from: text('from').notNull(),
    cc: text('cc'),
    bcc: text('bcc'),
    replyTo: text('reply_to'),
    tenantId: text('tenant_id'),
    broadcastId: uuid('broadcast_id').references(() => broadcasts.id, {
      onDelete: 'set null',
    }),
    payload: jsonb('payload'),
    metadata: jsonb('metadata'),
    status: emailStatusEnum('status').notNull().default('queued'),
    providerId: text('provider_id'),
    error: text('error'),
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    openedAt: timestamp('opened_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (email) => ({
    tenantIdx: index('emails_tenant_idx').on(email.tenantId),
    templateIdx: index('emails_template_idx').on(email.template),
    broadcastIdx: index('emails_broadcast_idx').on(email.broadcastId),
    providerIdx: uniqueIndex('emails_provider_idx').on(email.providerId),
  })
);

export const emailEvents = pgTable(
  'email_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    providerEventId: text('provider_event_id'),
    payload: jsonb('payload'),
    occurredAt: timestamp('occurred_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (event) => ({
    emailIdx: index('email_events_email_idx').on(event.emailId),
    eventTypeIdx: index('email_events_type_idx').on(event.eventType),
    providerEventIdx: uniqueIndex('email_events_provider_idx').on(
      event.providerEventId
    ),
  })
);

export const broadcastRecipients = pgTable(
  'broadcast_recipients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broadcastId: uuid('broadcast_id')
      .notNull()
      .references(() => broadcasts.id, { onDelete: 'cascade' }),
    emailId: uuid('email_id').references(() => emails.id, {
      onDelete: 'set null',
    }),
    email: text('email').notNull(),
    name: text('name'),
    status: emailStatusEnum('status').notNull().default('queued'),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (recipient) => ({
    broadcastIdx: index('broadcast_recipients_broadcast_idx').on(
      recipient.broadcastId
    ),
    statusIdx: index('broadcast_recipients_status_idx').on(recipient.status),
  })
);

export const broadcastsRelations = relations(broadcasts, ({ many }) => ({
  emails: many(emails),
  recipients: many(broadcastRecipients),
}));

export const emailsRelations = relations(emails, ({ many, one }) => ({
  events: many(emailEvents),
  broadcast: one(broadcasts, {
    fields: [emails.broadcastId],
    references: [broadcasts.id],
  }),
  recipients: many(broadcastRecipients),
}));

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  email: one(emails, {
    fields: [emailEvents.emailId],
    references: [emails.id],
  }),
}));

export const broadcastRecipientsRelations = relations(
  broadcastRecipients,
  ({ one }) => ({
    broadcast: one(broadcasts, {
      fields: [broadcastRecipients.broadcastId],
      references: [broadcasts.id],
    }),
    email: one(emails, {
      fields: [broadcastRecipients.emailId],
      references: [emails.id],
    }),
  })
);

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;
export type Broadcast = typeof broadcasts.$inferSelect;
export type NewBroadcast = typeof broadcasts.$inferInsert;
export type BroadcastRecipient = typeof broadcastRecipients.$inferSelect;
export type NewBroadcastRecipient = typeof broadcastRecipients.$inferInsert;
