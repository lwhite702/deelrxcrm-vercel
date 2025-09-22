import {
  integer,
  text,
  boolean,
  timestamp,
  pgTable,
  serial,
  uuid,
  jsonb,
  pgEnum,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeProductId: text("stripe_product_id"),
  planName: varchar("plan_name", { length: 50 }),
  subscriptionStatus: varchar("subscription_status", { length: 20 }),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  role: varchar("role", { length: 50 }).notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  invitedBy: integer("invited_by")
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

// Relations are commented out due to TypeScript compatibility issues
// Will be added later with proper table configuration

/*
export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
*/

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, "id" | "name" | "email">;
  })[];
};

export enum ActivityType {
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  CREATE_TEAM = "CREATE_TEAM",
  REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
  INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
}

// ---
// Multi-tenancy additions (merged from existing app)
// These coexist with the starter's teams model. Use either teams or tenants as needed.

// Attachments table (for file uploads)
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  deletedAt: timestamp("deleted_at"),
});
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

// Tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  personal: boolean("personal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// Tenant members (multi-tenancy membership)
export const tenantMembers = pgTable("tenant_members", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, {
      onDelete: "cascade",
    }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type TenantMemberMT = typeof tenantMembers.$inferSelect;
export type NewTenantMemberMT = typeof tenantMembers.$inferInsert;

// User settings (personal tenant mapping)
export const userSettings = pgTable("user_settings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  personalTenantId: uuid("personal_tenant_id").references(() => tenants.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

// Audit log (per-tenant actions)
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, {
      onDelete: "cascade",
    }),
  actorUserId: integer("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;

// CRM Module Tables
// Order and Payment Status Enums
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "cash",
  "check",
  "bank_transfer",
  "other",
]);

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"),
  priceCents: integer("price_cents").notNull().default(0),
  costCents: integer("cost_cents").default(0),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  isActive: boolean("is_active").notNull().default(true),
  category: text("category"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  address: jsonb("address"),
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  orderNumber: text("order_number").notNull(),
  status: orderStatusEnum("status").notNull().default("draft"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  notes: text("notes"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  totalPriceCents: integer("total_price_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("usd"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  method: paymentMethodEnum("method").notNull().default("card"),
  processedAt: timestamp("processed_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmountCents: integer("refund_amount_cents").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Inventory Adjustments table (PHASE 2)
export const adjustmentReasonEnum = pgEnum("adjustment_reason", [
  "waste",
  "sample",
  "personal",
  "recount",
  "damage",
  "theft",
  "expired",
  "other",
]);

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  adjustmentType: text("adjustment_type").notNull(), // "increase", "decrease", "correction"
  quantity: integer("quantity").notNull(),
  reason: adjustmentReasonEnum("reason").notNull().default("other"),
  notes: text("notes"),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Customer Referrals table (PHASE 2)
export const customerReferrals = pgTable("customer_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  referrerCustomerId: uuid("referrer_customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  referredCustomerId: uuid("referred_customer_id").references(
    () => customers.id,
    { onDelete: "set null" }
  ),
  referredEmail: text("referred_email"),
  referredPhone: text("referred_phone"),
  status: text("status").notNull().default("pending"), // pending, converted, expired
  rewardAmount: integer("reward_amount_cents").default(0),
  rewardPaid: boolean("reward_paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  convertedAt: timestamp("converted_at"),
  expiresAt: timestamp("expires_at"),
});

// Deliveries table (PHASE 2)
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "failed",
  "returned",
]);

export const deliveryMethodEnum = pgEnum("delivery_method", [
  "pickup",
  "standard_delivery",
  "express_delivery",
  "overnight",
  "courier",
  "postal",
]);

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  method: deliveryMethodEnum("method").notNull().default("standard_delivery"),
  status: deliveryStatusEnum("status").notNull().default("pending"),
  costCents: integer("cost_cents").notNull().default(0),
  deliveryAddress: jsonb("delivery_address").notNull(),
  instructions: text("instructions"),
  trackingNumber: text("tracking_number"),
  estimatedDeliveryAt: timestamp("estimated_delivery_at"),
  actualDeliveryAt: timestamp("actual_delivery_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Loyalty Programs table (PHASE 2)
export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  pointsPerDollar: integer("points_per_dollar").notNull().default(1), // Points earned per dollar spent
  dollarsPerPoint: integer("dollars_per_point").notNull().default(100), // Cents value of 1 point (100 = 1 cent)
  minimumRedemption: integer("minimum_redemption").notNull().default(100), // Minimum points to redeem
  expirationMonths: integer("expiration_months"), // null = no expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id),
});

// Loyalty Accounts table (PHASE 2)
export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  programId: uuid("program_id")
    .notNull()
    .references(() => loyaltyPrograms.id, { onDelete: "cascade" }),
  currentPoints: integer("current_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Loyalty Events table (PHASE 2)
export const loyaltyEventTypeEnum = pgEnum("loyalty_event_type", [
  "earned",
  "redeemed",
  "expired",
  "adjusted",
  "bonus",
]);

export const loyaltyEvents = pgTable("loyalty_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => loyaltyAccounts.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  type: loyaltyEventTypeEnum("type").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Loyalty Transactions table (PHASE 2)
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => loyaltyAccounts.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => loyaltyEvents.id, { onDelete: "cascade" }),
  pointsChange: integer("points_change").notNull(), // positive for earn, negative for redeem
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  expiresAt: timestamp("expires_at"), // for earned points
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CRM Type exports
export type CrmProduct = typeof products.$inferSelect;
export type NewCrmProduct = typeof products.$inferInsert;
export type CrmCustomer = typeof customers.$inferSelect;
export type NewCrmCustomer = typeof customers.$inferInsert;
export type CrmOrder = typeof orders.$inferSelect;
export type NewCrmOrder = typeof orders.$inferInsert;
export type CrmOrderItem = typeof orderItems.$inferSelect;
export type NewCrmOrderItem = typeof orderItems.$inferInsert;
export type CrmPayment = typeof payments.$inferSelect;
export type NewCrmPayment = typeof payments.$inferInsert;
export type CrmInventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewCrmInventoryAdjustment =
  typeof inventoryAdjustments.$inferInsert;

// PHASE 2 Type exports
export type CustomerReferral = typeof customerReferrals.$inferSelect;
export type NewCustomerReferral = typeof customerReferrals.$inferInsert;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type NewLoyaltyProgram = typeof loyaltyPrograms.$inferInsert;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type NewLoyaltyAccount = typeof loyaltyAccounts.$inferInsert;
export type LoyaltyEvent = typeof loyaltyEvents.$inferSelect;
export type NewLoyaltyEvent = typeof loyaltyEvents.$inferInsert;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

// Phase 3: Credit System Enums
export const creditStatusEnum = pgEnum("credit_status", [
  "active",
  "suspended",
  "closed",
  "defaulted",
]);

export const creditTransactionStatusEnum = pgEnum("credit_transaction_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "refunded",
]);

export const purgeStatusEnum = pgEnum("purge_status", [
  "requested",
  "scheduled",
  "export_ready",
  "acknowledged",
  "executing",
  "completed",
  "cancelled",
]);

export const kbArticleStatusEnum = pgEnum("kb_article_status", [
  "draft",
  "published",
  "archived",
]);

// Phase 3: Credit System Tables
export const credits = pgTable("credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  creditLimit: integer("credit_limit").notNull().default(0),
  currentBalance: integer("current_balance").notNull().default(0),
  availableCredit: integer("available_credit").notNull().default(0),
  status: creditStatusEnum("status").notNull().default("active"),
  setupIntentId: text("setup_intent_id"),
  paymentMethodId: text("payment_method_id"),
  interestRate: integer("interest_rate").default(0), // basis points
  gracePeriodDays: integer("grace_period_days").default(30),
  lastPaymentAt: timestamp("last_payment_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  creditId: uuid("credit_id")
    .notNull()
    .references(() => credits.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  transactionType: text("transaction_type")
    .notNull()
    .$type<"charge" | "payment" | "fee" | "adjustment">(),
  amount: integer("amount").notNull(), // cents
  description: text("description"),
  status: creditTransactionStatusEnum("status").notNull().default("pending"),
  scheduleId: text("schedule_id"), // for scheduled charges
  dueDate: timestamp("due_date"),
  processingFees: integer("processing_fees").default(0),
  attemptCount: integer("attempt_count").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Phase 3: Knowledge Base Tables
export const kbArticles = pgTable("kb_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: kbArticleStatusEnum("status").notNull().default("draft"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  authorId: uuid("author_id").references(() => users.id),
  viewCount: integer("view_count").default(0),
  isPublic: boolean("is_public").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kbUploads = pgTable("kb_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  articleId: uuid("article_id").references(() => kbArticles.id, {
    onDelete: "cascade",
  }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kbFeedback = pgTable("kb_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  articleId: uuid("article_id")
    .notNull()
    .references(() => kbArticles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  isHelpful: boolean("is_helpful"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Phase 3: Admin Operations Tables
export const purgeOperations = pgTable("purge_operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id),
  status: purgeStatusEnum("status").notNull().default("requested"),
  purgeScope: jsonb("purge_scope")
    .$type<{
      entities: string[];
      dateRange?: { from: string; to: string };
      criteria?: Record<string, any>;
    }>()
    .notNull(),
  scheduledFor: timestamp("scheduled_for"),
  exportUrl: text("export_url"),
  exportExpiresAt: timestamp("export_expires_at"),
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  recordsAffected: integer("records_affected"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inactivityPolicies = pgTable("inactivity_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thresholdDays: integer("threshold_days").notNull(),
  actions: jsonb("actions")
    .$type<{
      warnings: number[];
      suspend: boolean;
      purge: boolean;
    }>()
    .notNull(),
  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inactivityTrackers = pgTable("inactivity_trackers", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  policyId: uuid("policy_id")
    .notNull()
    .references(() => inactivityPolicies.id, { onDelete: "cascade" }),
  lastActivityAt: timestamp("last_activity_at").notNull(),
  daysSinceActivity: integer("days_since_activity").notNull(),
  warningsSent: integer("warnings_sent").default(0),
  isSuspended: boolean("is_suspended").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: serial("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: serial("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // login, order_created, etc
  eventData: jsonb("event_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Phase 3: Type exports
export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type KbArticle = typeof kbArticles.$inferSelect;
export type NewKbArticle = typeof kbArticles.$inferInsert;
export type KbUpload = typeof kbUploads.$inferSelect;
export type NewKbUpload = typeof kbUploads.$inferInsert;
export type KbFeedback = typeof kbFeedback.$inferSelect;
export type NewKbFeedback = typeof kbFeedback.$inferInsert;
export type PurgeOperation = typeof purgeOperations.$inferSelect;
export type NewPurgeOperation = typeof purgeOperations.$inferInsert;
export type InactivityPolicy = typeof inactivityPolicies.$inferSelect;
export type NewInactivityPolicy = typeof inactivityPolicies.$inferInsert;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;
