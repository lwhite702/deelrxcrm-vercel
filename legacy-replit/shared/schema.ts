import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const userRoleEnum = pgEnum("user_role", ["super_admin", "owner", "manager", "staff"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "trial"]);
export const productTypeEnum = pgEnum("product_type", ["solid", "liquid", "other"]);
export const productUnitEnum = pgEnum("product_unit", ["g", "ml", "count"]);
export const adjustmentReasonEnum = pgEnum("adjustment_reason", ["waste", "sample", "personal", "recount"]);
export const fulfillmentMethodEnum = pgEnum("fulfillment_method", ["pickup", "delivery"]);
export const orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "paid", "voided"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["pickup", "manual_courier"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["requested", "picked_up", "delivered", "canceled"]);
export const loyaltyTierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold", "platinum"]);
export const creditStatusEnum = pgEnum("credit_status", ["active", "suspended", "frozen"]);
export const creditTransactionStatusEnum = pgEnum("credit_transaction_status", ["pending", "paid", "overdue"]);
export const customerStatusEnum = pgEnum("customer_status", ["new", "active", "past_due", "closed"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "completed", "expired"]);
export const paymentModeEnum = pgEnum("payment_mode", ["platform", "connect_standard", "connect_express"]);
export const paymentMethodEnum = pgEnum("payment_method", ["card", "cash", "custom", "transfer", "ach"]);
export const kbCategoryEnum = pgEnum("kb_category", ["getting_started", "features", "troubleshooting", "billing", "api", "integrations", "other"]);
export const keyStatusEnum = pgEnum("key_status", ["active", "revoked"]);
export const selfDestructStatusEnum = pgEnum("self_destruct_status", ["armed", "disarmed", "destroyed"]);
export const purgeStatusEnum = pgEnum("purge_status", ["pending", "running", "finished", "failed", "canceled"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "arm_self_destruct", "disarm_self_destruct", "destroy_self_destruct", "sweeper_destroy", "request_purge", "ack_export", "schedule_purge", "cancel_purge", "start_purge", "complete_purge", "fail_purge", "inactivity_warn", "inactivity_arm", "inactivity_delete", "inactivity_restore", "inactivity_snooze"]);

// LLM Intelligence Enums
export const llmProviderEnum = pgEnum("llm_provider", ["openai", "anthropic", "gemini", "xai"]);
export const llmIntelligenceTypeEnum = pgEnum("llm_intelligence_type", ["pricing", "credit_analysis", "data_entry", "data_cleaning", "training"]);
export const llmConfidenceEnum = pgEnum("llm_confidence", ["low", "medium", "high"]);
export const llmStatusEnum = pgEnum("llm_status", ["pending", "processing", "completed", "error", "human_override"]);
export const creditRiskEnum = pgEnum("credit_risk", ["low", "medium", "high", "critical"]);
export const sentimentEnum = pgEnum("sentiment", ["very_negative", "negative", "neutral", "positive", "very_positive"]);

// Inactivity Policy System Enums
export const inactivityTargetEnum = pgEnum("inactivity_target", ["all", "customers", "products", "orders", "payments", "deliveries", "loyalty_accounts", "credits"]);
export const inactivityStageEnum = pgEnum("inactivity_stage", ["active", "warned", "armed", "deleted"]);
export const inactivityActionEnum = pgEnum("inactivity_action", ["warn", "arm", "delete"]);

// Tenants
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  status: tenantStatusEnum("status").notNull().default("trial"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tenants_status").on(table.status),
]);

// Tenant Keys for envelope encryption
export const tenantKeys = pgTable("tenant_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  keyVersion: integer("key_version").notNull().default(1),
  wrappedKey: varchar("wrapped_key", { length: 2048 }).notNull(), // Base64 encoded encrypted data key
  status: keyStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("idx_tenant_keys_tenant").on(table.tenantId),
  index("idx_tenant_keys_status").on(table.status),
  index("idx_tenant_keys_version").on(table.keyVersion),
]);

