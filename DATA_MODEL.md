# DeelRx CRM - Data Model Documentation

This document provides a comprehensive overview of the DeelRx CRM database schema, including entity relationships, constraints, and business rules.

## 🏗️ Architecture Overview

The DeelRx CRM uses a multi-tenant PostgreSQL database with the following key architectural principles:

- **Multi-tenancy**: All data is scoped to teams/organizations
- **UUID Primary Keys**: All entities use UUIDs for global uniqueness
- **Audit Trails**: Created/updated timestamps on all entities
- **Referential Integrity**: Foreign key constraints maintain data consistency
- **Type Safety**: PostgreSQL enums for controlled vocabulary

## 📊 Core Entities

### Users & Authentication

#### `users`
Primary user accounts with authentication information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Business Rules:**
- Email must be unique across the system
- Password hash is stored, never plain text
- Users can belong to multiple teams

### Multi-tenant Organization

#### `teams`
Organizations/tenants that own all business data.

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `team_memberships`
Associates users with teams and defines their roles.

```sql
CREATE TABLE team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

**Roles:**
- `owner` - Full administrative access
- `admin` - Administrative access without billing
- `manager` - Operational management
- `member` - Standard user access

## 🛍️ Core Business Entities

### Product Management

#### `products`
Core product catalog with inventory tracking.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, sku) WHERE sku IS NOT NULL
);
```

**Business Rules:**
- SKU must be unique within a team (when provided)
- Stock quantity cannot be negative
- Price must be non-negative
- Low stock alerts when quantity <= threshold

### Customer Management

#### `customers`
Customer records with contact and demographic information.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Address Structure (JSONB):**
```json
{
  "street": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345",
  "country": "USA"
}
```

### Order Processing

#### `orders`
Sales transactions and order management.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  order_number TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, order_number)
);

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);
```

#### `order_items`
Individual line items within orders.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Payment Processing

#### `payments`
Payment records associated with orders.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id TEXT,
  processor_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE payment_method AS ENUM (
  'cash', 'card', 'check', 'bank_transfer', 'digital_wallet'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded', 'cancelled'
);
```

## 🔧 Extended Operations (Phase 2)

### Inventory Management

#### `inventoryAdjustments`
Tracks all inventory changes outside of sales transactions.

```sql
CREATE TABLE inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease')),
  reason adjustment_reason NOT NULL,
  previous_quantity INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL CHECK (adjustment_quantity > 0),
  new_quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TYPE adjustment_reason AS ENUM (
  'waste', 'damage', 'theft', 'expiry', 'sample', 'personal', 'recount', 'other'
);
```

**Business Rules:**
- Adjustment quantity must be positive
- New quantity = previous ± adjustment (based on type)
- Cannot result in negative stock
- Maintains complete audit trail

### Customer Referrals

#### `customerReferrals`
Customer referral program management and tracking.

```sql
CREATE TABLE customer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_phone TEXT,
  referred_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status referral_status DEFAULT 'pending',
  reward_amount INTEGER NOT NULL DEFAULT 0,
  reward_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT referral_contact_check CHECK (
    referred_email IS NOT NULL OR 
    referred_phone IS NOT NULL OR 
    referred_customer_id IS NOT NULL
  )
);

CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'expired');
```

**Business Rules:**
- Must provide at least one contact method for referred person
- Status progresses: pending → converted/expired
- Reward is paid when referral converts
- Automatic expiration based on expires_at

### Delivery Management

#### `deliveries`
Order fulfillment and delivery tracking.

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address JSONB NOT NULL,
  delivery_method delivery_method NOT NULL,
  status delivery_status DEFAULT 'pending',
  tracking_number TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE delivery_method AS ENUM ('pickup', 'delivery', 'shipping');

CREATE TYPE delivery_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
);
```

**Business Rules:**
- One delivery record per order
- Address stored as structured JSON
- Status progression workflow enforced
- Tracking numbers for shipping method

### Loyalty Programs

#### `loyaltyPrograms`
Loyalty program definitions and configuration.

```sql
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_per_dollar INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `loyaltyAccounts`
Customer loyalty account balances and statistics.

```sql
CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  total_earned INTEGER DEFAULT 0 CHECK (total_earned >= 0),
  total_redeemed INTEGER DEFAULT 0 CHECK (total_redeemed >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, program_id)
);
```

#### `loyaltyEvents`
Audit trail for all loyalty point transactions.

```sql
CREATE TABLE loyalty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  event_type loyalty_event_type NOT NULL,
  points INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE loyalty_event_type AS ENUM ('earned', 'redeemed', 'expired', 'adjusted');
```

#### `loyaltyTransactions`
Detailed transaction records for point accrual and redemption.

