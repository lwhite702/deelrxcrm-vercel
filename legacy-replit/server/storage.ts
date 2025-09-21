import {
  users,
  tenants,
  usersTenants,
  featureFlags,
  featureFlagOverrides,
  products,
  batches,
  inventoryLots,
  customers,
  customerReferrals,
  orders,
  orderItems,
  loyaltyAccounts,
  credits,
  creditTransactions,
  settingsTenant,
  deliveries,
  payments,
  kbArticles,
  kbFeedback,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type UserTenant,
  type InsertUserTenant,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type CustomerReferral,
  type InsertCustomerReferral,
  type Order,
  type InsertOrder,
  type FeatureFlag,
  type FeatureFlagOverride,
  type InsertFeatureFlagOverride,
  type LoyaltyAccount,
  type Credit,
  type InsertCredit,
  type CreditTransaction,
  type InsertCreditTransaction,
  type Payment,
  type InsertPayment,
  type TenantSettings,
  type KbArticle,
  type InsertKbArticle,
  type KbFeedback,
  type InsertKbFeedback,
  userSettings,
  type UserSettings,
  type InsertUserSettings,
  tenantKeys,
  type TenantKey,
  type InsertTenantKey,
  selfDestructs,
  type SelfDestruct,
  type InsertSelfDestruct,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
  purgeOperations,
  type PurgeOperation,
  type InsertPurgeOperation,
  inactivityPolicies,
  type InactivityPolicy,
  type InsertInactivityPolicy,
  inactivityTrackers,
  type InactivityTracker,
  type InsertInactivityTracker,
  activityEvents,
  type ActivityEvent,
  type InsertActivityEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, like, ilike, isNull } from "drizzle-orm";