// Users-Tenants junction table
export const usersTenants = pgTable("users_tenants", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_users_tenants_user").on(table.userId),
  index("idx_users_tenants_tenant").on(table.tenantId),
]);

// Feature Flags
export const featureFlags = pgTable("feature_flags", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
  defaultEnabled: boolean("default_enabled").notNull().default(true),
});

export const featureFlagOverrides = pgTable("feature_flag_overrides", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  flagKey: varchar("flag_key", { length: 100 }).notNull(),
  enabled: boolean("enabled").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_feature_overrides_tenant").on(table.tenantId),
  index("idx_feature_overrides_flag").on(table.flagKey),
]);

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  ndcCode: varchar("ndc_code", { length: 20 }),
  type: productTypeEnum("type").notNull().default("solid"),
  unit: productUnitEnum("unit").notNull().default("count"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_products_tenant").on(table.tenantId),
  index("idx_products_ndc").on(table.ndcCode),
]);

// Batches
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquired_at").notNull(),
  supplier: varchar("supplier", { length: 255 }),
  qtyAcquired: integer("qty_acquired").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_batches_tenant").on(table.tenantId),
  index("idx_batches_product").on(table.productId),
]);

// Inventory Lots
export const inventoryLots = pgTable("inventory_lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  batchId: varchar("batch_id").notNull().references(() => batches.id, { onDelete: "cascade" }),
  qtyRemaining: integer("qty_remaining").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_inventory_lots_tenant").on(table.tenantId),
  index("idx_inventory_lots_product").on(table.productId),
  index("idx_inventory_lots_batch").on(table.batchId),
]);

// Adjustments
export const adjustments = pgTable("adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  qtyDelta: integer("qty_delta").notNull(),
  reason: adjustmentReasonEnum("reason").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_adjustments_tenant").on(table.tenantId),
  index("idx_adjustments_product").on(table.productId),
]);

// Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  status: customerStatusEnum("status").notNull().default("new"),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow(),
  preferredFulfillment: fulfillmentMethodEnum("preferred_fulfillment").default("pickup"),
  preferredPayment: varchar("preferred_payment", { length: 50 }),
  notes: text("notes"),
  // Encrypted fields for dual-write approach
  nameEnc: jsonb("name_enc"), // Encrypted name
  phoneEnc: jsonb("phone_enc"), // Encrypted phone
  emailEnc: jsonb("email_enc"), // Encrypted email
  notesEnc: jsonb("notes_enc"), // Encrypted notes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customers_tenant").on(table.tenantId),
  index("idx_customers_email").on(table.email),
  index("idx_customers_phone").on(table.phone),
  index("idx_customers_status").on(table.status),
  index("idx_customers_status_updated").on(table.statusUpdatedAt),
]);

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => customers.id),
  status: orderStatusEnum("status").notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentNotes: text("payment_notes"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentIntentId: varchar("payment_intent_id"),
  chargeId: varchar("charge_id"),
  transferId: varchar("transfer_id"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_orders_tenant").on(table.tenantId),
  index("idx_orders_customer").on(table.customerId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_created").on(table.createdAt),
]);

// Order Items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  batchId: varchar("batch_id").references(() => batches.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCostSnapshot: decimal("unit_cost_snapshot", { precision: 10, scale: 2 }),
}, (table) => [
  index("idx_order_items_order").on(table.orderId),
  index("idx_order_items_product").on(table.productId),
]);

// Deliveries
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: deliveryMethodEnum("method").notNull(),
  addressLine1: varchar("address_line1", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 50 }).default("US"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lon: decimal("lon", { precision: 10, scale: 7 }),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  status: deliveryStatusEnum("status").notNull().default("requested"),
  // Encrypted fields for dual-write approach
  addressLine1Enc: jsonb("address_line1_enc"), // Encrypted address
  cityEnc: jsonb("city_enc"), // Encrypted city
  stateEnc: jsonb("state_enc"), // Encrypted state
  postalCodeEnc: jsonb("postal_code_enc"), // Encrypted postal code
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_deliveries_tenant").on(table.tenantId),
  index("idx_deliveries_order").on(table.orderId),
  index("idx_deliveries_status").on(table.status),
]);

