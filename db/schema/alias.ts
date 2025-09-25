/**
 * Database schema for SimpleLogin alias management
 * 
 * This table tracks user aliases created via SimpleLogin integration,
 * allowing users to use privacy-focused email addresses while maintaining
 * access control and audit capabilities.
 */

import {
  integer,
  text,
  boolean,
  timestamp,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "../../lib/db/schema";

/**
 * Aliases table for tracking SimpleLogin email aliases
 */
export const aliases = pgTable("aliases", {
  id: serial("id").primaryKey(),
  
  // Link to the user who owns this alias
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // The actual alias email address (e.g., user123.alias@simplelogin.io)
  alias: varchar("alias", { length: 255 }).notNull().unique(),
  
  // SimpleLogin's internal ID for this alias (for API operations)
  aliasId: varchar("alias_id", { length: 100 }).notNull(),
  
  // Whether the alias is currently active/enabled
  active: boolean("active").notNull().default(true),
  
  // Optional note/description for the alias
  note: varchar("note", { length: 500 }),
  
  // Delivery health tracking
  lastDeliveryTest: timestamp("last_delivery_test"),
  deliveryStatus: varchar("delivery_status", { length: 20 }).default("unknown"), // "ok", "warning", "error", "unknown"
  
  // Bounce/complaint tracking
  bounceCount: integer("bounce_count").notNull().default(0),
  lastBounceAt: timestamp("last_bounce_at"),
  
  // Audit timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
});

/**
 * Email events table for tracking delivery issues with aliases
 * This helps us monitor alias health and automatically disable problematic ones
 */
export const aliasEmailEvents = pgTable("alias_email_events", {
  id: serial("id").primaryKey(),
  
  // Link to the alias that had the event
  aliasId: integer("alias_id")
    .notNull()
    .references(() => aliases.id, { onDelete: "cascade" }),
  
  // Event type from Resend webhook
  eventType: varchar("event_type", { length: 50 }).notNull(), // "bounce", "complaint", "delivery", etc.
  
  // Event details from webhook payload
  eventData: text("event_data"), // JSON string of webhook data
  
  // Email metadata
  messageId: varchar("message_id", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  
  // Processing status
  processed: boolean("processed").notNull().default(false),
  processingNotes: text("processing_notes"),
  
  // Timestamps
  eventTimestamp: timestamp("event_timestamp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports for use in application code
export type Alias = typeof aliases.$inferSelect;
export type NewAlias = typeof aliases.$inferInsert;
export type AliasEmailEvent = typeof aliasEmailEvents.$inferSelect;
export type NewAliasEmailEvent = typeof aliasEmailEvents.$inferInsert;

// Enum for delivery status (TypeScript enum for type safety)
export enum AliasDeliveryStatus {
  OK = "ok",
  WARNING = "warning", 
  ERROR = "error",
  UNKNOWN = "unknown"
}

// Enum for email event types
export enum AliasEmailEventType {
  BOUNCE = "bounce",
  COMPLAINT = "complaint", 
  DELIVERY = "delivery",
  OPEN = "open",
  CLICK = "click",
  UNSUBSCRIBE = "unsubscribe"
}