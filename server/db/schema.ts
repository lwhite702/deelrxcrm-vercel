import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