// Loyalty Accounts
export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
  tier: loyaltyTierEnum("tier").notNull().default("bronze"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_loyalty_tenant").on(table.tenantId),
  index("idx_loyalty_customer").on(table.customerId),
]);

// Loyalty Events
export const loyaltyEvents = pgTable("loyalty_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id),
  pointsDelta: integer("points_delta").notNull(),
  reason: varchar("reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loyalty_events_tenant").on(table.tenantId),
  index("idx_loyalty_events_customer").on(table.customerId),
]);

// Credits
export const credits = pgTable("credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  status: creditStatusEnum("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_credits_tenant").on(table.tenantId),
  index("idx_credits_customer").on(table.customerId),
]);

// Credit Transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: creditTransactionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_credit_transactions_tenant").on(table.tenantId),
  index("idx_credit_transactions_customer").on(table.customerId),
  index("idx_credit_transactions_due").on(table.dueDate),
]);

// Tenant Settings
export const settingsTenant = pgTable("settings_tenant", {
  tenantId: varchar("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  targetMargin: decimal("target_margin", { precision: 5, scale: 4 }).default("0.3000"),
  minStockThreshold: integer("min_stock_threshold").default(10),
  exposureCap: decimal("exposure_cap", { precision: 10, scale: 2 }).default("10000.00"),
  deliveryMethodsEnabled: text("delivery_methods_enabled").default("pickup,manual_courier"),
  leadTimeDays: integer("lead_time_days").default(7),
  safetyDays: integer("safety_days").default(3),
  cityProfile: jsonb("city_profile"),
  paymentMode: paymentModeEnum("payment_mode").default("platform"),
  applicationFeeBps: integer("application_fee_bps").default(0),
  defaultCurrency: varchar("default_currency", { length: 3 }).default("usd"),
  stripeAccountId: varchar("stripe_account_id"),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  method: paymentMethodEnum("method").notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  chargeId: varchar("charge_id"),
  transferId: varchar("transfer_id"),
  refundId: varchar("refund_id"),
  failureReason: varchar("failure_reason"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  applicationFeeBps: integer("application_fee_bps").default(0),
  processingFeeCents: integer("processing_fee_cents").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payments_tenant").on(table.tenantId),
  index("idx_payments_order").on(table.orderId),
  index("idx_payments_customer").on(table.customerId),
  index("idx_payments_status").on(table.status),
  index("idx_payments_created").on(table.createdAt),
  index("idx_payments_intent").on(table.paymentIntentId),
]);

// Customer Referrals
export const customerReferrals = pgTable("customer_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  referrerId: varchar("referrer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  status: referralStatusEnum("status").notNull().default("pending"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
  rewardPaidDate: timestamp("reward_paid_date"),
  completedAt: timestamp("completed_at"), // When referred customer becomes active
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referrals_tenant").on(table.tenantId),
  index("idx_referrals_referrer").on(table.referrerId),
  index("idx_referrals_referred").on(table.referredId),
  index("idx_referrals_status").on(table.status),
  index("idx_referrals_completed").on(table.completedAt),
  unique("unique_referral").on(table.tenantId, table.referrerId, table.referredId), // Prevent duplicate referrals
]);

// Webhook Events (for idempotency tracking)
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().unique(), // Stripe event ID for idempotency
  eventType: varchar("event_type").notNull(),
  processed: boolean("processed").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_webhook_events_event_id").on(table.eventId),
  index("idx_webhook_events_type").on(table.eventType),
  index("idx_webhook_events_processed").on(table.processed),
]);

// Knowledge Base Articles
export const kbArticles = pgTable("kb_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // nullable for global articles
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  contentMd: text("content_md").notNull(),
  category: kbCategoryEnum("category").notNull(),
  tags: varchar("tags", { length: 100 }).array().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_kb_articles_tenant").on(table.tenantId),
  index("idx_kb_articles_slug").on(table.slug),
  index("idx_kb_articles_category").on(table.category),
  index("idx_kb_articles_active").on(table.isActive),
]);