import { encrypt, decrypt, encryptOptional, decryptOptional, type EncryptedBlob } from "./crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getUserTenants(userId: string): Promise<(UserTenant & { tenant: Tenant })[]>;
  addUserToTenant(data: InsertUserTenant): Promise<UserTenant>;
  
  // Feature flags
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean>>;
  updateFeatureFlagOverride(data: InsertFeatureFlagOverride): Promise<FeatureFlagOverride>;
  
  // Products
  getProducts(tenantId: string): Promise<Product[]>;
  getProductsWithInventory(tenantId: string): Promise<Array<Product & { 
    currentStock: number; 
    wac: string; 
    minStockThreshold: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>>;
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string, tenantId: string): Promise<Product | undefined>;
  
  // Customers
  getCustomers(tenantId: string): Promise<Customer[]>;
  getCustomersWithDetails(tenantId: string): Promise<Array<Customer & { 
    loyaltyTier?: string; 
    loyaltyPoints?: number;
    creditLimit?: string; 
    creditBalance?: string;
    creditStatus?: string;
  }>>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: string, tenantId: string): Promise<Customer | undefined>;
  updateCustomerStatus(id: string, tenantId: string, status: 'new' | 'active' | 'past_due' | 'closed'): Promise<Customer>;
  
  // Customer Referrals
  getCustomerReferrals(tenantId: string): Promise<Array<CustomerReferral & {
    referrer: Pick<Customer, 'id' | 'name'>;
    referred: Pick<Customer, 'id' | 'name'>;
  }>>;
  getReferralsByCustomer(customerId: string, tenantId: string): Promise<Array<CustomerReferral & {
    referrer: Pick<Customer, 'id' | 'name'>;
    referred: Pick<Customer, 'id' | 'name'>;
  }>>;
  createCustomerReferral(referral: InsertCustomerReferral): Promise<CustomerReferral>;
  updateReferralStatus(id: string, tenantId: string, status: 'pending' | 'completed' | 'expired'): Promise<CustomerReferral>;
  completeReferral(id: string, tenantId: string): Promise<CustomerReferral>;
  
  // Orders
  getOrders(tenantId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string, tenantId: string): Promise<Order | undefined>;
  
  // Dashboard KPIs
  getDashboardKPIs(tenantId: string): Promise<{
    todayRevenue: string;
    ordersToday: number;
    lowStockItems: number;
    overdueCredits: string;
  }>;
  
  // Settings
  getTenantSettings(tenantId: string): Promise<TenantSettings | undefined>;
  createTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<TenantSettings>;
  updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<TenantSettings>;
  seedTenantSettings(tenantId: string): Promise<TenantSettings>;
  
  // Loyalty
  getLoyaltyAccounts(tenantId: string): Promise<(LoyaltyAccount & { customerName: string })[]>;
  
  // Credit
  getCreditAccounts(tenantId: string): Promise<(Credit & { customerName: string })[]>;
  getCreditTransactions(tenantId: string): Promise<Array<CreditTransaction & { 
    customerName: string;
    lastPayment?: string;
    nextDue?: string;
    overdue?: boolean;
  }>>;
  createCredit(credit: InsertCredit): Promise<Credit>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  updateCreditBalance(creditId: string, tenantId: string, newBalance: string): Promise<Credit>;
  seedCreditForTenant(tenantId: string): Promise<void>;
  
  // Payments
  getPayments(tenantId: string): Promise<Array<Payment & { customerName?: string }>>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(paymentId: string, tenantId: string, status: string, metadata?: any): Promise<Payment>;
  getPaymentStatistics(tenantId: string): Promise<{
    todayProcessed: string;
    todayPending: string;
    todayFailed: number;
    totalVolume: string;
  }>;
  getPaymentSettings(tenantId: string): Promise<{
    paymentMode: string;
    applicationFeeBps: number;
    defaultCurrency: string;
    stripeAccountId?: string;
  }>;
  seedPaymentsForTenant(tenantId: string): Promise<void>;
  
  // Deliveries
  getDeliveries(tenantId: string): Promise<Array<{
    id: string;
    orderId: string;
    method: string;
    addressLine1: string;
    city: string;
    state: string;
    fee: string;
    status: string;
    createdAt: Date | null;
    orderTotal: string;
    customerName: string;
    customerPhone?: string;
  }>>;
  
  // Knowledge Base Articles
  getKbArticles(filters?: { search?: string; category?: string; tenantId?: string | null; includeGlobal?: boolean }): Promise<KbArticle[]>;
  getKbArticleBySlug(slug: string): Promise<KbArticle | undefined>;
  getKbArticleById(id: string): Promise<KbArticle | undefined>;
  createKbArticle(article: InsertKbArticle): Promise<KbArticle>;
  updateKbArticle(id: string, article: Partial<InsertKbArticle>): Promise<KbArticle>;
  softDeleteKbArticle(id: string): Promise<KbArticle>;
  
  // Knowledge Base Feedback
  getKbFeedback(articleId: string, userId: string): Promise<KbFeedback | undefined>;
  upsertKbFeedback(feedback: InsertKbFeedback): Promise<KbFeedback>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Development/Test Seeding
  seedLoyaltyForTenant(tenantId: string): Promise<void>;
  
  // Feature Flag Seeding
  seedFeatureFlags(): Promise<void>;
  
  // Encryption Support
  isEncryptionEnabled(tenantId: string): Promise<boolean>;
  createCustomerEncrypted(customer: InsertCustomer): Promise<Customer>;
  getCustomerDecrypted(id: string, tenantId: string): Promise<Customer | undefined>;
  
  // Delivery encryption support  
  getDeliveriesDecrypted(tenantId: string): Promise<Array<{
    id: string;
    orderId: string;
    method: string;
    addressLine1: string;
    city: string;
    state: string;
    fee: string;
    status: string;
    createdAt: Date | null;
    orderTotal: string;
    customerName: string;
    customerPhone?: string;
  }>>;
  createDeliveryEncrypted(delivery: any): Promise<any>;
  
  // Self-Destruct Management
  isSelfDestructEnabled(tenantId: string): Promise<boolean>;
  getArmedIds(tenantId: string, targetTable: string): Promise<string[]>;
  filterOutArmed<T extends { id: string }>(tenantId: string, targetTable: string, records: T[]): Promise<T[]>;
  armSelfDestruct(data: {
    tenantId: string;
    targetTable: string;
    targetId: string;
    armedBy: string;
    reason?: string;
    destructAt?: Date;
    metadata?: any;
  }): Promise<SelfDestruct>;
  disarmSelfDestruct(id: string, tenantId: string, disarmedBy: string, reason?: string): Promise<SelfDestruct>;
  destroyNow(id: string, tenantId: string, destroyedBy: string, reason?: string): Promise<void>;
  destroyNowSystem(id: string, tenantId: string, reason?: string): Promise<void>;
  getSelfDestructs(tenantId: string, filters?: { status?: string; targetTable?: string }): Promise<Array<SelfDestruct & { 
    targetTableName: string;
    armedByName?: string;
    disarmedByName?: string; 
    destroyedByName?: string;
  }>>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(tenantId: string, filters?: { targetTable?: string; targetId?: string; action?: string }): Promise<Array<AuditLog & {
    actorName?: string;
  }>>;
  
  // Activity Tracking System
  recordActivity(data: {
    tenantId: string;
    targetTable: string;
    targetId: string;
    eventType: string;
    userId?: string;
    metadata?: any;
  }): Promise<void>;
  
  // Inactivity Policy Management
  getInactivityPolicies(tenantId?: string): Promise<InactivityPolicy[]>;
  createInactivityPolicy(policy: InsertInactivityPolicy): Promise<InactivityPolicy>;
  updateInactivityPolicy(id: string, policy: Partial<InsertInactivityPolicy>): Promise<InactivityPolicy>;
  deleteInactivityPolicy(id: string): Promise<void>;
  
  // Inactivity Tracker Management
  getInactivityTrackers(tenantId: string, filters?: { 
    stage?: string; 
    targetTable?: string; 
    overdue?: boolean; 
  }): Promise<InactivityTracker[]>;
  createInactivityTracker(tracker: InsertInactivityTracker): Promise<InactivityTracker>;
  updateInactivityTracker(id: string, tracker: Partial<InsertInactivityTracker>): Promise<InactivityTracker>;
  deleteInactivityTracker(id: string): Promise<void>;
  restoreInactivityTracker(id: string, tenantId: string, userId: string): Promise<InactivityTracker>;
  snoozeInactivityTracker(id: string, tenantId: string, snoozeDays: number, userId: string): Promise<InactivityTracker>;
  
  // Activity aggregation and tracker updates
  aggregateActivityEvents(tenantId: string): Promise<void>;
  
  // Danger Purge Operations - EXTREMELY SENSITIVE
  requestPurge(data: {
    tenantId: string;
    tenantName: string;
    requestedBy: string;
    reason: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<PurgeOperation>;
  ackExport(purgeId: string, tenantId: string): Promise<PurgeOperation>;
  schedulePurge(purgeId: string, tenantId: string, scheduledAt: Date, confirmationToken: string): Promise<PurgeOperation>;
  cancelPurge(purgeId: string, tenantId: string, canceledBy: string, reason?: string): Promise<PurgeOperation>;
  startPurge(purgeId: string, tenantId: string): Promise<PurgeOperation>;
  completePurge(purgeId: string, tenantId: string, recordsDestroyed: number, tablesDestroyed: number): Promise<PurgeOperation>;
  failPurge(purgeId: string, tenantId: string, errorMessage: string): Promise<PurgeOperation>;
  purgeTenantNow(tenantId: string, purgeId: string): Promise<{ recordsDestroyed: number; tablesDestroyed: number }>;
  getPurgeOperations(filters?: { tenantId?: string; status?: string }): Promise<Array<PurgeOperation & {
    requestedByName?: string;
    canceledByName?: string;
  }>>;

  // Dashboard Analytics
  getRevenueTrends(tenantId: string, period: 'daily' | 'weekly' | 'monthly', days?: number): Promise<Array<{
    period: string;
    revenue: string;
    orders: number;
    avgOrderValue: string;
    change: number;
  }>>;
  
  getOrderAnalytics(tenantId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    averageOrderValue: string;
    popularProducts: Array<{
      productId: string;
      name: string;
      totalSold: number;
      revenue: string;
    }>;
    ordersByHour: Array<{
      hour: number;
      count: number;
    }>;
    paymentMethodBreakdown: Array<{
      method: string;
      count: number;
      revenue: string;
    }>;
  }>;
  
  getInventoryAnalytics(tenantId: string): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: string;
    topProducts: Array<{
      productId: string;
      name: string;
      currentStock: number;
      stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
      turnoverRate: number;
    }>;
    stockLevels: Array<{
      category: string;
      inStock: number;
      lowStock: number;
      outOfStock: number;
    }>;
  }>;
  
  getCustomerInsights(tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    customerGrowthRate: number;
    loyaltyBreakdown: Array<{
      tier: string;
      count: number;
      totalPoints: number;
    }>;
    creditSummary: {
      totalCreditLimit: string;
      totalCreditUsed: string;
      overdueAmount: string;
      overdueCustomers: number;
    };
    topCustomers: Array<{
      customerId: string;
      name: string;
      totalOrders: number;
      totalSpent: string;
      lastOrderDate: Date | null;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getUserTenants(userId: string): Promise<(UserTenant & { tenant: Tenant })[]> {
    const results = await db
      .select({
        userId: usersTenants.userId,
        tenantId: usersTenants.tenantId,
        role: usersTenants.role,
        createdAt: usersTenants.createdAt,
        tenant: tenants,
      })
      .from(usersTenants)
      .innerJoin(tenants, eq(usersTenants.tenantId, tenants.id))
      .where(eq(usersTenants.userId, userId));
    
    return results as (UserTenant & { tenant: Tenant })[];
  }

  async addUserToTenant(data: InsertUserTenant): Promise<UserTenant> {
    const [userTenant] = await db.insert(usersTenants).values(data).returning();
    return userTenant;
  }

  // Feature flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags);
  }

  async getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean>> {
    const flags = await db.select().from(featureFlags);
    const overrides = await db
      .select()
      .from(featureFlagOverrides)
      .where(eq(featureFlagOverrides.tenantId, tenantId));

    const result: Record<string, boolean> = {};
    
    for (const flag of flags) {
      const override = overrides.find(o => o.flagKey === flag.key);
      result[flag.key] = override ? override.enabled : flag.defaultEnabled;
    }
    
    return result;
  }

  async updateFeatureFlagOverride(data: InsertFeatureFlagOverride): Promise<FeatureFlagOverride> {
    const [override] = await db
      .insert(featureFlagOverrides)
      .values(data)
      .onConflictDoUpdate({
        target: [featureFlagOverrides.tenantId, featureFlagOverrides.flagKey],
        set: {
          enabled: data.enabled,
          updatedAt: new Date(),
        },
      })
      .returning();
    return override;
  }

  // Products
  async getProducts(tenantId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.tenantId, tenantId));
  }

  async getProductsWithInventory(tenantId: string): Promise<Array<Product & { 
    currentStock: number; 
    wac: string; 
    minStockThreshold: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>> {
    // Get tenant settings for min stock threshold
    const tenantSettings = await this.getTenantSettings(tenantId);
    const minStockThreshold = tenantSettings?.minStockThreshold || 10;

    // Get all products for the tenant
    const productList = await this.getProducts(tenantId);
    
    // Efficient bulk queries: get stock aggregates for all products at once
    const stockAggregates = await db
      .select({
        productId: inventoryLots.productId,
        totalStock: sql<number>`COALESCE(SUM(${inventoryLots.qtyRemaining}), 0)`,
      })
      .from(inventoryLots)
      .innerJoin(products, eq(inventoryLots.productId, products.id))
      .where(eq(products.tenantId, tenantId))
      .groupBy(inventoryLots.productId);

    // Get WAC aggregates for all products at once (proper weighted average)
    const wacAggregates = await db
      .select({
        productId: batches.productId,
        wac: sql<number>`COALESCE(SUM(${batches.totalCost}) / NULLIF(SUM(${batches.qtyAcquired}), 0), 0)`,
      })
      .from(batches)
      .innerJoin(products, eq(batches.productId, products.id))
      .where(eq(products.tenantId, tenantId))
      .groupBy(batches.productId);

    // Create lookup maps for efficient access
    const stockMap = new Map(stockAggregates.map(s => [s.productId, s.totalStock]));
    const wacMap = new Map(wacAggregates.map(w => [w.productId, w.wac]));
    
    // Combine data for each product
    const productsWithInventory = productList.map(product => {
      const currentStock = stockMap.get(product.id) || 0;
      const wac = wacMap.get(product.id) || 0;

      // Determine stock status
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (currentStock === 0) {
        stockStatus = 'out_of_stock';
      } else if (currentStock <= minStockThreshold) {
        stockStatus = 'low_stock';
      } else {
        stockStatus = 'in_stock';
      }

      return {
        ...product,
        currentStock,
        wac: wac.toFixed(2),
        minStockThreshold,
        stockStatus,
      };
    });

    return productsWithInventory;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProduct(id: string, tenantId: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
    return product;
  }

  // Customers
  async getCustomers(tenantId: string): Promise<Customer[]> {
    let customerList = await db.select().from(customers).where(eq(customers.tenantId, tenantId));
    
    // Filter out armed content if self-destruct is enabled
    customerList = await this.filterOutArmed(tenantId, 'customers', customerList);
    
    // Check if encryption is enabled for this tenant
    const encryptionEnabled = await this.isEncryptionEnabled(tenantId);
    
    if (encryptionEnabled) {
      // Decrypt all customers in the list
      const decryptedCustomers = await Promise.all(
        customerList.map(async (customer) => {
          if (customer.nameEnc) {
            return {
              ...customer,
              name: customer.nameEnc ? await decryptOptional(tenantId, customer.nameEnc) : customer.name,
              phone: customer.phoneEnc ? await decryptOptional(tenantId, customer.phoneEnc) : customer.phone,
              email: customer.emailEnc ? await decryptOptional(tenantId, customer.emailEnc) : customer.email,
              notes: customer.notesEnc ? await decryptOptional(tenantId, customer.notesEnc) : customer.notes,
            };
          }
          return customer;
        })
      );
      return decryptedCustomers;
    }
    
    return customerList;
  }

  async getCustomersWithDetails(tenantId: string): Promise<Array<Customer & { 
    loyaltyTier?: string; 
    loyaltyPoints?: number;
    creditLimit?: string; 
    creditBalance?: string;
    creditStatus?: string;
  }>> {
    // Get all customers for the tenant (already handles decryption)
    const customerList = await this.getCustomers(tenantId);

    // Get loyalty data for all customers in one query
    const loyaltyData = await db
      .select({
        customerId: loyaltyAccounts.customerId,
        tier: loyaltyAccounts.tier,
        points: loyaltyAccounts.points,
      })
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.tenantId, tenantId));

    // Get credit data for all customers in one query
    const creditData = await db
      .select({
        customerId: credits.customerId,
        limitAmount: credits.limitAmount,
        balance: credits.balance,
        status: credits.status,
      })
      .from(credits)
      .where(eq(credits.tenantId, tenantId));

    // Create lookup maps for efficient access
    const loyaltyMap = new Map(loyaltyData.map(l => [l.customerId, l]));
    const creditMap = new Map(creditData.map(c => [c.customerId, c]));

    // Combine data for each customer (customers are already decrypted from getCustomers call)
    const customersWithDetails = customerList.map(customer => {
      const loyalty = loyaltyMap.get(customer.id);
      const credit = creditMap.get(customer.id);

      return {
        ...customer,
        loyaltyTier: loyalty?.tier,
        loyaltyPoints: loyalty?.points,
        creditLimit: credit?.limitAmount,
        creditBalance: credit?.balance,
        creditStatus: credit?.status,
      };
    });

    return customersWithDetails;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomer(id: string, tenantId: string): Promise<Customer | undefined> {
    // Use the dedicated decryption method for consistent handling
    return await this.getCustomerDecrypted(id, tenantId);
  }

  async updateCustomerStatus(id: string, tenantId: string, status: 'new' | 'active' | 'past_due' | 'closed'): Promise<Customer> {
    // First get the current customer to validate transition
    const existingCustomer = await this.getCustomer(id, tenantId);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // Validate status transition using simple state machine
    const validTransitions: Record<string, string[]> = {
      'new': ['active'],
      'active': ['past_due', 'closed'],
      'past_due': ['active', 'closed'],
      'closed': [] // No transitions allowed from closed
    };

    const allowedNextStates = validTransitions[existingCustomer.status] || [];
    if (!allowedNextStates.includes(status)) {
      throw new Error(`Invalid status transition: cannot move from ${existingCustomer.status} to ${status}. Allowed transitions: ${allowedNextStates.join(', ') || 'none'}`);
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({ 
        status: status,
        statusUpdatedAt: new Date()
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();
    
    if (!updatedCustomer) {
      throw new Error("Customer not found");
    }
    
    // Create audit log for status change
    await this.createAuditLog({
      tenantId,
      targetTable: 'customers',
      targetId: id,
      action: 'update',
      actor: 'system', // This should be the actual user ID in practice
      before: null,
      after: { status: status, statusUpdatedAt: new Date().toISOString() },
      metadata: { actionType: 'status_change' }
    });
    
    return updatedCustomer;
  }

  // Customer Referrals
  async getCustomerReferrals(tenantId: string): Promise<Array<CustomerReferral & {
    referrer: Pick<Customer, 'id' | 'name'>;
    referred: Pick<Customer, 'id' | 'name'>;
  }>> {
    const referrerCustomer = customers.as('referrer_customer');
    const referredCustomer = customers.as('referred_customer');
    
    const referrals = await db
      .select({
        id: customerReferrals.id,
        tenantId: customerReferrals.tenantId,
        referrerId: customerReferrals.referrerId,
        referredId: customerReferrals.referredId,
        status: customerReferrals.status,
        rewardAmount: customerReferrals.rewardAmount,
        rewardPaidDate: customerReferrals.rewardPaidDate,
        completedAt: customerReferrals.completedAt,
        expiresAt: customerReferrals.expiresAt,
        notes: customerReferrals.notes,
        createdAt: customerReferrals.createdAt,
        referrerName: referrerCustomer.name,
        referredName: referredCustomer.name,
      })
      .from(customerReferrals)
      .leftJoin(referrerCustomer, eq(customerReferrals.referrerId, referrerCustomer.id))
      .leftJoin(referredCustomer, eq(customerReferrals.referredId, referredCustomer.id))
      .where(eq(customerReferrals.tenantId, tenantId))
      .orderBy(desc(customerReferrals.createdAt));

    // Transform the result to match the expected interface
    return referrals.map(referral => ({
      id: referral.id,
      tenantId: referral.tenantId,
      referrerId: referral.referrerId,
      referredId: referral.referredId,
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardPaidDate: referral.rewardPaidDate,
      completedAt: referral.completedAt,
      expiresAt: referral.expiresAt,
      notes: referral.notes,
      createdAt: referral.createdAt,
      referrer: {
        id: referral.referrerId,
        name: referral.referrerName || 'Unknown'
      },
      referred: {
        id: referral.referredId,
        name: referral.referredName || 'Unknown'
      }
    }));
  }

  async getReferralsByCustomer(customerId: string, tenantId: string): Promise<Array<CustomerReferral & {
    referrer: Pick<Customer, 'id' | 'name'>;
    referred: Pick<Customer, 'id' | 'name'>;
  }>> {
    const referrerCustomer = customers.as('referrer_customer');
    const referredCustomer = customers.as('referred_customer');
    
    const referrals = await db
      .select({
        id: customerReferrals.id,
        tenantId: customerReferrals.tenantId,
        referrerId: customerReferrals.referrerId,
        referredId: customerReferrals.referredId,
        status: customerReferrals.status,
        rewardAmount: customerReferrals.rewardAmount,
        rewardPaidDate: customerReferrals.rewardPaidDate,
        completedAt: customerReferrals.completedAt,
        expiresAt: customerReferrals.expiresAt,
        notes: customerReferrals.notes,
        createdAt: customerReferrals.createdAt,
        referrerName: referrerCustomer.name,
        referredName: referredCustomer.name,
      })
      .from(customerReferrals)
      .leftJoin(referrerCustomer, eq(customerReferrals.referrerId, referrerCustomer.id))
      .leftJoin(referredCustomer, eq(customerReferrals.referredId, referredCustomer.id))
      .where(and(
        eq(customerReferrals.tenantId, tenantId),
        or(
          eq(customerReferrals.referrerId, customerId),
          eq(customerReferrals.referredId, customerId)
        )
      ))
      .orderBy(desc(customerReferrals.createdAt));

    // Transform the result to match the expected interface
    return referrals.map(referral => ({
      id: referral.id,
      tenantId: referral.tenantId,
      referrerId: referral.referrerId,
      referredId: referral.referredId,
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardPaidDate: referral.rewardPaidDate,
      completedAt: referral.completedAt,
      expiresAt: referral.expiresAt,
      notes: referral.notes,
      createdAt: referral.createdAt,
      referrer: {
        id: referral.referrerId,
        name: referral.referrerName || 'Unknown'
      },
      referred: {
        id: referral.referredId,
        name: referral.referredName || 'Unknown'
      }
    }));
  }

  async createCustomerReferral(referral: InsertCustomerReferral): Promise<CustomerReferral> {
    const [newReferral] = await db.insert(customerReferrals).values(referral).returning();
    
    // Create audit log for referral creation
    await this.createAuditLog({
      tenantId: referral.tenantId,
      targetTable: 'customer_referrals',
      targetId: newReferral.id,
      action: 'create',
      actor: 'system', // This should be the actual user ID in practice
      before: null,
      after: newReferral,
      metadata: { actionType: 'referral_created' }
    });
    
    return newReferral;
  }

  async updateReferralStatus(id: string, tenantId: string, status: 'pending' | 'completed' | 'expired'): Promise<CustomerReferral> {
    const [updatedReferral] = await db
      .update(customerReferrals)
      .set({ 
        status: status,
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      })
      .where(and(eq(customerReferrals.id, id), eq(customerReferrals.tenantId, tenantId)))
      .returning();
    
    if (!updatedReferral) {
      throw new Error("Referral not found");
    }
    
    // Create audit log for status change
    await this.createAuditLog({
      tenantId,
      targetTable: 'customer_referrals',
      targetId: id,
      action: 'update',
      actor: 'system', // This should be the actual user ID in practice
      before: null,
      after: { status: status },
      metadata: { actionType: 'referral_status_change' }
    });
    
    return updatedReferral;
  }

  async completeReferral(id: string, tenantId: string): Promise<CustomerReferral> {
    const [updatedReferral] = await db
      .update(customerReferrals)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        rewardPaidDate: new Date() // Auto-pay reward when completed
      })
      .where(and(eq(customerReferrals.id, id), eq(customerReferrals.tenantId, tenantId)))
      .returning();
    
    if (!updatedReferral) {
      throw new Error("Referral not found");
    }
    
    // Create audit log for referral completion
    await this.createAuditLog({
      tenantId,
      targetTable: 'customer_referrals',
      targetId: id,
      action: 'update',
      actor: 'system', // This should be the actual user ID in practice
      before: null,
      after: { 
        status: 'completed',
        completedAt: updatedReferral.completedAt,
        rewardPaidDate: updatedReferral.rewardPaidDate
      },
      metadata: { actionType: 'referral_completed' }
    });
    
    return updatedReferral;
  }

  // Orders
  async getOrders(tenantId: string): Promise<Order[]> {
    let orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt));
    
    // Filter out armed content if self-destruct is enabled
    orderList = await this.filterOutArmed(tenantId, 'orders', orderList);
    
    return orderList;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: string, tenantId: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    return order;
  }

  // Dashboard KPIs
  async getDashboardKPIs(tenantId: string): Promise<{
    todayRevenue: string;
    ordersToday: number;
    lowStockItems: number;
    overdueCredits: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's revenue
    const [revenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.paymentStatus, "completed"),
          sql`${orders.createdAt} >= ${today}`,
          sql`${orders.createdAt} < ${tomorrow}`
        )
      );

    // Orders today
    const [ordersResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          sql`${orders.createdAt} >= ${today}`,
          sql`${orders.createdAt} < ${tomorrow}`
        )
      );

    // Low stock items (simplified - would need proper inventory calculation)
    const [lowStockResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    // Overdue credits (simplified)
    const [creditsResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${credits.balance}), 0)`,
      })
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.status, "active"),
          sql`${credits.balance} > 0`
        )
      );

    return {
      todayRevenue: revenueResult?.total || "0",
      ordersToday: ordersResult?.count || 0,
      lowStockItems: Math.floor((lowStockResult?.count || 0) * 0.1), // 10% for demo
      overdueCredits: creditsResult?.total || "0",
    };
  }

  // Settings
  async getTenantSettings(tenantId: string): Promise<TenantSettings | undefined> {
    const [settings] = await db
      .select()
      .from(settingsTenant)
      .where(eq(settingsTenant.tenantId, tenantId));
    return settings;
  }

  async createTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<TenantSettings> {
    const [newSettings] = await db
      .insert(settingsTenant)
      .values({ ...settings, tenantId })
      .returning();
    return newSettings;
  }

  async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<TenantSettings> {
    const [updatedSettings] = await db
      .update(settingsTenant)
      .set(settings)
      .where(eq(settingsTenant.tenantId, tenantId))
      .returning();
    return updatedSettings;
  }

  async seedTenantSettings(tenantId: string): Promise<TenantSettings> {
    // Create default settings for a new tenant
    const defaultSettings = {
      tenantId,
      targetMargin: "0.3000",
      minStockThreshold: 10,
      exposureCap: "10000.00",
      deliveryMethodsEnabled: "pickup,manual_courier",
      leadTimeDays: 7,
      safetyDays: 3,
      paymentMode: "platform" as const,
      applicationFeeBps: 0,
      defaultCurrency: "usd",
    };

    return this.createTenantSettings(tenantId, defaultSettings);
  }

  // Loyalty
  async getLoyaltyAccounts(tenantId: string): Promise<(LoyaltyAccount & { customerName: string })[]> {
    const results = await db
      .select({
        id: loyaltyAccounts.id,
        tenantId: loyaltyAccounts.tenantId,
        customerId: loyaltyAccounts.customerId,
        points: loyaltyAccounts.points,
        tier: loyaltyAccounts.tier,
        updatedAt: loyaltyAccounts.updatedAt,
        customerName: customers.name,
      })
      .from(loyaltyAccounts)
      .innerJoin(customers, eq(loyaltyAccounts.customerId, customers.id))
      .where(eq(loyaltyAccounts.tenantId, tenantId));
    
    return results as (LoyaltyAccount & { customerName: string })[];
  }

  // Credit
  async getCreditAccounts(tenantId: string): Promise<(Credit & { customerName: string })[]> {
    const results = await db
      .select({
        id: credits.id,
        tenantId: credits.tenantId,
        customerId: credits.customerId,
        limitAmount: credits.limitAmount,
        balance: credits.balance,
        status: credits.status,
        updatedAt: credits.updatedAt,
        customerName: customers.name,
      })
      .from(credits)
      .innerJoin(customers, eq(credits.customerId, customers.id))
      .where(eq(credits.tenantId, tenantId));
    
    // Filter out armed records
    const filteredResults = await this.filterOutArmed(tenantId, 'credits', results);
    return filteredResults as (Credit & { customerName: string })[];
  }

  async getCreditTransactions(tenantId: string): Promise<Array<CreditTransaction & { 
    customerName: string;
    lastPayment?: string;
    nextDue?: string;
    overdue?: boolean;
  }>> {
    const results = await db
      .select({
        id: creditTransactions.id,
        tenantId: creditTransactions.tenantId,
        customerId: creditTransactions.customerId,
        orderId: creditTransactions.orderId,
        amount: creditTransactions.amount,
        fee: creditTransactions.fee,
        dueDate: creditTransactions.dueDate,
        paidDate: creditTransactions.paidDate,
        status: creditTransactions.status,
        createdAt: creditTransactions.createdAt,
        customerName: customers.name,
      })
      .from(creditTransactions)
      .innerJoin(customers, eq(creditTransactions.customerId, customers.id))
      .where(eq(creditTransactions.tenantId, tenantId))
      .orderBy(desc(creditTransactions.createdAt));

    const mappedResults = results.map(r => {
      const now = new Date();
      const overdue = r.dueDate && r.status === 'pending' && r.dueDate < now;
      
      return {
        ...r,
        lastPayment: r.paidDate?.toISOString(),
        nextDue: r.dueDate?.toISOString(),
        overdue: Boolean(overdue),
      };
    });

    // Filter out armed records
    const filteredResults = await this.filterOutArmed(tenantId, 'credit_transactions', mappedResults);
    return filteredResults as Array<CreditTransaction & { 
      customerName: string;
      lastPayment?: string;
      nextDue?: string;
      overdue?: boolean;
    }>;
  }

  async createCredit(credit: InsertCredit): Promise<Credit> {
    const [newCredit] = await db.insert(credits).values(credit).returning();
    return newCredit;
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    // Use database transaction for atomicity
    return await db.transaction(async (tx) => {
      // Find the customer's credit account
      const [creditAccount] = await tx
        .select()
        .from(credits)
        .where(
          and(
            eq(credits.customerId, transaction.customerId),
            eq(credits.tenantId, transaction.tenantId)
          )
        );
      
      if (!creditAccount) {
        throw new Error(`No credit account found for customer ${transaction.customerId}`);
      }
      
      // Create the transaction
      const [newTransaction] = await tx.insert(creditTransactions).values(transaction).returning();
      
      // Calculate new balance (add transaction amount to current balance)
      const currentBalance = parseFloat(creditAccount.balance);
      const transactionAmount = parseFloat(transaction.amount);
      const newBalance = (currentBalance + transactionAmount).toFixed(2);
      
      // Check if new balance exceeds credit limit
      const creditLimit = parseFloat(creditAccount.limitAmount);
      if (parseFloat(newBalance) > creditLimit) {
        throw new Error(`Transaction would exceed credit limit. Current: $${currentBalance.toFixed(2)}, Limit: $${creditLimit.toFixed(2)}, Requested: $${transactionAmount.toFixed(2)}`);
      }
      
      // Update the credit account balance
      await tx
        .update(credits)
        .set({ 
          balance: newBalance,
          updatedAt: new Date() 
        })
        .where(eq(credits.id, creditAccount.id));
      
      return newTransaction;
    });
  }

  async updateCreditBalance(creditId: string, tenantId: string, newBalance: string): Promise<Credit> {
    const [updatedCredit] = await db
      .update(credits)
      .set({ 
        balance: newBalance, 
        updatedAt: new Date() 
      })
      .where(and(eq(credits.id, creditId), eq(credits.tenantId, tenantId)))
      .returning();
    return updatedCredit;
  }

  async seedCreditForTenant(tenantId: string): Promise<void> {
    // Get existing customers for this tenant
    const customers = await this.getCustomers(tenantId);
    
    if (customers.length === 0) {
      console.log(`No customers found for tenant ${tenantId}, skipping credit seeding.`);
      return;
    }

    // Create credit accounts for some customers
    const creditData = [
      {
        tenantId,
        customerId: customers[0]?.id,
        limitAmount: "1000.00",
        balance: "250.00",
        status: "active" as const,
      },
      {
        tenantId,
        customerId: customers[1]?.id,
        limitAmount: "500.00",
        balance: "0.00",
        status: "active" as const,
      },
      {
        tenantId,
        customerId: customers[2]?.id,
        limitAmount: "750.00",
        balance: "450.00",
        status: "suspended" as const,
      },
    ];

    // Filter out any undefined customer IDs and insert credits
    const validCreditData = creditData.filter(data => data.customerId);
    if (validCreditData.length > 0) {
      await db.insert(credits).values(validCreditData).onConflictDoNothing();
    }

    // Create some credit transactions
    const transactionData = [
      {
        tenantId,
        customerId: customers[0]?.id,
        amount: "85.50",
        fee: "2.50",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: "pending" as const,
      },
      {
        tenantId,
        customerId: customers[2]?.id,
        amount: "120.00",
        fee: "5.00",
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (overdue)
        status: "overdue" as const,
      },
      {
        tenantId,
        customerId: customers[1]?.id,
        amount: "45.75",
        fee: "1.25",
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // paid 5 days ago
        status: "paid" as const,
      },
    ];

    // Filter out any undefined customer IDs and insert transactions
    const validTransactionData = transactionData.filter(data => data.customerId);
    if (validTransactionData.length > 0) {
      await db.insert(creditTransactions).values(validTransactionData).onConflictDoNothing();
    }

    console.log(`Seeded ${validCreditData.length} credit accounts and ${validTransactionData.length} transactions for tenant ${tenantId}`);
  }

  // Payments
  async getPayments(tenantId: string): Promise<Array<Payment & { customerName?: string }>> {
    const results = await db
      .select({
        id: payments.id,
        tenantId: payments.tenantId,
        orderId: payments.orderId,
        customerId: payments.customerId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        method: payments.method,
        paymentIntentId: payments.paymentIntentId,
        chargeId: payments.chargeId,
        transferId: payments.transferId,
        refundId: payments.refundId,
        failureReason: payments.failureReason,
        notes: payments.notes,
        metadata: payments.metadata,
        applicationFeeBps: payments.applicationFeeBps,
        processingFeeCents: payments.processingFeeCents,
        createdBy: payments.createdBy,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        customerName: customers.name,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .where(eq(payments.tenantId, tenantId))
      .orderBy(desc(payments.createdAt));
    
    // Filter out armed records
    const filteredResults = await this.filterOutArmed(tenantId, 'payments', results);
    return filteredResults as Array<Payment & { customerName?: string }>;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(paymentId: string, tenantId: string, status: string, metadata?: any): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status: status as any,
        metadata: metadata || null,
        updatedAt: new Date() 
      })
      .where(and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId)))
      .returning();
    return updatedPayment;
  }

  async getPaymentStatistics(tenantId: string): Promise<{
    todayProcessed: string;
    todayPending: string;
    todayFailed: number;
    totalVolume: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's processed payments
    const [processedResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, "completed"),
          sql`${payments.createdAt} >= ${today}`
        )
      );

    // Get today's pending payments
    const [pendingResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, "pending"),
          sql`${payments.createdAt} >= ${today}`
        )
      );

    // Get today's failed payment count
    const [failedResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, "failed"),
          sql`${payments.createdAt} >= ${today}`
        )
      );

    // Get total volume (all time completed payments)
    const [totalResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, "completed")
        )
      );

    return {
      todayProcessed: (processedResult?.total || 0).toFixed(2),
      todayPending: (pendingResult?.total || 0).toFixed(2),
      todayFailed: Number(failedResult?.count || 0),
      totalVolume: (totalResult?.total || 0).toFixed(2),
    };
  }

  async getPaymentSettings(tenantId: string): Promise<{
    paymentMode: string;
    applicationFeeBps: number;
    defaultCurrency: string;
    stripeAccountId?: string;
  }> {
    const settings = await this.getTenantSettings(tenantId);
    
    return {
      paymentMode: settings?.paymentMode || "platform",
      applicationFeeBps: settings?.applicationFeeBps || 0,
      defaultCurrency: settings?.defaultCurrency || "usd",
      stripeAccountId: settings?.stripeAccountId || undefined,
    };
  }

  async seedPaymentsForTenant(tenantId: string): Promise<void> {
    // Check if tenant exists
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Check if payments already exist for this tenant
    const existingPayments = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.tenantId, tenantId))
      .limit(1);

    if (existingPayments.length > 0) {
      return; // Already seeded
    }

    // Get existing customers for this tenant
    const existingCustomers = await this.getCustomers(tenantId);
    
    if (existingCustomers.length === 0) {
      // Create sample customers first
      const sampleCustomers = [
        {
          tenantId,
          name: 'John Smith',
          phone: '(555) 123-4567',
          email: 'john.smith@example.com',
          preferredFulfillment: 'pickup' as const,
        },
        {
          tenantId,
          name: 'Sarah Johnson', 
          phone: '(555) 234-5678',
          email: 'sarah.johnson@example.com',
          preferredFulfillment: 'delivery' as const,
        },
        {
          tenantId,
          name: 'Mike Wilson',
          phone: '(555) 345-6789',
          email: 'mike.wilson@example.com',
          preferredFulfillment: 'pickup' as const,
        },
      ];

      await db.insert(customers).values(sampleCustomers);
    }

    // Get customers again after potential creation
    const tenantCustomers = await this.getCustomers(tenantId);
    const adminUser = await db.select().from(users).limit(1);
    
    if (!adminUser.length || !tenantCustomers.length) {
      return;
    }

    // Create sample payments
    const samplePayments = [
      {
        tenantId,
        customerId: tenantCustomers[0].id,
        amount: "125.50",
        currency: "usd",
        status: "completed" as const,
        method: "card" as const,
        paymentIntentId: "pi_1234567890",
        chargeId: "ch_1234567890",
        notes: "Payment for prescription order",
        applicationFeeBps: 250,
        processingFeeCents: 89,
        createdBy: adminUser[0].id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        tenantId,
        customerId: tenantCustomers[1].id,
        amount: "89.75",
        currency: "usd",
        status: "pending" as const,
        method: "cash" as const,
        notes: "Cash payment - exact change provided",
        applicationFeeBps: 0,
        processingFeeCents: 0,
        createdBy: adminUser[0].id,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        tenantId,
        customerId: tenantCustomers[2].id,
        amount: "67.25",
        currency: "usd",
        status: "failed" as const,
        method: "card" as const,
        paymentIntentId: "pi_5678901234",
        failureReason: "insufficient_funds",
        notes: "Card declined due to insufficient funds",
        applicationFeeBps: 250,
        processingFeeCents: 0,
        createdBy: adminUser[0].id,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
    ];

    // Insert payments
    await db.insert(payments).values(samplePayments);
  }

  // Deliveries
  async getDeliveries(tenantId: string): Promise<Array<{
    id: string;
    orderId: string;
    method: string;
    addressLine1: string;
    city: string;
    state: string;
    fee: string;
    status: string;
    createdAt: Date | null;
    orderTotal: string;
    customerName: string;
    customerPhone?: string;
  }>> {
    // Use the decrypted method for consistent handling
    return await this.getDeliveriesDecrypted(tenantId);
  }

  // Development/Test Seeding Functions
  async seedLoyaltyForTenant(tenantId: string): Promise<void> {
    // Only run in development/test environments
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Check if loyalty accounts already exist for this tenant
    const existingAccounts = await db
      .select({ id: loyaltyAccounts.id })
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.tenantId, tenantId))
      .limit(1);

    if (existingAccounts.length > 0) {
      return; // Already seeded
    }

    // Create sample customers first
    const sampleCustomers = [
      {
        id: `cust-${tenantId}-1`,
        tenantId,
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@example.com',
        address: '123 Oak Street, Springfield, IL',
      },
      {
        id: `cust-${tenantId}-2`,
        tenantId,
        name: 'Sarah Johnson',
        phone: '(555) 234-5678',
        email: 'sarah.johnson@example.com',
        address: '456 Pine Avenue, Springfield, IL',
      },
      {
        id: `cust-${tenantId}-3`,
        tenantId,
        name: 'Mike Wilson',
        phone: '(555) 345-6789',
        email: 'mike.wilson@example.com',
        address: '789 Elm Drive, Springfield, IL',
      },
    ];

    // Insert customers
    await db.insert(customers).values(sampleCustomers).onConflictDoNothing();

    // Create corresponding loyalty accounts
    const sampleLoyaltyAccounts = [
      {
        id: `loyal-${tenantId}-1`,
        tenantId,
        customerId: `cust-${tenantId}-1`,
        points: 1250,
        tier: 'silver' as const,
        updatedAt: new Date(),
      },
      {
        id: `loyal-${tenantId}-2`,
        tenantId,
        customerId: `cust-${tenantId}-2`,
        points: 2800,
        tier: 'gold' as const,
        updatedAt: new Date(),
      },
      {
        id: `loyal-${tenantId}-3`,
        tenantId,
        customerId: `cust-${tenantId}-3`,
        points: 350,
        tier: 'bronze' as const,
        updatedAt: new Date(),
      },
    ];

    // Insert loyalty accounts
    await db.insert(loyaltyAccounts).values(sampleLoyaltyAccounts).onConflictDoNothing();
  }

  // Knowledge Base Articles
  async getKbArticles(filters?: { 
    search?: string; 
    category?: string; 
    tenantId?: string | null; 
    includeGlobal?: boolean 
  }): Promise<KbArticle[]> {
    let query = db.select().from(kbArticles).where(eq(kbArticles.isActive, true));
    
    // Apply filters
    const conditions = [eq(kbArticles.isActive, true)];
    
    // Search filter
    if (filters?.search) {
      const searchCondition = or(
        ilike(kbArticles.title, `%${filters.search}%`),
        ilike(kbArticles.contentMd, `%${filters.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    // Category filter
    if (filters?.category) {
      conditions.push(eq(kbArticles.category, filters.category as any));
    }
    
    // Tenant filtering
    if (filters?.tenantId !== undefined) {
      if (filters.includeGlobal) {
        // Include both tenant-specific and global articles
        if (filters.tenantId === null) {
          conditions.push(isNull(kbArticles.tenantId));
        } else {
          const orCondition = or(
            eq(kbArticles.tenantId, filters.tenantId),
            isNull(kbArticles.tenantId)
          );
          if (orCondition) {
            conditions.push(orCondition);
          }
        }
      } else {
        // Only tenant-specific or only global
        if (filters.tenantId === null) {
          conditions.push(isNull(kbArticles.tenantId));
        } else {
          conditions.push(eq(kbArticles.tenantId, filters.tenantId));
        }
      }
    }
    
    const results = await db
      .select()
      .from(kbArticles)
      .where(and(...conditions))
      .orderBy(desc(kbArticles.createdAt));
      
    // Apply filterOutArmed for tenant-specific requests
    if (filters?.tenantId && filters.tenantId !== null) {
      return await this.filterOutArmed(filters.tenantId, 'kb_articles', results);
    }
    
    return results;
  }

  async getKbArticleBySlug(slug: string): Promise<KbArticle | undefined> {
    const [article] = await db
      .select()
      .from(kbArticles)
      .where(and(eq(kbArticles.slug, slug), eq(kbArticles.isActive, true)));
    return article;
  }

  async getKbArticleById(id: string): Promise<KbArticle | undefined> {
    const [article] = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, id));
    return article;
  }

  async createKbArticle(article: InsertKbArticle): Promise<KbArticle> {
    const [newArticle] = await db.insert(kbArticles).values(article).returning();
    return newArticle;
  }

  async updateKbArticle(id: string, article: Partial<InsertKbArticle>): Promise<KbArticle> {
    const [updatedArticle] = await db
      .update(kbArticles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(kbArticles.id, id))
      .returning();
    return updatedArticle;
  }

  async softDeleteKbArticle(id: string): Promise<KbArticle> {
    const [deletedArticle] = await db
      .update(kbArticles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(kbArticles.id, id))
      .returning();
    return deletedArticle;
  }

  // Knowledge Base Feedback
  async getKbFeedback(articleId: string, userId: string): Promise<KbFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(kbFeedback)
      .where(and(eq(kbFeedback.articleId, articleId), eq(kbFeedback.userId, userId)));
    return feedback;
  }

  async upsertKbFeedback(feedback: InsertKbFeedback): Promise<KbFeedback> {
    const [result] = await db
      .insert(kbFeedback)
      .values(feedback)
      .onConflictDoUpdate({
        target: [kbFeedback.articleId, kbFeedback.userId],
        set: {
          isHelpful: feedback.isHelpful,
          createdAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Seed sample knowledge base articles for demonstration
  async seedKnowledgeBaseArticles(): Promise<void> {
    // Check if articles already exist
    const existingArticles = await db
      .select({ id: kbArticles.id })
      .from(kbArticles)
      .where(eq(kbArticles.isActive, true))
      .limit(1);

    if (existingArticles.length > 0) {
      return; // Already seeded
    }

    // Get first admin user for article authorship
    const adminUsers = await db.select().from(users).limit(1);
    if (!adminUsers.length) {
      throw new Error("No admin user found to create articles");
    }

    const adminUserId = adminUsers[0].id;
    const sampleArticles = [
      {
        title: "Getting Started with DeelRxCRM",
        slug: "getting-started-guide",
        contentMd: `# Getting Started with DeelRxCRM

Welcome to DeelRxCRM, your comprehensive business management solution! This guide will walk you through the essential features and help you get started quickly.

## Quick Setup

1. **Complete Your Profile**: Make sure your pharmacy information is accurate in Settings
2. **Add Your First Products**: Go to Inventory → Add Product to start building your catalog
3. **Set Up Customers**: Use the Customer Management section to add regular customers
4. **Configure Payment Methods**: Set up your preferred payment processing options

## Key Features Overview

### Dashboard
Your central hub for monitoring daily operations, revenue tracking, and important alerts.

### Inventory Management
- Track medications and products
- Set minimum stock thresholds
- Manage batch information and expiration dates
- Monitor stock levels in real-time

### Customer Management
- Store customer contact information
- Track loyalty program participation
- Manage credit accounts and payment preferences
- View customer purchase history

### Sales Point of Sale
- Quick product search and selection
- Built-in pricing calculators
- Multiple payment method support
- Automatic tax calculation

## Getting Help

- Use **Ctrl+?** or **F1** to open the quick help overlay
- Look for the **?** icons next to features for contextual help
- Visit the full Help section for comprehensive documentation
- Contact support if you need additional assistance

*Need more detailed guidance? Try the guided tour by clicking the tour button in the help section!*`,
        category: "getting_started" as const,
        tags: ["setup", "overview", "basics"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null, // Global article
      },
      {
        title: "Managing Your Inventory",
        slug: "inventory-management-guide",
        contentMd: `# Managing Your Inventory

Effective inventory management is crucial for business operations. This guide covers all aspects of tracking products and inventory in DeelRxCRM.

## Adding Products

1. Navigate to **Inventory Management**
2. Click **Add Product**
3. Fill in product details:
   - Product name
   - NDC code (if applicable)
   - Product type (solid, liquid, other)
   - Unit of measurement
   - Description

## Batch Tracking

### Adding Batches
- Click **Add Batch** to record new inventory receipts
- Include supplier information
- Record acquisition costs
- Set expiration dates where applicable

### Batch Benefits
- Track product sources for safety recalls
- Monitor costs and profit margins
- Manage expiration date compliance
- Maintain accurate inventory records

## Stock Level Monitoring

### Automatic Alerts
- Set minimum stock thresholds for each product
- Receive dashboard alerts when items run low
- Track projected stockout dates
- Monitor fast-moving vs. slow-moving inventory

### Stock Status Indicators
- **In Stock**: Above minimum threshold
- **Low Stock**: Below threshold, needs reordering  
- **Out of Stock**: Zero quantity available

## Inventory Reports

Access detailed reports for:
- Current stock levels
- Product movement history
- Cost analysis
- Expiration date tracking

## Best Practices

1. **Regular Audits**: Perform periodic physical counts
2. **Accurate Records**: Keep batch information up to date
3. **Proactive Reordering**: Monitor alerts and reorder before stockouts
4. **Supplier Management**: Maintain good supplier relationships

*Pro Tip: Use the search function to quickly find products by name or NDC code during busy periods.*`,
        category: "features" as const,
        tags: ["inventory", "products", "batches", "stock"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      },
      {
        title: "Customer Management and Loyalty Programs",
        slug: "customer-management",
        contentMd: `# Customer Management and Loyalty Programs

Building strong customer relationships is essential for pharmacy success. Learn how to effectively manage customer information and loyalty programs.

## Adding New Customers

1. Go to **Customer Management**
2. Click **Add Customer** 
3. Enter customer information:
   - Full name
   - Phone number
   - Email address (optional)
   - Delivery preferences
   - Payment preferences
   - Special notes

## Customer Profiles

### Contact Information
- Store multiple contact methods
- Track preferred communication channels
- Update information as needed

### Preferences Management
- **Delivery Options**: Pickup vs. delivery preference
- **Payment Methods**: Cash, card, or credit account
- **Special Instructions**: Allergies, accessibility needs, etc.

## Loyalty Program Features

### Tier System
- **Bronze**: Entry level (0-999 points)
- **Silver**: Regular customers (1,000-4,999 points)  
- **Gold**: Valued customers (5,000-9,999 points)
- **Platinum**: VIP customers (10,000+ points)

### Earning Points
- 1 point per $1 spent
- Bonus point promotions
- Special event rewards
- Referral bonuses

### Redeeming Rewards
- Points can be redeemed for discounts
- Special member pricing on select items
- Priority delivery service
- Exclusive access to health programs

## Credit Account Management

### Setting Up Credit
- Establish credit limits based on customer history
- Set payment terms and due dates
- Monitor credit utilization

### Credit Monitoring
- Track outstanding balances
- Identify overdue accounts
- Send payment reminders
- Manage credit holds when necessary

## Customer Service Best Practices

1. **Personalized Service**: Use customer history to provide relevant recommendations
2. **Privacy Protection**: Secure handling of medical and personal information
3. **Communication**: Regular updates on prescriptions and health programs
4. **Feedback Collection**: Use feedback to improve services

*Remember: Happy customers become loyal customers who drive long-term business success.*`,
        category: "features" as const,
        tags: ["customers", "loyalty", "credit", "relationships"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      },
      {
        title: "Sales Point of Sale System",
        slug: "sales-pos-system",
        contentMd: `# Sales Point of Sale System

The Sales POS system streamlines transaction processing and order management. Learn to process sales efficiently and accurately.

## Processing a Sale

### Basic Transaction Flow
1. **Search Products**: Use the search bar to find items quickly
2. **Add to Cart**: Click on products to add them to the current order
3. **Select Customer**: Choose an existing customer or process as walk-in
4. **Choose Payment Method**: Cash, card, or credit account
5. **Complete Transaction**: Process payment and print receipt

## Product Selection Tools

### Quick Search
- Search by product name
- Search by NDC code
- Filter results in real-time
- Visual product cards with pricing

### Pricing Information
- Current pricing displayed
- Stock availability indicator
- Automatic quantity pricing updates

## Built-in Calculators

### Quantity to Price Calculator
- Enter desired quantity
- Get exact total cost
- Useful for bulk purchases
- Helps with price quotes

### Amount to Quantity Calculator  
- Enter target dollar amount
- Get suggested quantity that best fits budget
- Shows exact change amount
- Perfect for insurance copays

## Payment Processing

### Supported Payment Methods
- **Cash**: Simple cash transactions
- **Card**: Credit and debit card processing
- **Credit**: Customer credit accounts
- **Custom**: Other payment arrangements

### Payment Features
- Automatic tax calculation
- Split payment support
- Receipt generation
- Transaction history tracking

## Order Management

### Order Status Tracking
- Draft orders (in progress)
- Confirmed orders (ready for fulfillment)
- Paid orders (payment completed)
- Voided orders (cancelled transactions)

### Customer Information
- Link orders to customer profiles
- Track customer purchase history
- Apply loyalty point earnings
- Manage credit account charges

## Tips for Efficient Operation

1. **Keyboard Shortcuts**: Learn common shortcuts for faster processing
2. **Product Favorites**: Keep frequently sold items easily accessible
3. **Batch Processing**: Handle multiple prescriptions together when possible
4. **Accurate Records**: Double-check quantities and pricing before completing sales

## Troubleshooting Common Issues

- **Payment Failures**: Check connection and retry
- **Pricing Errors**: Verify product information and batch costs
- **Inventory Mismatches**: Perform spot checks and adjust as needed

*The POS system automatically updates inventory levels and customer records with each completed transaction.*`,
        category: "features" as const,
        tags: ["sales", "pos", "payments", "transactions"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      },
      {
        title: "Common Technical Issues and Solutions",
        slug: "troubleshooting-guide",
        contentMd: `# Common Technical Issues and Solutions

This guide helps you resolve common technical issues quickly and efficiently.

## Login and Authentication Issues

### Cannot Log In
**Problem**: Unable to access your account

**Solutions**:
1. Verify your email address is correct
2. Check if Caps Lock is enabled
3. Try clearing your browser cache and cookies
4. Use an incognito/private browsing window
5. Contact support if issues persist

### Session Expired Messages
**Problem**: Getting logged out frequently

**Solutions**:
- Check your internet connection stability
- Avoid leaving the system idle for extended periods
- Refresh the page and log in again
- Contact support for session length adjustments

## Data Loading Problems

### Slow Page Loading
**Problem**: Pages take too long to load

**Solutions**:
1. Check your internet connection speed
2. Clear browser cache and reload
3. Close unnecessary browser tabs
4. Try a different browser
5. Restart your browser or device

### Missing Data or Empty Tables
**Problem**: Expected data not displaying

**Solutions**:
- Refresh the page (F5 or Ctrl+R)
- Check filter settings - clear all filters
- Verify you have data for the selected date range
- Confirm you have proper permissions for the data
- Contact support if data should exist but isn't visible

## Inventory and Product Issues

### Product Not Found in Search
**Problem**: Cannot locate products during sales

**Solutions**:
- Check spelling of product name
- Try searching by NDC code instead
- Use partial name matches
- Verify product is active in inventory
- Check if product exists in your catalog

### Stock Level Discrepancies  
**Problem**: Displayed stock doesn't match physical count

**Solutions**:
1. Perform a manual inventory count
2. Check for recent transactions that may not have updated
3. Review adjustment history for the product
4. Use the inventory adjustment feature to correct levels
5. Contact support for persistent discrepancies

## Payment Processing Issues

### Payment Failures
**Problem**: Card payments being declined or failing

**Solutions**:
- Verify card information is entered correctly
- Check if card is expired
- Confirm sufficient funds are available
- Try processing as a different payment type
- Contact payment processor support

### Missing Transaction Records
**Problem**: Completed sales not appearing in records

**Solutions**:
- Check the correct date range in reports
- Verify transaction wasn't voided
- Look in the appropriate tenant's records
- Refresh the transactions page
- Contact support with transaction details

## Browser and System Issues

### Browser Compatibility
**Supported Browsers**:
- Chrome (recommended)
- Firefox
- Safari
- Edge

**Solutions for browser issues**:
- Update to the latest browser version
- Enable JavaScript and cookies
- Disable browser extensions temporarily
- Clear browser data and restart

### Mobile Device Issues
**Problem**: Difficulty using system on mobile

**Solutions**:
- Use landscape orientation for better visibility
- Zoom in on small text or buttons
- Try the desktop version if mobile view is limited
- Ensure stable internet connection

## Getting Additional Help

### Before Contacting Support
1. Note the exact error message (screenshot if possible)
2. Record what you were trying to do when the issue occurred
3. Note your browser type and version
4. Try the basic troubleshooting steps above

### Contact Information
- **Email**: support@deelzrcrm.com
- **Response Time**: Within 24 hours for most issues
- **Emergency Support**: Available for critical system issues

### Information to Include
- Your pharmacy name and location
- Description of the problem
- Steps you've already tried
- Screenshots or error messages
- Time when the issue occurred

*Most issues can be resolved quickly with basic troubleshooting. Don't hesitate to contact support for persistent problems.*`,
        category: "troubleshooting" as const,
        tags: ["troubleshooting", "technical", "issues", "support"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      },
      {
        title: "Billing and Payment Information",
        slug: "billing-payment-info",
        contentMd: `# Billing and Payment Information

Understanding your DeelRxCRM billing, payment processing, and subscription management.

## Subscription Plans

### Core Plan - $20/month per user
**Features included**:
- Complete pharmacy management system
- Unlimited products and customers
- Basic reporting and analytics
- Email support
- Mobile app access
- Data backup and security

### Enterprise Plan - Custom Pricing
**Additional features**:
- Advanced reporting and insights
- API access for integrations
- Priority phone support
- Custom training sessions
- Dedicated account manager

## Billing Cycle

### Monthly Billing
- Charged on the same day each month
- Automatic billing to your payment method
- Email receipt sent within 24 hours
- Usage-based charges included

### Annual Billing
- 12 months paid in advance
- 10% discount compared to monthly billing
- Single annual invoice
- Locked-in pricing for the year

## Payment Methods

### Accepted Payment Types
- Credit cards (Visa, MasterCard, American Express)
- Business bank accounts (ACH)
- PayPal for some regions

### Payment Processing
- Secure encryption for all transactions
- PCI-DSS compliant payment handling
- Automatic retry for failed payments
- Payment method updates through account settings

## Transaction Processing Fees

### Stripe Integration
- **Standard Processing**: 2.9% + 30¢ per transaction
- **International Cards**: Additional 1.5% fee
- **Business Cards**: Additional 0.8% fee

### Fee Structure
- Processing fees are separate from subscription costs
- Fees automatically calculated and included in payouts
- Monthly fee summary available in reports
- Volume discounts available for high-volume pharmacies

## Invoicing and Receipts

### Automatic Invoicing
- Invoices generated monthly on billing date
- Emailed to account administrator
- Available for download in account settings
- Includes subscription and usage charges

### Receipt Management
- All payment receipts stored in account history
- Downloadable PDF format
- Integration with accounting software
- Tax information included where applicable

## Account Changes

### Adding Users
- New users prorated for current billing period
- Charges appear on next invoice
- Immediate access after payment confirmation

### Removing Users
- Credits applied to next billing cycle
- 30-day notice recommended
- Data retention during transition period

### Plan Changes
- Upgrades effective immediately
- Downgrades at next billing cycle
- Prorated charges for partial periods

## Payment Issues

### Failed Payments
**Common causes**:
- Expired credit card
- Insufficient funds
- Billing address mismatch
- Bank security holds

**Resolution steps**:
1. Update payment method in account settings
2. Contact your bank if needed
3. Manual payment processing available
4. Account suspension after 10 days of failed payments

### Dispute Resolution
- Contact support within 30 days of charge
- Provide detailed explanation of dispute
- Documentation review process
- Resolution typically within 5-7 business days

## Tax Information

### Sales Tax
- Applied based on pharmacy location
- Rates updated automatically
- Itemized on all invoices
- Tax exemption certificates accepted

### International Customers
- VAT applied for European customers
- Currency conversion at time of payment
- Local tax requirements may apply
- Region-specific billing support available

## Support and Account Management

### Billing Support
- **Email**: billing@deelzrcrm.com
- **Phone**: Available during business hours
- **Response Time**: Within 24 hours

### Account Access
- Primary account holder manages billing
- Additional users can view invoices (with permission)
- Account transfer process available
- Data export before account closure

*Keep your payment information updated to avoid service interruptions. Contact billing support for any payment-related questions.*`,
        category: "billing" as const,
        tags: ["billing", "payments", "subscription", "pricing"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      },
      {
        title: "API Documentation and Integration Guide",
        slug: "api-integration-guide",
        contentMd: `# API Documentation and Integration Guide

Learn how to integrate with DeelRxCRM APIs for custom workflows and external system connections.

## Getting Started with APIs

### API Access Requirements
- Enterprise subscription plan required
- API keys generated through admin settings
- Rate limiting: 1000 requests per hour
- RESTful JSON APIs with standard HTTP methods

### Authentication
All API requests require authentication using API keys:

\`\`\`http
Authorization: Bearer your-api-key-here
Content-Type: application/json
\`\`\`

### Base URL
\`\`\`
https://api.deelzrcrm.com/v1
\`\`\`

## Core Endpoints

### Inventory Management

#### Get Products
\`\`\`http
GET /api/products
\`\`\`

**Parameters**:
- \`search\` (optional): Product name or NDC filter
- \`category\` (optional): Product category filter
- \`limit\` (optional): Results per page (default: 50)
- \`offset\` (optional): Pagination offset

**Response**:
\`\`\`json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Aspirin 325mg",
      "ndc_code": "12345-678-90",
      "current_stock": 150,
      "unit_price": 12.99,
      "category": "otc"
    }
  ],
  "total": 1,
  "has_more": false
}
\`\`\`

#### Update Stock Levels
\`\`\`http
PUT /api/products/{product_id}/stock
\`\`\`

**Request Body**:
\`\`\`json
{
  "quantity": 200,
  "reason": "restock",
  "notes": "Weekly inventory delivery"
}
\`\`\`

### Customer Management

#### Create Customer
\`\`\`http
POST /api/customers
\`\`\`

**Request Body**:
\`\`\`json
{
  "name": "John Smith",
  "email": "john@example.com", 
  "phone": "(555) 123-4567",
  "preferred_delivery": "pickup",
  "loyalty_program": true
}
\`\`\`

#### Get Customer Details
\`\`\`http
GET /api/customers/{customer_id}
\`\`\`

### Order Processing

#### Create Order
\`\`\`http
POST /api/orders
\`\`\`

**Request Body**:
\`\`\`json
{
  "customer_id": "cust_123",
  "items": [
    {
      "product_id": "prod_456",
      "quantity": 2,
      "unit_price": 15.99
    }
  ],
  "payment_method": "card",
  "delivery_method": "pickup"
}
\`\`\`

#### Get Order Status
\`\`\`http
GET /api/orders/{order_id}
\`\`\`

## Webhook Notifications

### Setting Up Webhooks
Configure webhook URLs in your account settings to receive real-time notifications:

- **Order Events**: \`order.created\`, \`order.paid\`, \`order.completed\`
- **Inventory Events**: \`product.low_stock\`, \`product.out_of_stock\`
- **Customer Events**: \`customer.created\`, \`customer.updated\`

### Webhook Payload Example
\`\`\`json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "ord_789",
    "customer_id": "cust_123",
    "total_amount": 47.98,
    "status": "pending"
  }
}
\`\`\`

## Integration Examples

### Inventory Sync Script (Python)
\`\`\`python
import requests

API_KEY = "your-api-key"
BASE_URL = "https://api.deelzrcrm.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get low stock items
response = requests.get(
    f"{BASE_URL}/api/products",
    params={"stock_level": "low"},
    headers=headers
)

low_stock_items = response.json()["products"]
print(f"Found {len(low_stock_items)} low stock items")
\`\`\`

### Customer Loyalty Integration (JavaScript)
\`\`\`javascript
const updateLoyaltyPoints = async (customerId, points) => {
  const response = await fetch(\`\${BASE_URL}/api/customers/\${customerId}/loyalty\`, {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      points_earned: points,
      transaction_type: 'purchase'
    })
  });
  
  return response.json();
};
\`\`\`

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation errors)
- **401**: Unauthorized (invalid API key)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Internal server error

### Error Response Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required field 'name' is missing",
    "details": {
      "field": "name",
      "required": true
    }
  }
}
\`\`\`

## Rate Limiting and Best Practices

### Rate Limits
- **Standard Plan**: 500 requests/hour
- **Enterprise Plan**: 1000 requests/hour
- **Burst allowance**: Up to 50 requests/minute

### Best Practices
1. **Cache responses** when possible to reduce API calls
2. **Use pagination** for large datasets
3. **Implement exponential backoff** for retries
4. **Validate data locally** before sending to API
5. **Monitor rate limits** using response headers

### Response Headers
\`\`\`http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642284000
\`\`\`

## Support and Resources

### API Support
- **Documentation**: https://docs.pharmacare.com/api
- **Support Email**: api-support@pharmacare.com
- **Community Forum**: https://community.pharmacare.com
- **Status Page**: https://status.pharmacare.com

### SDKs and Libraries
- **PHP SDK**: Available on GitHub
- **Python SDK**: Available via PyPI
- **Node.js SDK**: Available via NPM
- **C# SDK**: Available via NuGet

*API access requires an Enterprise subscription. Contact sales for pricing and setup assistance.*`,
        category: "api" as const,
        tags: ["api", "integration", "development", "technical"],
        isActive: true,
        createdBy: adminUserId,
        tenantId: null,
      }
    ];

    // Insert all articles
    await db.insert(kbArticles).values(sampleArticles);
    console.log(`Seeded ${sampleArticles.length} knowledge base articles`);
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [result] = await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userSettings.userId],
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Encryption Support Methods
  async isEncryptionEnabled(tenantId: string): Promise<boolean> {
    try {
      const tenantFlags = await this.getTenantFeatureFlags(tenantId);
      return tenantFlags['encryption_enabled'] || false;
    } catch (error) {
      console.error(`Failed to check encryption status for tenant ${tenantId}:`, error);
      return false;
    }
  }

  async createCustomerEncrypted(customer: InsertCustomer): Promise<Customer> {
    try {
      const { tenantId } = customer;
      const encryptionEnabled = await this.isEncryptionEnabled(tenantId);
      
      if (encryptionEnabled) {
        // SECURITY FIX: Only store encrypted data, clear plaintext fields
        const customerData = {
          ...customer,
          // Clear plaintext fields for security
          name: null,
          phone: null,
          email: null,
          notes: null,
          // Store only encrypted versions of sensitive fields
          nameEnc: customer.name ? await encryptOptional(tenantId, customer.name) : null,
          phoneEnc: customer.phone ? await encryptOptional(tenantId, customer.phone) : null,
          emailEnc: customer.email ? await encryptOptional(tenantId, customer.email) : null,
          notesEnc: customer.notes ? await encryptOptional(tenantId, customer.notes) : null,
        };
        
        const [newCustomer] = await db.insert(customers).values(customerData).returning();
        return newCustomer;
      } else {
        // Fallback to regular customer creation if encryption is disabled
        return this.createCustomer(customer);
      }
    } catch (error) {
      console.error(`Failed to create encrypted customer for tenant ${customer.tenantId}:`, error);
      throw new Error("Failed to create customer");
    }
  }

  async getCustomerDecrypted(id: string, tenantId: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
      
      if (!customer) {
        return undefined;
      }
      
      const encryptionEnabled = await this.isEncryptionEnabled(tenantId);
      
      if (encryptionEnabled && customer.nameEnc) {
        // If encrypted data exists and encryption is enabled, decrypt it
        const decryptedCustomer = {
          ...customer,
          name: customer.nameEnc ? await decryptOptional(tenantId, customer.nameEnc) : customer.name,
          phone: customer.phoneEnc ? await decryptOptional(tenantId, customer.phoneEnc) : customer.phone,
          email: customer.emailEnc ? await decryptOptional(tenantId, customer.emailEnc) : customer.email,
          notes: customer.notesEnc ? await decryptOptional(tenantId, customer.notesEnc) : customer.notes,
        };
        
        return decryptedCustomer;
      }
      
      // Return customer as-is if encryption is not enabled or no encrypted data exists
      return customer;
    } catch (error) {
      console.error(`Failed to get decrypted customer ${id} for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve customer");
    }
  }

  // Delivery encryption methods
  async getDeliveriesDecrypted(tenantId: string): Promise<Array<{
    id: string;
    orderId: string;
    method: string;
    addressLine1: string;
    city: string;
    state: string;
    fee: string;
    status: string;
    createdAt: Date | null;
    orderTotal: string;
    customerName: string;
    customerPhone?: string;
  }>> {
    try {
      // Get raw delivery data with encrypted fields
      const results = await db
        .select({
          id: deliveries.id,
          orderId: deliveries.orderId,
          method: deliveries.method,
          addressLine1: deliveries.addressLine1,
          city: deliveries.city,
          state: deliveries.state,
          fee: deliveries.fee,
          status: deliveries.status,
          createdAt: deliveries.createdAt,
          orderTotal: orders.total,
          customerName: customers.name,
          customerPhone: customers.phone,
          // Include encrypted fields for potential decryption
          addressLine1Enc: deliveries.addressLine1Enc,
          cityEnc: deliveries.cityEnc,
          stateEnc: deliveries.stateEnc,
          postalCodeEnc: deliveries.postalCodeEnc,
        })
        .from(deliveries)
        .innerJoin(orders, eq(deliveries.orderId, orders.id))
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(deliveries.tenantId, tenantId))
        .orderBy(desc(deliveries.createdAt));

      const encryptionEnabled = await this.isEncryptionEnabled(tenantId);

      // Filter out armed deliveries if self-destruct is enabled
      const filteredResults = await this.filterOutArmed(tenantId, 'deliveries', results);

      // Decrypt delivery addresses if encryption is enabled
      if (encryptionEnabled) {
        const decryptedResults = await Promise.all(
          filteredResults.map(async (result) => {
            return {
              ...result,
              addressLine1: result.addressLine1Enc
                ? await decryptOptional(tenantId, result.addressLine1Enc) || result.addressLine1 || ''
                : result.addressLine1 || '',
              city: result.cityEnc
                ? await decryptOptional(tenantId, result.cityEnc) || result.city || ''
                : result.city || '',
              state: result.stateEnc
                ? await decryptOptional(tenantId, result.stateEnc) || result.state || ''
                : result.state || '',
              customerName: result.customerName || 'Walk-in Customer',
              customerPhone: result.customerPhone || undefined,
            };
          })
        );
        return decryptedResults;
      }

      // Return regular results if encryption is not enabled
      return filteredResults.map(r => ({
        ...r,
        customerName: r.customerName || 'Walk-in Customer',
        addressLine1: r.addressLine1 || '',
        city: r.city || '',
        state: r.state || '',
        customerPhone: r.customerPhone || undefined,
      }));
    } catch (error) {
      console.error(`Failed to get decrypted deliveries for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve deliveries");
    }
  }

  async createDeliveryEncrypted(delivery: any): Promise<any> {
    try {
      const { tenantId } = delivery;
      const encryptionEnabled = await this.isEncryptionEnabled(tenantId);
      
      if (encryptionEnabled) {
        // SECURITY FIX: Only store encrypted data, clear plaintext fields
        const deliveryData = {
          ...delivery,
          // Clear plaintext fields for security
          addressLine1: null,
          city: null,
          state: null,
          postalCode: null,
          // Store only encrypted versions of sensitive fields
          addressLine1Enc: delivery.addressLine1 ? await encryptOptional(tenantId, delivery.addressLine1) : null,
          cityEnc: delivery.city ? await encryptOptional(tenantId, delivery.city) : null,
          stateEnc: delivery.state ? await encryptOptional(tenantId, delivery.state) : null,
          postalCodeEnc: delivery.postalCode ? await encryptOptional(tenantId, delivery.postalCode) : null,
        };
        
        const [newDelivery] = await db.insert(deliveries).values(deliveryData).returning();
        return newDelivery;
      } else {
        // Fallback to regular delivery creation if encryption is disabled
        const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
        return newDelivery;
      }
    } catch (error) {
      console.error(`Failed to create encrypted delivery for tenant ${delivery.tenantId}:`, error);
      throw new Error("Failed to create delivery");
    }
  }

  // Feature Flag Seeding
  async seedFeatureFlags(): Promise<void> {
    try {
      // Check if feature flags already exist
      const existingFlags = await db.select().from(featureFlags).limit(1);
      if (existingFlags.length > 0) {
        return; // Already seeded
      }

      // Define critical feature flags including encryption
      const coreFeatureFlags = [
        {
          key: 'encryption_enabled',
          description: 'Enable end-to-end encryption for sensitive customer and delivery data. When enabled, sensitive fields are encrypted at rest using tenant-specific keys.',
          defaultEnabled: false, // Default to false for security and opt-in approach
        },
        {
          key: 'advanced_analytics',
          description: 'Enable advanced analytics and reporting features',
          defaultEnabled: true,
        },
        {
          key: 'api_access',
          description: 'Enable API access for third-party integrations',
          defaultEnabled: false,
        },
        {
          key: 'multi_location',
          description: 'Enable multi-location support for pharmacy chains',
          defaultEnabled: false,
        },
        {
          key: 'automated_reordering',
          description: 'Enable automated inventory reordering based on thresholds',
          defaultEnabled: true,
        },
        {
          key: 'self_destruct_enabled',
          description: 'Enable self-destructible content system for enhanced data security. Allows armed content to be automatically destroyed based on TTL.',
          defaultEnabled: false, // Default to false for security and controlled rollout
        },
        {
          key: 'inactivity_auto_delete',
          description: 'Enable inactivity-based auto-deletion policy system. Automatically warns, arms, or deletes inactive tenant data based on configurable policies.',
          defaultEnabled: false, // Default to false for controlled rollout and safety
        },
        {
          key: 'inactivity_auto_delete_warn_only',
          description: 'When enabled, inactivity system will only warn and arm records without performing actual deletions. Safety override for testing and gradual rollout.',
          defaultEnabled: true, // Default to true for maximum safety during rollout
        },
        {
          key: 'inactivity_activity_tracking',
          description: 'Enable activity tracking for inactivity policy system. Required for inactivity detection but can be independently controlled.',
          defaultEnabled: true, // Default to true as it\'s safe and required for the system
        },
      ];

      // Insert all feature flags
      await db.insert(featureFlags).values(coreFeatureFlags);
      console.log(`Seeded ${coreFeatureFlags.length} feature flags including encryption support`);
    } catch (error) {
      console.error('Failed to seed feature flags:', error);
      throw new Error('Feature flag seeding failed');
    }
  }

  // Self-Destruct Management Implementation
  async isSelfDestructEnabled(tenantId: string): Promise<boolean> {
    const tenantFlags = await this.getTenantFeatureFlags(tenantId);
    return tenantFlags['self_destruct_enabled'] === true;
  }

  async getArmedIds(tenantId: string, targetTable: string): Promise<string[]> {
    const armedRecords = await db
      .select({ targetId: selfDestructs.targetId })
      .from(selfDestructs)
      .where(
        and(
          eq(selfDestructs.tenantId, tenantId),
          eq(selfDestructs.targetTable, targetTable),
          eq(selfDestructs.status, 'armed')
        )
      );
    
    return armedRecords.map(record => record.targetId);
  }

  async filterOutArmed<T extends { id: string }>(
    tenantId: string, 
    targetTable: string, 
    records: T[]
  ): Promise<T[]> {
    const isEnabled = await this.isSelfDestructEnabled(tenantId);
    if (!isEnabled) {
      return records; // Return all records if feature is disabled
    }

    const armedIds = await this.getArmedIds(tenantId, targetTable);
    if (armedIds.length === 0) {
      return records; // No armed records to filter
    }

    return records.filter(record => !armedIds.includes(record.id));
  }

  async armSelfDestruct(data: {
    tenantId: string;
    targetTable: string;
    targetId: string;
    armedBy: string;
    reason?: string;
    destructAt?: Date;
    metadata?: any;
  }): Promise<SelfDestruct> {
    try {
      // Check if self-destruct is enabled for this tenant
      const isEnabled = await this.isSelfDestructEnabled(data.tenantId);
      if (!isEnabled) {
        throw new Error('Self-destruct feature is not enabled for this tenant');
      }

      // Validate target record exists and belongs to tenant BEFORE any operations
      await this._validateTargetOwnership(data.tenantId, data.targetTable, data.targetId);

      // Check if already armed
      const existing = await db
        .select()
        .from(selfDestructs)
        .where(
          and(
            eq(selfDestructs.tenantId, data.tenantId),
            eq(selfDestructs.targetTable, data.targetTable),
            eq(selfDestructs.targetId, data.targetId),
            eq(selfDestructs.status, 'armed')
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Content is already armed for self-destruction');
      }

      // Create self-destruct record
      const [selfDestruct] = await db
        .insert(selfDestructs)
        .values({
          tenantId: data.tenantId,
          targetTable: data.targetTable,
          targetId: data.targetId,
          armedBy: data.armedBy,
          reason: data.reason,
          destructAt: data.destructAt,
          metadata: data.metadata,
          status: 'armed',
        })
        .returning();

      // Create audit log
      await this.createAuditLog({
        tenantId: data.tenantId,
        targetTable: data.targetTable,
        targetId: data.targetId,
        action: 'arm_self_destruct',
        actor: data.armedBy,
        actorType: 'user',
        reason: data.reason,
        metadata: {
          selfDestructId: selfDestruct.id,
          destructAt: data.destructAt?.toISOString(),
          ...data.metadata,
        },
      });

      return selfDestruct;
    } catch (error) {
      console.error('Failed to arm self-destruct:', error);
      throw error;
    }
  }

  async disarmSelfDestruct(
    id: string, 
    tenantId: string, 
    disarmedBy: string, 
    reason?: string
  ): Promise<SelfDestruct> {
    try {
      // Check if self-destruct is enabled for this tenant
      const isEnabled = await this.isSelfDestructEnabled(tenantId);
      if (!isEnabled) {
        throw new Error('Self-destruct feature is not enabled for this tenant');
      }

      // Get the current self-destruct record
      const [current] = await db
        .select()
        .from(selfDestructs)
        .where(
          and(
            eq(selfDestructs.id, id),
            eq(selfDestructs.tenantId, tenantId),
            eq(selfDestructs.status, 'armed')
          )
        );

      if (!current) {
        throw new Error('Armed self-destruct record not found');
      }

      // Validate target still exists and belongs to tenant
      await this._validateTargetOwnership(tenantId, current.targetTable, current.targetId);

      // Update status to disarmed
      const [disarmed] = await db
        .update(selfDestructs)
        .set({
          status: 'disarmed',
          disarmedBy,
        })
        .where(eq(selfDestructs.id, id))
        .returning();

      // Create audit log
      await this.createAuditLog({
        tenantId,
        targetTable: current.targetTable,
        targetId: current.targetId,
        action: 'disarm_self_destruct',
        actor: disarmedBy,
        actorType: 'user',
        reason,
        metadata: {
          selfDestructId: id,
          originalArmedBy: current.armedBy,
        },
      });

      return disarmed;
    } catch (error) {
      console.error('Failed to disarm self-destruct:', error);
      throw error;
    }
  }

  async destroyNow(
    id: string, 
    tenantId: string, 
    destroyedBy: string, 
    reason?: string
  ): Promise<void> {
    return this._destroyNowInternal(id, tenantId, destroyedBy, 'user', reason);
  }

  async destroyNowSystem(
    id: string, 
    tenantId: string, 
    reason?: string
  ): Promise<void> {
    return this._destroyNowInternal(id, tenantId, null, 'sweeper', reason);
  }

  private async _destroyNowInternal(
    id: string, 
    tenantId: string, 
    destroyedBy: string | null, 
    actorType: 'user' | 'sweeper',
    reason?: string
  ): Promise<void> {
    const transaction = await db.transaction(async (tx) => {
      try {
        // Check if self-destruct is enabled for this tenant
        const isEnabled = await this.isSelfDestructEnabled(tenantId);
        if (!isEnabled) {
          throw new Error('Self-destruct feature is not enabled for this tenant');
        }

        // Get the current self-destruct record
        const [current] = await tx
          .select()
          .from(selfDestructs)
          .where(
            and(
              eq(selfDestructs.id, id),
              eq(selfDestructs.tenantId, tenantId),
              eq(selfDestructs.status, 'armed')
            )
          );

        if (!current) {
          throw new Error('Armed self-destruct record not found');
        }

        // Validate target record exists and belongs to tenant for security
        await this._validateTargetOwnership(tenantId, current.targetTable, current.targetId);

        // Perform hard deletion based on target table (within transaction)
        await this._performHardDeletionTransactional(tx, tenantId, current.targetTable, current.targetId);

        // Update self-destruct status
        await tx
          .update(selfDestructs)
          .set({
            status: 'destroyed',
            destroyedBy,
            destroyedAt: new Date(),
          })
          .where(eq(selfDestructs.id, id));

        // Create audit log
        await tx.insert(auditLogs).values({
          tenantId,
          targetTable: current.targetTable,
          targetId: current.targetId,
          action: actorType === 'sweeper' ? 'sweeper_destroy' : 'destroy_self_destruct',
          actor: destroyedBy,
          actorType: actorType,
          reason,
          metadata: {
            selfDestructId: id,
            originalArmedBy: current.armedBy,
            ...(actorType === 'sweeper' && {
              armedAt: current.armedAt?.toISOString(),
              sweeperRun: new Date().toISOString(),
            }),
          },
        });

        return current; // Return for logging purposes
      } catch (error) {
        console.error('Failed to destroy content:', error);
        throw error;
      }
    });
  }

  async getSelfDestructs(
    tenantId: string, 
    filters?: { status?: string; targetTable?: string }
  ): Promise<Array<SelfDestruct & { 
    targetTableName: string;
    armedByName?: string;
    disarmedByName?: string; 
    destroyedByName?: string;
  }>> {
    try {
      let query = db
        .select({
          selfDestruct: selfDestructs,
          armedByUser: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(selfDestructs)
        .leftJoin(users, eq(selfDestructs.armedBy, users.id))
        .where(eq(selfDestructs.tenantId, tenantId));

      if (filters?.status) {
        query = query.where(
          and(
            eq(selfDestructs.tenantId, tenantId),
            eq(selfDestructs.status, filters.status as any)
          )
        );
      }

      if (filters?.targetTable) {
        query = query.where(
          and(
            eq(selfDestructs.tenantId, tenantId),
            eq(selfDestructs.targetTable, filters.targetTable)
          )
        );
      }

      const results = await query.orderBy(desc(selfDestructs.armedAt));

      return results.map(result => ({
        ...result.selfDestruct,
        targetTableName: result.selfDestruct.targetTable,
        armedByName: result.armedByUser.firstName && result.armedByUser.lastName
          ? `${result.armedByUser.firstName} ${result.armedByUser.lastName}`
          : undefined,
      }));
    } catch (error) {
      console.error('Failed to get self-destructs:', error);
      throw error;
    }
  }

  // Audit Logs Implementation
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    try {
      const [auditLog] = await db.insert(auditLogs).values(log).returning();
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(
    tenantId: string, 
    filters?: { targetTable?: string; targetId?: string; action?: string }
  ): Promise<Array<AuditLog & { actorName?: string }>> {
    try {
      let query = db
        .select({
          auditLog: auditLogs,
          actorUser: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actor, users.id))
        .where(eq(auditLogs.tenantId, tenantId));

      if (filters?.targetTable) {
        query = query.where(
          and(
            eq(auditLogs.tenantId, tenantId),
            eq(auditLogs.targetTable, filters.targetTable)
          )
        );
      }

      if (filters?.targetId) {
        query = query.where(
          and(
            eq(auditLogs.tenantId, tenantId),
            eq(auditLogs.targetId, filters.targetId)
          )
        );
      }

      if (filters?.action) {
        query = query.where(
          and(
            eq(auditLogs.tenantId, tenantId),
            eq(auditLogs.action, filters.action as any)
          )
        );
      }

      const results = await query.orderBy(desc(auditLogs.createdAt));

      return results.map(result => ({
        ...result.auditLog,
        actorName: result.actorUser.firstName && result.actorUser.lastName
          ? `${result.actorUser.firstName} ${result.actorUser.lastName}`
          : undefined,
      }));
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  // Private method to validate target record exists and belongs to tenant
  private async _validateTargetOwnership(tenantId: string, targetTable: string, targetId: string): Promise<void> {
    let exists = false;
    
    switch (targetTable) {
      case 'customers':
        const customer = await db.select({ id: customers.id })
          .from(customers)
          .where(and(eq(customers.id, targetId), eq(customers.tenantId, tenantId)))
          .limit(1);
        exists = customer.length > 0;
        break;
      case 'orders':
        const order = await db.select({ id: orders.id })
          .from(orders)
          .where(and(eq(orders.id, targetId), eq(orders.tenantId, tenantId)))
          .limit(1);
        exists = order.length > 0;
        break;
      case 'deliveries':
        const delivery = await db.select({ id: deliveries.id })
          .from(deliveries)
          .where(and(eq(deliveries.id, targetId), eq(deliveries.tenantId, tenantId)))
          .limit(1);
        exists = delivery.length > 0;
        break;
      case 'payments':
        const payment = await db.select({ id: payments.id })
          .from(payments)
          .where(and(eq(payments.id, targetId), eq(payments.tenantId, tenantId)))
          .limit(1);
        exists = payment.length > 0;
        break;
      case 'credits':
        const credit = await db.select({ id: credits.id })
          .from(credits)
          .where(and(eq(credits.id, targetId), eq(credits.tenantId, tenantId)))
          .limit(1);
        exists = credit.length > 0;
        break;
      case 'kb_articles':
        const article = await db.select({ id: kbArticles.id })
          .from(kbArticles)
          .where(and(eq(kbArticles.id, targetId), or(eq(kbArticles.tenantId, tenantId), isNull(kbArticles.tenantId))))
          .limit(1);
        exists = article.length > 0;
        break;
      default:
        throw new Error(`Unsupported target table for validation: ${targetTable}`);
    }
    
    if (!exists) {
      throw new Error(`Target record not found or access denied: ${targetTable}:${targetId}`);
    }
  }

  // Private method for transactional hard deletion
  private async _performHardDeletionTransactional(tx: any, tenantId: string, targetTable: string, targetId: string): Promise<void> {
    switch (targetTable) {
      case 'customers':
        // Delete in order: credit_transactions -> credits -> loyalty_accounts -> orders -> customer
        await tx.delete(creditTransactions).where(
          and(
            eq(creditTransactions.tenantId, tenantId),
            eq(creditTransactions.customerId, targetId)
          )
        );
        await tx.delete(credits).where(
          and(
            eq(credits.tenantId, tenantId),
            eq(credits.customerId, targetId)
          )
        );
        await tx.delete(loyaltyAccounts).where(
          and(
            eq(loyaltyAccounts.tenantId, tenantId),
            eq(loyaltyAccounts.customerId, targetId)
          )
        );
        
        // Get customer orders for cascade deletion
        const customerOrders = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(
            and(
              eq(orders.tenantId, tenantId),
              eq(orders.customerId, targetId)
            )
          );
        
        // Delete order items and deliveries for each order
        for (const order of customerOrders) {
          await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));
          await tx.delete(deliveries).where(eq(deliveries.orderId, order.id));
        }
        
        // Delete orders
        await tx.delete(orders).where(
          and(
            eq(orders.tenantId, tenantId),
            eq(orders.customerId, targetId)
          )
        );
        
        // Finally delete the customer
        await tx.delete(customers).where(
          and(
            eq(customers.tenantId, tenantId),
            eq(customers.id, targetId)
          )
        );
        break;

      case 'orders':
        // Delete order items and deliveries first, then the order
        await tx.delete(orderItems).where(eq(orderItems.orderId, targetId));
        await tx.delete(deliveries).where(eq(deliveries.orderId, targetId));
        await tx.delete(orders).where(
          and(
            eq(orders.tenantId, tenantId),
            eq(orders.id, targetId)
          )
        );
        break;

      case 'deliveries':
        await tx.delete(deliveries).where(
          and(
            eq(deliveries.tenantId, tenantId),
            eq(deliveries.id, targetId)
          )
        );
        break;

      case 'payments':
        await tx.delete(payments).where(
          and(
            eq(payments.tenantId, tenantId),
            eq(payments.id, targetId)
          )
        );
        break;

      case 'credits':
        // Delete credit transactions first, then the credit account
        await tx.delete(creditTransactions).where(
          and(
            eq(creditTransactions.tenantId, tenantId),
            eq(creditTransactions.creditId, targetId)
          )
        );
        await tx.delete(credits).where(
          and(
            eq(credits.tenantId, tenantId),
            eq(credits.id, targetId)
          )
        );
        break;

      case 'kb_articles':
        // Delete feedback first, then the article
        await tx.delete(kbFeedback).where(eq(kbFeedback.articleId, targetId));
        await tx.delete(kbArticles).where(
          and(
            eq(kbArticles.id, targetId),
            or(
              eq(kbArticles.tenantId, tenantId),
              isNull(kbArticles.tenantId) // Global articles
            )
          )
        );
        break;

      default:
        throw new Error(`Unsupported target table for deletion: ${targetTable}`);
    }
  }

  // Public method for system-level hard deletion (used by sweeper)
  async performHardDeletion(tenantId: string, targetTable: string, targetId: string): Promise<void> {
    try {
      switch (targetTable) {
        case 'customers':
          // Delete in order: credit_transactions -> credits -> loyalty_accounts -> orders -> customer
          await db.delete(creditTransactions).where(
            and(
              eq(creditTransactions.tenantId, tenantId),
              eq(creditTransactions.customerId, targetId)
            )
          );
          await db.delete(credits).where(
            and(
              eq(credits.tenantId, tenantId),
              eq(credits.customerId, targetId)
            )
          );
          await db.delete(loyaltyAccounts).where(
            and(
              eq(loyaltyAccounts.tenantId, tenantId),
              eq(loyaltyAccounts.customerId, targetId)
            )
          );
          
          // Get customer orders for cascade deletion
          const customerOrders = await db
            .select({ id: orders.id })
            .from(orders)
            .where(
              and(
                eq(orders.tenantId, tenantId),
                eq(orders.customerId, targetId)
              )
            );
          
          // Delete order items and deliveries for each order
          for (const order of customerOrders) {
            await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
            await db.delete(deliveries).where(eq(deliveries.orderId, order.id));
          }
          
          // Delete orders
          await db.delete(orders).where(
            and(
              eq(orders.tenantId, tenantId),
              eq(orders.customerId, targetId)
            )
          );
          
          // Finally delete the customer
          await db.delete(customers).where(
            and(
              eq(customers.tenantId, tenantId),
              eq(customers.id, targetId)
            )
          );
          break;

        case 'orders':
          // Delete order items and deliveries first, then the order
          await db.delete(orderItems).where(eq(orderItems.orderId, targetId));
          await db.delete(deliveries).where(eq(deliveries.orderId, targetId));
          await db.delete(orders).where(
            and(
              eq(orders.tenantId, tenantId),
              eq(orders.id, targetId)
            )
          );
          break;

        case 'deliveries':
          await db.delete(deliveries).where(
            and(
              eq(deliveries.tenantId, tenantId),
              eq(deliveries.id, targetId)
            )
          );
          break;

        case 'payments':
          await db.delete(payments).where(
            and(
              eq(payments.tenantId, tenantId),
              eq(payments.id, targetId)
            )
          );
          break;

        case 'credits':
          // Delete credit transactions first, then the credit
          await db.delete(creditTransactions).where(
            and(
              eq(creditTransactions.tenantId, tenantId),
              eq(creditTransactions.customerId, targetId)
            )
          );
          await db.delete(credits).where(
            and(
              eq(credits.tenantId, tenantId),
              eq(credits.id, targetId)
            )
          );
          break;

        case 'credit_transactions':
          await db.delete(creditTransactions).where(
            and(
              eq(creditTransactions.tenantId, tenantId),
              eq(creditTransactions.id, targetId)
            )
          );
          break;

        case 'kb_articles':
          // Delete feedback first, then the article
          await db.delete(kbFeedback).where(eq(kbFeedback.articleId, targetId));
          await db.delete(kbArticles).where(eq(kbArticles.id, targetId));
          break;

        default:
          throw new Error(`Unsupported target table for hard deletion: ${targetTable}`);
      }
    } catch (error) {
      console.error(`Failed to perform hard deletion for ${targetTable}:${targetId}:`, error);
      throw error;
    }
  }

  // ================================
  // DANGER PURGE OPERATIONS - EXTREMELY SENSITIVE
  // ================================

  // Request a new purge operation
  async requestPurge(data: {
    tenantId: string;
    tenantName: string;
    requestedBy: string;
    reason: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<PurgeOperation> {
    try {
      // Check if there's already an active purge for this tenant
      const existingPurge = await db
        .select()
        .from(purgeOperations)
        .where(
          and(
            eq(purgeOperations.tenantId, data.tenantId),
            or(
              eq(purgeOperations.status, "pending"),
              eq(purgeOperations.status, "running")
            )
          )
        )
        .limit(1);

      if (existingPurge.length > 0) {
        throw new Error("A purge operation is already active for this tenant");
      }

      const [purgeOperation] = await db
        .insert(purgeOperations)
        .values({
          tenantId: data.tenantId,
          tenantName: data.tenantName,
          status: "pending",
          requestedBy: data.requestedBy,
          reason: data.reason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
        .returning();

      // Create audit log
      await this.createAuditLog({
        tenantId: data.tenantId,
        targetTable: "purge_operations",
        targetId: purgeOperation.id,
        action: "request_purge",
        actor: data.requestedBy,
        actorType: "user",
        reason: data.reason,
        metadata: {
          tenantName: data.tenantName,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to request purge:", error);
      throw error;
    }
  }

  // Acknowledge export completion
  async ackExport(purgeId: string, tenantId: string): Promise<PurgeOperation> {
    try {
      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          exportAckedAt: new Date(),
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            eq(purgeOperations.status, "pending")
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found or not in pending status");
      }

      // Create audit log
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "ack_export",
        actor: purgeOperation.requestedBy,
        actorType: "user",
        reason: "Export acknowledged",
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to acknowledge export:", error);
      throw error;
    }
  }

  // Schedule purge for execution
  async schedulePurge(
    purgeId: string,
    tenantId: string,
    scheduledAt: Date,
    confirmationToken: string
  ): Promise<PurgeOperation> {
    try {
      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          scheduledAt: scheduledAt,
          confirmationToken: confirmationToken,
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            eq(purgeOperations.status, "pending"),
            isNull(purgeOperations.exportAckedAt) === false
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found, not pending, or export not acknowledged");
      }

      // Create audit log
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "schedule_purge",
        actor: purgeOperation.requestedBy,
        actorType: "user",
        reason: "Purge scheduled for execution",
        metadata: {
          scheduledAt: scheduledAt.toISOString(),
        },
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to schedule purge:", error);
      throw error;
    }
  }

  // Cancel a pending purge
  async cancelPurge(
    purgeId: string,
    tenantId: string,
    canceledBy: string,
    reason?: string
  ): Promise<PurgeOperation> {
    try {
      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          status: "canceled",
          canceledAt: new Date(),
          canceledBy: canceledBy,
          reason: reason || "Purge canceled",
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            or(
              eq(purgeOperations.status, "pending"),
              eq(purgeOperations.status, "running")
            )
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found or not cancelable");
      }

      // Create audit log
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "cancel_purge",
        actor: canceledBy,
        actorType: "user",
        reason: reason || "Purge canceled",
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to cancel purge:", error);
      throw error;
    }
  }

  // Start purge execution
  async startPurge(purgeId: string, tenantId: string): Promise<PurgeOperation> {
    try {
      // DEFENSE-IN-DEPTH: Secondary authorization check before starting purge
      console.warn(`🔒 SECONDARY SECURITY CHECK: Verifying danger_purge feature flag for tenant ${tenantId} before starting purge ${purgeId}`);
      
      const featureFlags = await this.getTenantFeatureFlags(tenantId);
      if (!featureFlags['danger_purge']) {
        console.error(`🚨 SECURITY BLOCK: Attempted to start purge on tenant ${tenantId} with disabled danger_purge feature`);
        throw new Error("CRITICAL: Danger purge feature is not enabled for this tenant - aborting purge start");
      }
      
      // Verify export acknowledgment for safety
      const [purgeOp] = await db
        .select()
        .from(purgeOperations)
        .where(and(eq(purgeOperations.id, purgeId), eq(purgeOperations.tenantId, tenantId)))
        .limit(1);
      
      if (!purgeOp) {
        throw new Error(`Purge operation ${purgeId} not found for tenant ${tenantId}`);
      }
      
      if (!purgeOp.exportAckedAt) {
        console.error(`🚨 SECURITY BLOCK: Attempted to start purge ${purgeId} without export acknowledgment`);
        throw new Error("CRITICAL: Export must be acknowledged before starting purge operation");
      }
      
      console.warn(`✅ SECONDARY SECURITY CHECK PASSED: Starting purge ${purgeId} for tenant ${tenantId}`);

      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          status: "running",
          startedAt: new Date(),
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            eq(purgeOperations.status, "pending"),
            isNull(purgeOperations.scheduledAt) === false
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found, not pending, or not scheduled");
      }

      // Create comprehensive audit log for starting the purge
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "start_purge",
        actor: null,
        actorType: "system",
        reason: "Purge operation started after security verification",
        metadata: {
          scheduledAt: purgeOperation.scheduledAt,
          securityContext: {
            featureFlagVerified: true,
            exportAcknowledged: true,
            authorizationChain: 'complete'
          },
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL'
        }
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to start purge:", error);
      throw error;
    }
  }

  // Complete purge operation
  async completePurge(
    purgeId: string,
    tenantId: string,
    recordsDestroyed: number,
    tablesDestroyed: number
  ): Promise<PurgeOperation> {
    try {
      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          status: "finished",
          completedAt: new Date(),
          recordsDestroyed: recordsDestroyed,
          tablesDestroyed: tablesDestroyed,
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            eq(purgeOperations.status, "running")
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found or not running");
      }

      // Create audit log
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "complete_purge",
        actor: null,
        actorType: "system",
        reason: "Purge execution completed",
        metadata: {
          recordsDestroyed,
          tablesDestroyed,
        },
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to complete purge:", error);
      throw error;
    }
  }

  // Mark purge as failed
  async failPurge(purgeId: string, tenantId: string, errorMessage: string): Promise<PurgeOperation> {
    try {
      const [purgeOperation] = await db
        .update(purgeOperations)
        .set({
          status: "failed",
          failedAt: new Date(),
          errorMessage: errorMessage,
        })
        .where(
          and(
            eq(purgeOperations.id, purgeId),
            eq(purgeOperations.tenantId, tenantId),
            eq(purgeOperations.status, "running")
          )
        )
        .returning();

      if (!purgeOperation) {
        throw new Error("Purge operation not found or not running");
      }

      // Create audit log
      await this.createAuditLog({
        tenantId: tenantId,
        targetTable: "purge_operations",
        targetId: purgeId,
        action: "fail_purge",
        actor: null,
        actorType: "system",
        reason: "Purge execution failed",
        metadata: {
          errorMessage,
        },
      });

      return purgeOperation;
    } catch (error) {
      console.error("Failed to fail purge:", error);
      throw error;
    }
  }

  // EXTREMELY DANGEROUS: Execute purge immediately
  async purgeTenantNow(tenantId: string, purgeId: string): Promise<{ recordsDestroyed: number; tablesDestroyed: number }> {
    console.warn(`🔥 DANGER PURGE EXECUTING FOR TENANT: ${tenantId} 🔥`);
    
    try {
      // DEFENSE-IN-DEPTH: Final security check before permanent destruction
      const featureFlags = await this.getTenantFeatureFlags(tenantId);
      if (!featureFlags['danger_purge']) {
        console.error(`🚨 SECURITY BLOCK: Attempted to execute purge on tenant ${tenantId} with disabled danger_purge feature`);
        throw new Error("CRITICAL: Danger purge feature is not enabled for this tenant - aborting destruction");
      }
      
      console.warn(`🚨 FINAL SECURITY CHECK PASSED: danger_purge enabled for tenant ${tenantId}`);
      
      return await db.transaction(async (tx) => {
        let recordsDestroyed = 0;
        let tablesDestroyed = 0;

        // STEP 1: Revoke all tenant encryption keys first
        await tx
          .update(tenantKeys)
          .set({
            status: "revoked",
            revokedAt: new Date(),
          })
          .where(
            and(
              eq(tenantKeys.tenantId, tenantId),
              eq(tenantKeys.status, "active")
            )
          );

        // STEP 2: Get record counts before deletion
        const tables = [
          { table: products, name: "products" },
          { table: batches, name: "batches" },
          { table: inventoryLots, name: "inventory_lots" },
          { table: customers, name: "customers" },
          { table: orders, name: "orders" },
          { table: orderItems, name: "order_items" },
          { table: loyaltyAccounts, name: "loyalty_accounts" },
          { table: credits, name: "credits" },
          { table: creditTransactions, name: "credit_transactions" },
          { table: payments, name: "payments" },
          { table: deliveries, name: "deliveries" },
          { table: kbArticles, name: "kb_articles" },
          { table: kbFeedback, name: "kb_feedback" },
          { table: featureFlagOverrides, name: "feature_flag_overrides" },
          { table: selfDestructs, name: "self_destructs" },
          { table: usersTenants, name: "users_tenants" },
          { table: tenantKeys, name: "tenant_keys" },
        ];

        for (const { table, name } of tables) {
          try {
            const count = await tx
              .select({ count: sql`count(*)` })
              .from(table)
              .where(eq((table as any).tenantId, tenantId));
            recordsDestroyed += Number(count[0]?.count || 0);
            if (Number(count[0]?.count || 0) > 0) {
              tablesDestroyed++;
            }
          } catch (error) {
            console.error(`Error counting records in ${name}:`, error);
          }
        }

        // STEP 3: Delete the tenant (CASCADE will delete all related records)
        const deletedTenants = await tx
          .delete(tenants)
          .where(eq(tenants.id, tenantId))
          .returning();

        if (deletedTenants.length === 0) {
          throw new Error("Tenant not found or already deleted");
        }

        console.error(`💥 PURGE COMPLETED: ${recordsDestroyed} records destroyed across ${tablesDestroyed} tables`);
        
        return { recordsDestroyed, tablesDestroyed };
      });
    } catch (error) {
      console.error("Failed to execute purge:", error);
      throw error;
    }
  }

  // Get purge operations with user details
  async getPurgeOperations(filters?: { tenantId?: string; status?: string }): Promise<Array<PurgeOperation & {
    requestedByName?: string;
    canceledByName?: string;
  }>> {
    try {
      let query = db
        .select({
          id: purgeOperations.id,
          tenantId: purgeOperations.tenantId,
          tenantName: purgeOperations.tenantName,
          status: purgeOperations.status,
          requestedBy: purgeOperations.requestedBy,
          requestedAt: purgeOperations.requestedAt,
          exportAckedAt: purgeOperations.exportAckedAt,
          scheduledAt: purgeOperations.scheduledAt,
          startedAt: purgeOperations.startedAt,
          completedAt: purgeOperations.completedAt,
          canceledAt: purgeOperations.canceledAt,
          failedAt: purgeOperations.failedAt,
          canceledBy: purgeOperations.canceledBy,
          reason: purgeOperations.reason,
          confirmationToken: purgeOperations.confirmationToken,
          ipAddress: purgeOperations.ipAddress,
          userAgent: purgeOperations.userAgent,
          errorMessage: purgeOperations.errorMessage,
          recordsDestroyed: purgeOperations.recordsDestroyed,
          tablesDestroyed: purgeOperations.tablesDestroyed,
          metadata: purgeOperations.metadata,
          requestedByName: sql<string>`req_users.first_name || ' ' || req_users.last_name`,
          canceledByName: sql<string>`cancel_users.first_name || ' ' || cancel_users.last_name`,
        })
        .from(purgeOperations)
        .leftJoin(sql`users req_users`, eq(purgeOperations.requestedBy, sql`req_users.id`))
        .leftJoin(sql`users cancel_users`, eq(purgeOperations.canceledBy, sql`cancel_users.id`))
        .orderBy(desc(purgeOperations.requestedAt));

      if (filters?.tenantId) {
        query = query.where(eq(purgeOperations.tenantId, filters.tenantId));
      }

      if (filters?.status) {
        query = query.where(eq(purgeOperations.status, filters.status as any));
      }

      const results = await query;
      
      return results as Array<PurgeOperation & {
        requestedByName?: string;
        canceledByName?: string;
      }>;
    } catch (error) {
      console.error("Failed to get purge operations:", error);
      throw error;
    }
  }

  // Activity Tracking System
  async recordActivity(data: {
    tenantId: string;
    targetTable: string;
    targetId: string;
    eventType: string;
    userId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await db.insert(activityEvents).values({
        tenantId: data.tenantId,
        targetTable: data.targetTable,
        targetId: data.targetId,
        eventType: data.eventType,
        userId: data.userId,
        metadata: data.metadata,
      });
    } catch (error) {
      console.error("Failed to record activity:", error);
      // Don't throw - activity tracking should not break core functionality
    }
  }

  // Inactivity Policy Management
  async getInactivityPolicies(tenantId?: string): Promise<InactivityPolicy[]> {
    let query = db.select().from(inactivityPolicies);
    
    if (tenantId) {
      query = query.where(
        or(
          eq(inactivityPolicies.tenantId, tenantId),
          isNull(inactivityPolicies.tenantId) // Include global policies
        )
      );
    } else {
      query = query.where(isNull(inactivityPolicies.tenantId)); // Only global policies
    }
    
    return await query.orderBy(
      inactivityPolicies.tenantId, // NULL first (globals)
      inactivityPolicies.target
    );
  }

  async createInactivityPolicy(policy: InsertInactivityPolicy): Promise<InactivityPolicy> {
    const [created] = await db.insert(inactivityPolicies)
      .values(policy)
      .returning();
    return created;
  }

  async updateInactivityPolicy(id: string, policy: Partial<InsertInactivityPolicy>): Promise<InactivityPolicy> {
    const [updated] = await db.update(inactivityPolicies)
      .set({
        ...policy,
        updatedAt: new Date(),
      })
      .where(eq(inactivityPolicies.id, id))
      .returning();
      
    if (!updated) {
      throw new Error("Inactivity policy not found");
    }
    
    return updated;
  }

  async deleteInactivityPolicy(id: string): Promise<void> {
    const result = await db.delete(inactivityPolicies)
      .where(eq(inactivityPolicies.id, id));
      
    if (result.rowCount === 0) {
      throw new Error("Inactivity policy not found");
    }
  }

  // Inactivity Tracker Management
  async getInactivityTrackers(tenantId: string, filters?: { 
    stage?: string; 
    targetTable?: string; 
    overdue?: boolean; 
  }): Promise<InactivityTracker[]> {
    let query = db.select().from(inactivityTrackers)
      .where(eq(inactivityTrackers.tenantId, tenantId));
    
    if (filters?.stage) {
      query = query.where(
        and(
          eq(inactivityTrackers.tenantId, tenantId),
          eq(inactivityTrackers.stage, filters.stage as any)
        )
      );
    }
    
    if (filters?.targetTable) {
      query = query.where(
        and(
          eq(inactivityTrackers.tenantId, tenantId),
          eq(inactivityTrackers.targetTable, filters.targetTable)
        )
      );
    }
    
    if (filters?.overdue) {
      query = query.where(
        and(
          eq(inactivityTrackers.tenantId, tenantId),
          sql`${inactivityTrackers.nextCheck} <= NOW()`
        )
      );
    }
    
    return await query.orderBy(
      inactivityTrackers.lastActivity,
      inactivityTrackers.stage
    );
  }

  async createInactivityTracker(tracker: InsertInactivityTracker): Promise<InactivityTracker> {
    const [created] = await db.insert(inactivityTrackers)
      .values(tracker)
      .returning();
    return created;
  }

  async updateInactivityTracker(id: string, tracker: Partial<InsertInactivityTracker>): Promise<InactivityTracker> {
    const [updated] = await db.update(inactivityTrackers)
      .set({
        ...tracker,
        updatedAt: new Date(),
      })
      .where(eq(inactivityTrackers.id, id))
      .returning();
      
    if (!updated) {
      throw new Error("Inactivity tracker not found");
    }
    
    return updated;
  }

  async deleteInactivityTracker(id: string): Promise<void> {
    const result = await db.delete(inactivityTrackers)
      .where(eq(inactivityTrackers.id, id));
      
    if (result.rowCount === 0) {
      throw new Error("Inactivity tracker not found");
    }
  }

  async restoreInactivityTracker(id: string, tenantId: string, userId: string): Promise<InactivityTracker> {
    return await db.transaction(async (tx) => {
      // Update tracker back to active stage
      const [updated] = await tx.update(inactivityTrackers)
        .set({
          stage: "active",
          lastActivity: new Date(), // Reset activity timestamp
          warnedAt: null,
          armedAt: null,
          snoozedUntil: null,
          nextCheck: null,
          updatedAt: new Date(),
          metadata: sql`jsonb_set(COALESCE(${inactivityTrackers.metadata}, '{}'), '{restored}', 'true')`,
        })
        .where(
          and(
            eq(inactivityTrackers.id, id),
            eq(inactivityTrackers.tenantId, tenantId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Inactivity tracker not found");
      }

      // Create audit log
      await tx.insert(auditLogs).values({
        tenantId: tenantId,
        targetTable: updated.targetTable,
        targetId: updated.targetId,
        action: "inactivity_restore",
        actor: userId,
        before: { stage: "warned/armed" },
        after: { stage: "active", restoredBy: userId },
        metadata: { trackerId: id },
      });

      return updated;
    });
  }

  async snoozeInactivityTracker(id: string, tenantId: string, snoozeDays: number, userId: string): Promise<InactivityTracker> {
    return await db.transaction(async (tx) => {
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);

      const [updated] = await tx.update(inactivityTrackers)
        .set({
          snoozedUntil: snoozeUntil,
          nextCheck: snoozeUntil,
          updatedAt: new Date(),
          metadata: sql`jsonb_set(COALESCE(${inactivityTrackers.metadata}, '{}'), '{snoozedDays}', '${snoozeDays}')`,
        })
        .where(
          and(
            eq(inactivityTrackers.id, id),
            eq(inactivityTrackers.tenantId, tenantId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Inactivity tracker not found");
      }

      // Create audit log
      await tx.insert(auditLogs).values({
        tenantId: tenantId,
        targetTable: updated.targetTable,
        targetId: updated.targetId,
        action: "inactivity_snooze",
        actor: userId,
        before: { snoozedUntil: null },
        after: { snoozedUntil: snoozeUntil, snoozedBy: userId, snoozeDays },
        metadata: { trackerId: id },
      });

      return updated;
    });
  }

  // Activity aggregation and tracker updates
  async aggregateActivityEvents(tenantId: string): Promise<void> {
    try {
      // Get latest activity per target from activity_events
      const latestActivities = await db
        .select({
          targetTable: activityEvents.targetTable,
          targetId: activityEvents.targetId,
          latestActivity: sql<Date>`MAX(${activityEvents.createdAt})`,
        })
        .from(activityEvents)
        .where(eq(activityEvents.tenantId, tenantId))
        .groupBy(activityEvents.targetTable, activityEvents.targetId);

      // Update existing trackers with latest activity
      for (const activity of latestActivities) {
        await db
          .update(inactivityTrackers)
          .set({
            lastActivity: activity.latestActivity,
            updatedAt: new Date(),
            // Reset to active if was warned/armed but now has activity
            stage: sql`CASE WHEN ${inactivityTrackers.stage} IN ('warned', 'armed') THEN 'active' ELSE ${inactivityTrackers.stage} END`,
            warnedAt: sql`CASE WHEN ${inactivityTrackers.stage} IN ('warned', 'armed') THEN NULL ELSE ${inactivityTrackers.warnedAt} END`,
            armedAt: sql`CASE WHEN ${inactivityTrackers.stage} IN ('warned', 'armed') THEN NULL ELSE ${inactivityTrackers.armedAt} END`,
          })
          .where(
            and(
              eq(inactivityTrackers.tenantId, tenantId),
              eq(inactivityTrackers.targetTable, activity.targetTable),
              eq(inactivityTrackers.targetId, activity.targetId),
              sql`${inactivityTrackers.lastActivity} < ${activity.latestActivity}`
            )
          );
      }

      // Create new trackers for targets that don't have them yet
      for (const activity of latestActivities) {
        await db
          .insert(inactivityTrackers)
          .values({
            tenantId: tenantId,
            targetTable: activity.targetTable,
            targetId: activity.targetId,
            stage: "active",
            lastActivity: activity.latestActivity,
          })
          .onConflictDoNothing(); // Use unique constraint to prevent duplicates
      }

      // Clean up old activity events (keep last 30 days)
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - 30);
      
      await db
        .delete(activityEvents)
        .where(
          and(
            eq(activityEvents.tenantId, tenantId),
            sql`${activityEvents.createdAt} < ${cleanupDate}`
          )
        );

      console.log(`Activity aggregation completed for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to aggregate activity events for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Dashboard Analytics Implementation
  async getRevenueTrends(tenantId: string, period: 'daily' | 'weekly' | 'monthly', days: number = 30): Promise<Array<{
    period: string;
    revenue: string;
    orders: number;
    avgOrderValue: string;
    change: number;
  }>> {
    try {
      const intervalType = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await db
        .select({
          period: sql<string>`date_trunc('${sql.raw(intervalType)}', ${orders.createdAt})`,
          revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          orders: sql<number>`COUNT(${orders.id})`,
          avgOrderValue: sql<string>`COALESCE(AVG(${orders.total}), 0)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            eq(orders.status, 'paid'),
            sql`${orders.createdAt} >= ${startDate}`
          )
        )
        .groupBy(sql`date_trunc('${sql.raw(intervalType)}', ${orders.createdAt})`)
        .orderBy(sql`date_trunc('${sql.raw(intervalType)}', ${orders.createdAt})`);

      // Calculate percentage change from previous period
      return trends.map((trend, index) => {
        const prevTrend = trends[index - 1];
        const change = prevTrend ? 
          ((parseFloat(trend.revenue) - parseFloat(prevTrend.revenue)) / parseFloat(prevTrend.revenue)) * 100 : 0;

        return {
          period: new Date(trend.period).toISOString().split('T')[0],
          revenue: trend.revenue,
          orders: trend.orders,
          avgOrderValue: trend.avgOrderValue,
          change: Math.round(change * 100) / 100,
        };
      });
    } catch (error) {
      console.error(`Failed to get revenue trends for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve revenue trends");
    }
  }

  async getOrderAnalytics(tenantId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    averageOrderValue: string;
    popularProducts: Array<{
      productId: string;
      name: string;
      totalSold: number;
      revenue: string;
    }>;
    ordersByHour: Array<{
      hour: number;
      count: number;
    }>;
    paymentMethodBreakdown: Array<{
      method: string;
      count: number;
      revenue: string;
    }>;
  }> {
    try {
      // Get order counts
      const [orderCounts] = await db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
          completedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'paid' THEN 1 END)`,
          pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'confirmed' THEN 1 END)`,
          averageOrderValue: sql<string>`COALESCE(AVG(CASE WHEN ${orders.status} = 'paid' THEN ${orders.total} END), 0)`,
        })
        .from(orders)
        .where(eq(orders.tenantId, tenantId));

      // Get popular products
      const popularProducts = await db
        .select({
          productId: orderItems.productId,
          name: products.name,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
          revenue: sql<string>`SUM(${orderItems.qty} * ${orderItems.unitPrice})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(orders.tenantId, tenantId),
            eq(orders.status, 'paid')
          )
        )
        .groupBy(orderItems.productId, products.name)
        .orderBy(desc(sql`SUM(${orderItems.qty})`))
        .limit(10);

      // Get orders by hour
      const ordersByHour = await db
        .select({
          hour: sql<number>`EXTRACT(hour FROM ${orders.createdAt})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(eq(orders.tenantId, tenantId))
        .groupBy(sql`EXTRACT(hour FROM ${orders.createdAt})`)
        .orderBy(sql`EXTRACT(hour FROM ${orders.createdAt})`);

      // Get payment method breakdown
      const paymentMethods = await db
        .select({
          method: orders.paymentMethod,
          count: sql<number>`COUNT(*)`,
          revenue: sql<string>`SUM(${orders.total})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            eq(orders.status, 'paid')
          )
        )
        .groupBy(orders.paymentMethod)
        .orderBy(desc(sql`COUNT(*)`));

      return {
        totalOrders: orderCounts.totalOrders || 0,
        completedOrders: orderCounts.completedOrders || 0,
        pendingOrders: orderCounts.pendingOrders || 0,
        averageOrderValue: orderCounts.averageOrderValue || "0",
        popularProducts: popularProducts.map(p => ({
          productId: p.productId,
          name: p.name,
          totalSold: p.totalSold,
          revenue: p.revenue,
        })),
        ordersByHour: Array.from({ length: 24 }, (_, i) => {
          const hourData = ordersByHour.find(o => o.hour === i);
          return {
            hour: i,
            count: hourData?.count || 0,
          };
        }),
        paymentMethodBreakdown: paymentMethods.map(pm => ({
          method: pm.method || 'unknown',
          count: pm.count,
          revenue: pm.revenue,
        })),
      };
    } catch (error) {
      console.error(`Failed to get order analytics for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve order analytics");
    }
  }

  async getInventoryAnalytics(tenantId: string): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: string;
    topProducts: Array<{
      productId: string;
      name: string;
      currentStock: number;
      stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
      turnoverRate: number;
    }>;
    stockLevels: Array<{
      category: string;
      inStock: number;
      lowStock: number;
      outOfStock: number;
    }>;
  }> {
    try {
      // Get current stock levels with product details
      const stockData = await db
        .select({
          productId: products.id,
          name: products.name,
          type: products.type,
          currentStock: sql<number>`COALESCE(SUM(${inventoryLots.qtyRemaining}), 0)`,
          totalValue: sql<string>`COALESCE(SUM(${inventoryLots.qtyRemaining} * ${batches.totalCost} / ${batches.qtyAcquired}), 0)`,
        })
        .from(products)
        .leftJoin(inventoryLots, eq(products.id, inventoryLots.productId))
        .leftJoin(batches, eq(inventoryLots.batchId, batches.id))
        .where(eq(products.tenantId, tenantId))
        .groupBy(products.id, products.name, products.type);

      // Get tenant settings for stock thresholds
      const settings = await this.getTenantSettings(tenantId);
      const minStockThreshold = settings?.minStockThreshold || 10;

      // Calculate stock statuses and metrics
      let totalProducts = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let totalValue = 0;

      const stockLevels = new Map<string, { inStock: number; lowStock: number; outOfStock: number }>();

      const topProducts = stockData.map(item => {
        totalProducts++;
        const stock = item.currentStock;
        const value = parseFloat(item.totalValue || "0");
        totalValue += value;

        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
        if (stock === 0) {
          stockStatus = 'out_of_stock';
          outOfStockCount++;
        } else if (stock <= minStockThreshold) {
          stockStatus = 'low_stock';
          lowStockCount++;
        } else {
          stockStatus = 'in_stock';
        }

        // Update stock levels by category (using product type as category)
        const category = item.type || 'other';
        if (!stockLevels.has(category)) {
          stockLevels.set(category, { inStock: 0, lowStock: 0, outOfStock: 0 });
        }
        const categoryData = stockLevels.get(category)!;
        if (stockStatus === 'in_stock') categoryData.inStock++;
        else if (stockStatus === 'low_stock') categoryData.lowStock++;
        else categoryData.outOfStock++;

        // Calculate turnover rate (simplified - based on recent sales)
        // This is a placeholder calculation - in production you'd want more sophisticated metrics
        const turnoverRate = Math.random() * 10; // TODO: Implement proper turnover calculation

        return {
          productId: item.productId,
          name: item.name,
          currentStock: stock,
          stockStatus,
          turnoverRate: Math.round(turnoverRate * 100) / 100,
        };
      });

      return {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue: totalValue.toFixed(2),
        topProducts: topProducts
          .sort((a, b) => b.currentStock - a.currentStock)
          .slice(0, 10),
        stockLevels: Array.from(stockLevels.entries()).map(([category, data]) => ({
          category,
          ...data,
        })),
      };
    } catch (error) {
      console.error(`Failed to get inventory analytics for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve inventory analytics");
    }
  }

  async getCustomerInsights(tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    customerGrowthRate: number;
    loyaltyBreakdown: Array<{
      tier: string;
      count: number;
      totalPoints: number;
    }>;
    creditSummary: {
      totalCreditLimit: string;
      totalCreditUsed: string;
      overdueAmount: string;
      overdueCustomers: number;
    };
    topCustomers: Array<{
      customerId: string;
      name: string;
      totalOrders: number;
      totalSpent: string;
      lastOrderDate: Date | null;
    }>;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get customer counts
      const [customerCounts] = await db
        .select({
          totalCustomers: sql<number>`COUNT(*)`,
          newThisMonth: sql<number>`COUNT(CASE WHEN ${customers.createdAt} >= ${startOfMonth} THEN 1 END)`,
          newLastMonth: sql<number>`COUNT(CASE WHEN ${customers.createdAt} >= ${startOfLastMonth} AND ${customers.createdAt} < ${endOfLastMonth} THEN 1 END)`,
        })
        .from(customers)
        .where(eq(customers.tenantId, tenantId));

      // Get active customers (those who made orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activeCounts] = await db
        .select({
          activeCustomers: sql<number>`COUNT(DISTINCT ${orders.customerId})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
            sql`${orders.customerId} IS NOT NULL`
          )
        );

      // Calculate growth rate
      const customerGrowthRate = customerCounts.newLastMonth > 0 
        ? ((customerCounts.newThisMonth - customerCounts.newLastMonth) / customerCounts.newLastMonth) * 100
        : 0;

      // Get loyalty breakdown
      const loyaltyBreakdown = await db
        .select({
          tier: loyaltyAccounts.tier,
          count: sql<number>`COUNT(*)`,
          totalPoints: sql<number>`SUM(${loyaltyAccounts.points})`,
        })
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.tenantId, tenantId))
        .groupBy(loyaltyAccounts.tier)
        .orderBy(loyaltyAccounts.tier);

      // Get credit summary
      const [creditSummary] = await db
        .select({
          totalCreditLimit: sql<string>`COALESCE(SUM(${credits.limitAmount}), 0)`,
          totalCreditUsed: sql<string>`COALESCE(SUM(${credits.balance}), 0)`,
        })
        .from(credits)
        .where(eq(credits.tenantId, tenantId));

      // Get overdue credit information
      const [overdueCreditInfo] = await db
        .select({
          overdueAmount: sql<string>`COALESCE(SUM(${creditTransactions.amount}), 0)`,
          overdueCustomers: sql<number>`COUNT(DISTINCT ${creditTransactions.customerId})`,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.tenantId, tenantId),
            eq(creditTransactions.status, 'overdue'),
            sql`${creditTransactions.dueDate} < ${now}`
          )
        );

      // Get top customers
      const topCustomers = await db
        .select({
          customerId: customers.id,
          name: customers.name,
          totalOrders: sql<number>`COUNT(${orders.id})`,
          totalSpent: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
          lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
        })
        .from(customers)
        .leftJoin(orders, eq(customers.id, orders.customerId))
        .where(eq(customers.tenantId, tenantId))
        .groupBy(customers.id, customers.name)
        .orderBy(desc(sql`COALESCE(SUM(${orders.total}), 0)`))
        .limit(10);

      return {
        totalCustomers: customerCounts.totalCustomers || 0,
        activeCustomers: activeCounts.activeCustomers || 0,
        newCustomersThisMonth: customerCounts.newThisMonth || 0,
        customerGrowthRate: Math.round(customerGrowthRate * 100) / 100,
        loyaltyBreakdown: loyaltyBreakdown.map(lb => ({
          tier: lb.tier,
          count: lb.count,
          totalPoints: lb.totalPoints,
        })),
        creditSummary: {
          totalCreditLimit: creditSummary.totalCreditLimit || "0",
          totalCreditUsed: creditSummary.totalCreditUsed || "0",
          overdueAmount: overdueCreditInfo.overdueAmount || "0",
          overdueCustomers: overdueCreditInfo.overdueCustomers || 0,
        },
        topCustomers: topCustomers.map(tc => ({
          customerId: tc.customerId,
          name: tc.name,
          totalOrders: tc.totalOrders,
          totalSpent: tc.totalSpent,
          lastOrderDate: tc.lastOrderDate,
        })),
      };
    } catch (error) {
      console.error(`Failed to get customer insights for tenant ${tenantId}:`, error);
      throw new Error("Failed to retrieve customer insights");
    }
  }
}

export const storage = new DatabaseStorage();