```sql
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('accrual', 'redemption')),
  points INTEGER NOT NULL CHECK (points > 0),
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 Entity Relationships

### Primary Relationships

1. **Teams → All Entities**: All business data belongs to a team (multi-tenancy)
2. **Customers → Orders**: One customer can have many orders
3. **Orders → Order Items**: One order contains many items
4. **Orders → Payments**: One order can have multiple payments
5. **Orders → Deliveries**: One order has one delivery record
6. **Products → Order Items**: Products are sold through order items
7. **Products → Inventory Adjustments**: Products have adjustment history

### Extended Relationships (Phase 2)

1. **Customers → Referrals**: Customers can refer others (1:many as referrer)
2. **Customers → Loyalty Accounts**: Customers participate in loyalty programs
3. **Loyalty Programs → Accounts**: Programs have many customer accounts
4. **Loyalty Accounts → Events/Transactions**: Complete audit trail

## 📋 Constraints & Indexes

### Primary Constraints

```sql
-- Unique constraints
ALTER TABLE teams ADD CONSTRAINT teams_slug_unique UNIQUE (slug);
ALTER TABLE team_memberships ADD CONSTRAINT team_user_unique UNIQUE (team_id, user_id);
ALTER TABLE products ADD CONSTRAINT products_team_sku_unique UNIQUE (team_id, sku);
ALTER TABLE orders ADD CONSTRAINT orders_team_number_unique UNIQUE (team_id, order_number);
ALTER TABLE loyalty_accounts ADD CONSTRAINT loyalty_customer_program_unique UNIQUE (customer_id, program_id);

-- Check constraints
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock_quantity >= 0);
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
ALTER TABLE loyalty_accounts ADD CONSTRAINT loyalty_balance_non_negative CHECK (points_balance >= 0);
```

### Performance Indexes

```sql
-- Team-scoped queries
CREATE INDEX idx_products_team_id ON products (team_id);
CREATE INDEX idx_customers_team_id ON customers (team_id);
CREATE INDEX idx_orders_team_id ON orders (team_id);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);

-- Search and filtering
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_customers_name ON customers USING gin(to_tsvector('english', first_name || ' ' || COALESCE(last_name, '')));
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- Phase 2 indexes
CREATE INDEX idx_inventory_adjustments_product_id ON inventory_adjustments (product_id);
CREATE INDEX idx_customer_referrals_referrer ON customer_referrals (referrer_customer_id);
CREATE INDEX idx_deliveries_order_id ON deliveries (order_id);
CREATE INDEX idx_loyalty_accounts_customer ON loyalty_accounts (customer_id);
```

## 🔒 Security & Access Control

### Row-Level Security (Future Enhancement)

The schema is designed to support PostgreSQL RLS for additional security:

```sql
-- Example RLS policy (not yet implemented)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_team_isolation ON products
  FOR ALL USING (team_id = current_setting('app.current_team_id')::uuid);
```

### Application-Level Security

Current security is enforced at the application layer:
- All queries filter by team_id
- User permissions checked via team_memberships
- RBAC through role-based middleware

## 📊 Data Integrity Rules

### Business Logic Constraints

1. **Inventory Consistency**
   - Stock quantities updated atomically with adjustments
   - No negative stock allowed
   - Adjustment quantities must be positive

2. **Order Processing**
   - Order totals calculated from line items
   - Payment amounts cannot exceed order total
   - Status transitions follow business workflow

3. **Loyalty Points**
   - Points balance cannot be negative
   - Redemptions require sufficient balance
   - All transactions logged for audit

4. **Referral Management**
   - Must provide contact method for referred person
   - Status progression: pending → converted/expired
   - Rewards tracked and payment status maintained

## 🔄 Migration Strategy

### Schema Evolution

The database schema supports incremental updates:

1. **Phase 1**: Core CRM entities (users, teams, products, customers, orders)
2. **Phase 2**: Extended operations (adjustments, referrals, deliveries, loyalty)
3. **Phase 3**: Advanced features (reporting, automation, integrations)

### Backward Compatibility

- New tables and columns are additive
- Existing queries continue to work
- Default values provided for new required fields
- Foreign key constraints maintain referential integrity

## 📈 Performance Considerations

### Query Optimization

- All queries filtered by team_id for multi-tenancy
- Indexes on frequently queried columns
- Denormalized fields for common calculations
- Generated columns for computed values

### Scaling Strategies

- Horizontal partitioning by team_id (future)
- Read replicas for reporting queries
- Connection pooling for high concurrency
- Caching layer for frequently accessed data

---

**Data Model Version**: Phase 2 (Extended Operations)  
**Last Updated**: Current Implementation  
**Database**: PostgreSQL with Drizzle ORM