// Knowledge Base Feedback
export const kbFeedback = pgTable("kb_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => kbArticles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_kb_feedback_article").on(table.articleId),
  index("idx_kb_feedback_user").on(table.userId),
  index("idx_kb_feedback_tenant").on(table.tenantId),
]);

// User Settings
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  hasCompletedTour: boolean("has_completed_tour").notNull().default(false),
  tourProgress: jsonb("tour_progress"),
  helpPreferences: jsonb("help_preferences"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Self-Destructible Content Management
export const selfDestructs = pgTable("self_destructs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  targetId: varchar("target_id").notNull(),
  status: selfDestructStatusEnum("status").notNull().default("armed"),
  armedAt: timestamp("armed_at").defaultNow(),
  destructAt: timestamp("destruct_at"), // TTL timestamp
  destroyedAt: timestamp("destroyed_at"),
  armedBy: varchar("armed_by").notNull().references(() => users.id),
  disarmedBy: varchar("disarmed_by").references(() => users.id),
  destroyedBy: varchar("destroyed_by").references(() => users.id),
  reason: text("reason"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_self_destructs_tenant").on(table.tenantId),
  index("idx_self_destructs_target").on(table.targetTable, table.targetId),
  index("idx_self_destructs_status").on(table.status),
  index("idx_self_destructs_destruct_at").on(table.destructAt),
  index("idx_self_destructs_armed_at").on(table.armedAt),
  // Unique constraint for idempotency - prevent duplicate armed records
  unique("unique_armed_target").on(table.tenantId, table.targetTable, table.targetId, table.status),
]);

// Enhanced Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  targetId: varchar("target_id").notNull(),
  action: auditActionEnum("action").notNull(),
  actor: varchar("actor").references(() => users.id), // null for system/sweeper actions
  actorType: varchar("actor_type", { length: 20 }).default("user"), // user, system, sweeper
  changes: jsonb("changes"), // before/after values for updates
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_tenant").on(table.tenantId),
  index("idx_audit_logs_target").on(table.targetTable, table.targetId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_actor").on(table.actor),
  index("idx_audit_logs_created").on(table.createdAt),
]);

// Danger Purge Operations - EXTREMELY SENSITIVE
export const purgeOperations = pgTable("purge_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  tenantName: varchar("tenant_name", { length: 255 }).notNull(), // Snapshot for confirmation
  status: purgeStatusEnum("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  exportAckedAt: timestamp("export_acked_at"),
  scheduledAt: timestamp("scheduled_at"), // When to execute
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  canceledAt: timestamp("canceled_at"),
  failedAt: timestamp("failed_at"),
  canceledBy: varchar("canceled_by").references(() => users.id),
  reason: text("reason").notNull(),
  confirmationToken: varchar("confirmation_token", { length: 64 }), // For OTP verification
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
  userAgent: text("user_agent"),
  errorMessage: text("error_message"), // If failed
  recordsDestroyed: integer("records_destroyed").default(0),
  tablesDestroyed: integer("tables_destroyed").default(0),
  metadata: jsonb("metadata"), // Additional tracking data
}, (table) => [
  index("idx_purge_operations_tenant").on(table.tenantId),
  index("idx_purge_operations_status").on(table.status),
  index("idx_purge_operations_scheduled").on(table.scheduledAt),
  index("idx_purge_operations_requested").on(table.requestedBy),
  // CRITICAL: Prevent concurrent purges per tenant
  unique("unique_active_purge_per_tenant").on(table.tenantId, table.status),
]);

// Inactivity Policy System Tables
export const inactivityPolicies = pgTable("inactivity_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // NULL for global defaults
  target: inactivityTargetEnum("target").notNull(), // What data type this applies to
  inactivityDays: integer("inactivity_days").notNull(), // Days of inactivity before action
  action: inactivityActionEnum("action").notNull(), // What to do when triggered
  gracePeriodDays: integer("grace_period_days").notNull().default(7), // Grace period after warning
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  metadata: jsonb("metadata"), // Additional configuration options
}, (table) => [
  index("idx_inactivity_policies_tenant").on(table.tenantId),
  index("idx_inactivity_policies_target").on(table.target),
  index("idx_inactivity_policies_enabled").on(table.isEnabled),
  // Ensure unique policy per target per tenant (including global NULL tenant)
  unique("unique_policy_per_target_per_tenant").on(table.tenantId, table.target),
]);

export const inactivityTrackers = pgTable("inactivity_trackers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  targetTable: varchar("target_table", { length: 100 }).notNull(), // Which table (e.g., "customers")
  targetId: varchar("target_id").notNull(), // Which record ID
  stage: inactivityStageEnum("stage").notNull().default("active"), // Current lifecycle stage
  lastActivity: timestamp("last_activity").notNull(), // Last recorded activity for this record
  warnedAt: timestamp("warned_at"), // When warning was sent
  armedAt: timestamp("armed_at"), // When record was armed for deletion
  snoozedUntil: timestamp("snoozed_until"), // Temporary snooze (extends grace period)
  nextCheck: timestamp("next_check"), // When to evaluate this record next (optimization)
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_inactivity_trackers_tenant").on(table.tenantId),
  index("idx_inactivity_trackers_target").on(table.targetTable, table.targetId),
  index("idx_inactivity_trackers_stage").on(table.stage),
  index("idx_inactivity_trackers_last_activity").on(table.lastActivity),
  index("idx_inactivity_trackers_next_check").on(table.nextCheck),
  index("idx_inactivity_trackers_warned_at").on(table.warnedAt),
  index("idx_inactivity_trackers_armed_at").on(table.armedAt),
  // Ensure unique tracker per target record
  unique("unique_tracker_per_target").on(table.tenantId, table.targetTable, table.targetId),
]);

export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  targetId: varchar("target_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // create, update, view, etc.
  userId: varchar("user_id").references(() => users.id), // Who triggered the activity (NULL for system)
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional event context
}, (table) => [
  index("idx_activity_events_tenant").on(table.tenantId),
  index("idx_activity_events_target").on(table.targetTable, table.targetId),
  index("idx_activity_events_created").on(table.createdAt),
  index("idx_activity_events_user").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  usersTenants: many(usersTenants),
  ordersCreated: many(orders),
  adjustmentsCreated: many(adjustments),
  paymentsCreated: many(payments),
  kbArticlesCreated: many(kbArticles),
  kbFeedbackGiven: many(kbFeedback),
  settings: one(userSettings),
}));

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  usersTenants: many(usersTenants),
  products: many(products),
  customers: many(customers),
  orders: many(orders),
  payments: many(payments),
  settings: one(settingsTenant),
  featureFlagOverrides: many(featureFlagOverrides),
  kbArticles: many(kbArticles),
  kbFeedback: many(kbFeedback),
}));

export const usersTenantsRelations = relations(usersTenants, ({ one }) => ({
  user: one(users, {
    fields: [usersTenants.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [usersTenants.tenantId],
    references: [tenants.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  batches: many(batches),
  inventoryLots: many(inventoryLots),
  orderItems: many(orderItems),
  adjustments: many(adjustments),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
  payments: many(payments),
  loyaltyAccount: one(loyaltyAccounts),
  credit: one(credits),
  loyaltyEvents: many(loyaltyEvents),
  creditTransactions: many(creditTransactions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  payments: many(payments),
  delivery: one(deliveries),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const kbArticlesRelations = relations(kbArticles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [kbArticles.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [kbArticles.createdBy],
    references: [users.id],
  }),
  feedback: many(kbFeedback),
}));

export const kbFeedbackRelations = relations(kbFeedback, ({ one }) => ({
  article: one(kbArticles, {
    fields: [kbFeedback.articleId],
    references: [kbArticles.id],
  }),
  user: one(users, {
    fields: [kbFeedback.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [kbFeedback.tenantId],
    references: [tenants.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type TenantKey = typeof tenantKeys.$inferSelect;
export type InsertTenantKey = typeof tenantKeys.$inferInsert;
export type UserTenant = typeof usersTenants.$inferSelect;
export type InsertUserTenant = typeof usersTenants.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = typeof batches.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;
export type FeatureFlagOverride = typeof featureFlagOverrides.$inferSelect;
export type InsertFeatureFlagOverride = typeof featureFlagOverrides.$inferInsert;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyAccount = typeof loyaltyAccounts.$inferInsert;
export type Credit = typeof credits.$inferSelect;
export type InsertCredit = typeof credits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type TenantSettings = typeof settingsTenant.$inferSelect;
export type InsertTenantSettings = typeof settingsTenant.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;
export type KbArticle = typeof kbArticles.$inferSelect;
export type InsertKbArticle = typeof kbArticles.$inferInsert;
export type KbFeedback = typeof kbFeedback.$inferSelect;
export type InsertKbFeedback = typeof kbFeedback.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type SelfDestruct = typeof selfDestructs.$inferSelect;
export type InsertSelfDestruct = typeof selfDestructs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type PurgeOperation = typeof purgeOperations.$inferSelect;
export type InsertPurgeOperation = typeof purgeOperations.$inferInsert;
export type InactivityPolicy = typeof inactivityPolicies.$inferSelect;
export type InsertInactivityPolicy = typeof inactivityPolicies.$inferInsert;
export type InactivityTracker = typeof inactivityTrackers.$inferSelect;
export type InsertInactivityTracker = typeof inactivityTrackers.$inferInsert;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type InsertActivityEvent = typeof activityEvents.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertCreditSchema = createInsertSchema(credits).omit({
  id: true,
  updatedAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSettingsSchema = createInsertSchema(settingsTenant).omit({
  tenantId: true, // Will be provided by route parameter
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export const insertKbArticleSchema = createInsertSchema(kbArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKbFeedbackSchema = createInsertSchema(kbFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerReferralSchema = createInsertSchema(customerReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  updatedAt: true,
});

export const insertSelfDestructSchema = createInsertSchema(selfDestructs).omit({
  id: true,
  armedAt: true,
  destroyedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPurgeOperationSchema = createInsertSchema(purgeOperations).omit({
  id: true,
  requestedAt: true,
  exportAckedAt: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  canceledAt: true,
  failedAt: true,
  recordsDestroyed: true,
  tablesDestroyed: true,
});

export const insertInactivityPolicySchema = createInsertSchema(inactivityPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInactivityTrackerSchema = createInsertSchema(inactivityTrackers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// LLM INTELLIGENCE TABLES
// ============================================================================

// LLM Providers Configuration
export const llmProviders = pgTable("llm_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  provider: llmProviderEnum("provider").notNull(),
  apiKey: text("api_key").notNull(), // Encrypted
  baseUrl: varchar("base_url"),
  model: varchar("model").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  rateLimit: integer("rate_limit").default(100), // requests per minute
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_llm_providers_tenant").on(table.tenantId),
  index("idx_llm_providers_active").on(table.isActive),
]);

// LLM Requests Log for auditing and debugging
export const llmRequests = pgTable("llm_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => llmProviders.id),
  intelligenceType: llmIntelligenceTypeEnum("intelligence_type").notNull(),
  status: llmStatusEnum("status").notNull().default("pending"),
  prompt: text("prompt").notNull(), // Encrypted
  response: text("response"), // Encrypted  
  confidence: llmConfidenceEnum("confidence"),
  tokens: integer("tokens"),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  processingTime: integer("processing_time"), // milliseconds
  error: text("error"),
  humanOverride: boolean("human_override").default(false),
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_llm_requests_tenant").on(table.tenantId),
  index("idx_llm_requests_type").on(table.intelligenceType),
  index("idx_llm_requests_status").on(table.status),
  index("idx_llm_requests_created").on(table.createdAt),
]);

// Pricing Intelligence Suggestions
export const pricingSuggestions = pgTable("pricing_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  customerId: varchar("customer_id").references(() => customers.id),
  requestId: varchar("request_id").references(() => llmRequests.id),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull(),
  confidence: llmConfidenceEnum("confidence").notNull(),
  justification: text("justification").notNull(),
  factors: jsonb("factors"), // Market data, competition, history, etc.
  applied: boolean("applied").default(false),
  appliedAt: timestamp("applied_at"),
  appliedBy: varchar("applied_by").references(() => users.id),
  feedback: text("feedback"), // Human feedback on the suggestion
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pricing_suggestions_tenant").on(table.tenantId),
  index("idx_pricing_suggestions_product").on(table.productId),
  index("idx_pricing_suggestions_applied").on(table.applied),
]);

// Credit Risk Analysis
export const creditAnalyses = pgTable("credit_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  requestId: varchar("request_id").references(() => llmRequests.id),
  riskScore: integer("risk_score").notNull(), // 0-100
  riskLevel: creditRiskEnum("risk_level").notNull(),
  confidence: llmConfidenceEnum("confidence").notNull(),
  summary: text("summary").notNull(),
  factors: jsonb("factors"), // Payment history, frequency, amounts, etc.
  recommendations: jsonb("recommendations"), // Credit limit, terms, etc.
  sentiment: sentimentEnum("sentiment"),
  lastPaymentDays: integer("last_payment_days"),
  avgPaymentDelay: integer("avg_payment_delay"),
  totalOutstanding: decimal("total_outstanding", { precision: 10, scale: 2 }),
  humanReviewed: boolean("human_reviewed").default(false),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_credit_analyses_tenant").on(table.tenantId),
  index("idx_credit_analyses_customer").on(table.customerId),
  index("idx_credit_analyses_risk").on(table.riskLevel),
  index("idx_credit_analyses_created").on(table.createdAt),
]);

// Smart Data Entry Processing
export const dataEnrichments = pgTable("data_enrichments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  requestId: varchar("request_id").references(() => llmRequests.id),
  entityType: varchar("entity_type").notNull(), // "customer", "product", "order", etc.
  entityId: varchar("entity_id"),
  originalData: jsonb("original_data").notNull(),
  enrichedData: jsonb("enriched_data").notNull(),
  confidence: llmConfidenceEnum("confidence").notNull(),
  changes: jsonb("changes"), // Structured diff of what was enriched
  applied: boolean("applied").default(false),
  appliedAt: timestamp("applied_at"),
  appliedBy: varchar("applied_by").references(() => users.id),
  rejected: boolean("rejected").default(false),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_data_enrichments_tenant").on(table.tenantId),
  index("idx_data_enrichments_entity").on(table.entityType, table.entityId),
  index("idx_data_enrichments_applied").on(table.applied),
]);

// Data Cleaning Operations
export const dataCleaningOperations = pgTable("data_cleaning_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  requestId: varchar("request_id").references(() => llmRequests.id),
  operationType: varchar("operation_type").notNull(), // "deduplication", "normalization", "compliance_check"
  targetTable: varchar("target_table").notNull(),
  recordsAnalyzed: integer("records_analyzed").notNull(),
  recordsAffected: integer("records_affected").notNull(),
  duplicatesFound: integer("duplicates_found"),
  complianceIssues: integer("compliance_issues"),
  confidence: llmConfidenceEnum("confidence").notNull(),
  summary: text("summary").notNull(),
  actions: jsonb("actions"), // Detailed list of changes made
  auditLog: jsonb("audit_log"), // Changes for compliance
  executed: boolean("executed").default(false),
  executedAt: timestamp("executed_at"),
  executedBy: varchar("executed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_data_cleaning_tenant").on(table.tenantId),
  index("idx_data_cleaning_type").on(table.operationType),
  index("idx_data_cleaning_executed").on(table.executed),
]);

// Training Content and Interactions
export const trainingContent = pgTable("training_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  contentType: varchar("content_type").notNull(), // "walkthrough", "simulation", "qa", "explanation"
  role: userRoleEnum("role"), // Target role, null for all roles
  content: text("content").notNull(), // Generated training content
  metadata: jsonb("metadata"), // Interactive elements, dependencies, etc.
  confidence: llmConfidenceEnum("confidence").notNull(),
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  feedback: jsonb("feedback"), // User feedback and ratings
  isActive: boolean("is_active").default(true),
  generatedBy: varchar("generated_by").references(() => llmRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_training_content_tenant").on(table.tenantId),
  index("idx_training_content_type").on(table.contentType),
  index("idx_training_content_role").on(table.role),
  index("idx_training_content_active").on(table.isActive),
]);

// Training Sessions and Progress
export const trainingSessions = pgTable("training_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  contentId: varchar("content_id").references(() => trainingContent.id),
  sessionType: varchar("session_type").notNull(), // "onboarding", "feature_training", "assessment"
  status: varchar("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
  score: integer("score"), // 0-100 for assessments
  interactions: jsonb("interactions"), // Q&A, corrections, hints used
  timeSpent: integer("time_spent"), // minutes
  completed: boolean("completed").default(false),
  feedback: text("feedback"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_training_sessions_tenant").on(table.tenantId),
  index("idx_training_sessions_user").on(table.userId),
  index("idx_training_sessions_content").on(table.contentId),
  index("idx_training_sessions_status").on(table.status),
]);

// Product Catalog Normalization (for nickname mapping)
export const productMappings = pgTable("product_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  nickname: varchar("nickname", { length: 255 }).notNull(),
  confidence: llmConfidenceEnum("confidence").notNull(),
  context: text("context"), // Where/how this nickname was discovered
  usageCount: integer("usage_count").default(1),
  confirmed: boolean("confirmed").default(false),
  confirmedBy: varchar("confirmed_by").references(() => users.id),
  requestId: varchar("request_id").references(() => llmRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_product_mappings_tenant").on(table.tenantId),
  index("idx_product_mappings_product").on(table.productId),
  index("idx_product_mappings_nickname").on(table.nickname),
  unique("unique_tenant_nickname").on(table.tenantId, table.nickname),
]);

// Adaptive Messaging Templates
export const adaptiveMessages = pgTable("adaptive_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => customers.id),
  messageType: varchar("message_type").notNull(), // "payment_reminder", "credit_follow_up", "welcome", etc.
  tone: sentimentEnum("tone").notNull(),
  template: text("template").notNull(),
  personalization: jsonb("personalization"), // Customer-specific factors
  confidence: llmConfidenceEnum("confidence").notNull(),
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  generatedBy: varchar("generated_by").references(() => llmRequests.id),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_adaptive_messages_tenant").on(table.tenantId),
  index("idx_adaptive_messages_customer").on(table.customerId),
  index("idx_adaptive_messages_type").on(table.messageType),
  index("idx_adaptive_messages_tone").on(table.tone),
]);

// ============================================================================
// LLM INTELLIGENCE SCHEMA EXPORTS
// ============================================================================

export const insertLlmProviderSchema = createInsertSchema(llmProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLlmRequestSchema = createInsertSchema(llmRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPricingSuggestionSchema = createInsertSchema(pricingSuggestions).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertCreditAnalysisSchema = createInsertSchema(creditAnalyses).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertDataEnrichmentSchema = createInsertSchema(dataEnrichments).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertDataCleaningOperationSchema = createInsertSchema(dataCleaningOperations).omit({
  id: true,
  createdAt: true,
  executedAt: true,
});

export const insertTrainingContentSchema = createInsertSchema(trainingContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertProductMappingSchema = createInsertSchema(productMappings).omit({
  id: true,
  createdAt: true,
});

export const insertAdaptiveMessageSchema = createInsertSchema(adaptiveMessages).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

// Type exports for the new tables
export type LlmProvider = typeof llmProviders.$inferSelect;
export type LlmRequest = typeof llmRequests.$inferSelect;
export type PricingSuggestion = typeof pricingSuggestions.$inferSelect;
export type CreditAnalysis = typeof creditAnalyses.$inferSelect;
export type DataEnrichment = typeof dataEnrichments.$inferSelect;
export type DataCleaningOperation = typeof dataCleaningOperations.$inferSelect;
export type TrainingContent = typeof trainingContent.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type ProductMapping = typeof productMappings.$inferSelect;
export type AdaptiveMessage = typeof adaptiveMessages.$inferSelect;
