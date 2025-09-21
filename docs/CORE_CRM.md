# Core CRM Implementation

This document describes the Phase 1 Core CRM implementation, including database schema, API endpoints, and user interfaces for managing products, customers, orders, and payments.

## Overview

The Core CRM provides essential business functionality for managing:

- **Products/Inventory**: Product catalog with stock management
- **Customers**: Customer database with contact information
- **Orders**: Order creation and management with line items
- **Payments**: Payment processing and refunds via Stripe
- **Dashboard**: Real-time KPIs and business metrics

## Database Schema

### Core Tables

#### Products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  updated_by TEXT
);
```

#### Customers

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  date_of_birth DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  updated_by TEXT
);
```

#### Orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'draft',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  updated_by TEXT
);
```

#### Order Items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL
);
```

#### Payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status payment_status_enum NOT NULL DEFAULT 'pending',
  method payment_method_enum NOT NULL DEFAULT 'card',
  processed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount_cents INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### Enums

- `order_status_enum`: draft, pending, confirmed, processing, shipped, delivered, completed, cancelled
- `payment_status_enum`: pending, processing, succeeded, failed, canceled, refunded, partially_refunded
- `payment_method_enum`: card, bank_transfer, cash, other

### Indexes and RLS

All tables include:

- Tenant-based Row Level Security (RLS) policies
- Optimized indexes for common queries
- Foreign key constraints for data integrity

## API Endpoints

All API endpoints follow REST conventions with Zod validation and RBAC authorization.

### Products API

- `GET /api/tenants/{tenantId}/products` - List products with pagination and search
- `POST /api/tenants/{tenantId}/products` - Create new product
- `GET /api/tenants/{tenantId}/products/{id}` - Get product details
- `PATCH /api/tenants/{tenantId}/products/{id}` - Update product
- `DELETE /api/tenants/{tenantId}/products/{id}` - Delete product

### Customers API

- `GET /api/tenants/{tenantId}/customers` - List customers with pagination and search
- `POST /api/tenants/{tenantId}/customers` - Create new customer
- `GET /api/tenants/{tenantId}/customers/{id}` - Get customer details
- `PATCH /api/tenants/{tenantId}/customers/{id}` - Update customer
- `DELETE /api/tenants/{tenantId}/customers/{id}` - Delete customer

### Orders API

- `GET /api/tenants/{tenantId}/orders` - List orders with pagination and filtering
- `POST /api/tenants/{tenantId}/orders` - Create new order
- `GET /api/tenants/{tenantId}/orders/{id}` - Get order details with items

### Payments API

- `POST /api/tenants/{tenantId}/refund-payment` - Process payment refund via Stripe

### Dashboard API

- `GET /api/tenants/{tenantId}/dashboard/kpis` - Get real-time business metrics

## Authorization & Security

### Role-Based Access Control (RBAC)

- **Owner**: Full access to all features
- **Admin**: Full access except tenant management
- **Manager**: Create/read/update access (no delete)
- **Member**: Create/read access only
- **Viewer**: Read-only access

### API Security

- Clerk authentication required for all endpoints
- Tenant membership validation for each request
- Role-based permissions enforced per endpoint
- Input validation using Zod schemas
- SQL injection protection via Drizzle ORM

## User Interface

### Dashboard (`/dashboard`)

- Real-time KPIs: Total Sales, Total Customers, Total Orders, Total Products
- Low stock alerts and notifications
- Recent orders list with customer information
- Quick action buttons for common tasks

### Inventory Management (`/inventory`)

- Searchable product catalog with filters
- Add/edit product forms with validation
- Stock level indicators and warnings
- Bulk operations support
- CSV import/export capabilities

### Customer Management (`/customers`)

- Customer directory with search and filtering
- Customer profile forms with contact details
- Address management with JSON storage
- Activity history and order tracking
- Customer segmentation and notes

### Sales POS (`/sales-pos`)

- Product selection with real-time stock checking
- Shopping cart with quantity adjustments
- Customer selection (optional for walk-ins)
- Order creation with automatic stock updates
- Receipt generation and order confirmation

### Payment Management (`/payments`)

- Payment history with status tracking
- Stripe integration for card processing
- Refund processing with reason tracking
- Payment method management
- Transaction search and filtering

## Integration Points

### Stripe Integration

- Payment intent creation for orders
- Webhook handling for payment updates
- Refund processing with proper error handling
- Payment method persistence
- Subscription management (future)

### Stock Management

- Automatic stock reduction on order creation
- Low stock alerts and notifications
- Inventory adjustment tracking
- Supplier integration points (future)

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Database Migration

```bash
# Apply Core CRM schema
npm run db:push

# Or use raw SQL migration
psql $DATABASE_URL -f drizzle/0003_core_crm.sql
```

## Testing

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# List products
curl -H "Authorization: Bearer $TOKEN" \
  https://yourapp.com/api/tenants/demo-tenant/products

# Create customer
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}' \
  https://yourapp.com/api/tenants/demo-tenant/customers
```

### UI Testing

1. Navigate to each page and verify loading
2. Test CRUD operations for each entity
3. Verify search and filtering functionality
4. Test form validation and error handling
5. Confirm real-time updates and notifications

## Performance Considerations

### Database Optimization

- Proper indexing on frequently queried columns
- Pagination for large result sets
- Connection pooling for serverless environments
- Query optimization using Drizzle ORM

### Frontend Optimization

- Client-side caching for reference data
- Debounced search inputs to reduce API calls
- Optimistic UI updates for better UX
- Lazy loading for large datasets

## Future Enhancements

### Phase 2 Features

- Advanced reporting and analytics dashboard
- Email notifications and marketing automation
- Supplier management and purchase orders
- Multi-location inventory tracking
- Advanced pricing rules and discounts

### Technical Improvements

- Real-time updates using WebSockets
- Advanced search with full-text capabilities
- Audit trail for all data changes
- Data export and backup functionality
- Mobile-responsive design improvements

## Troubleshooting

### Common Issues

**Database Connection Errors**

- Verify DATABASE_URL is correct and includes `?sslmode=require`
- Check Neon database is active and accessible

**Authentication Failures**

- Confirm Clerk keys are properly set
- Verify user has proper tenant membership

**API Permission Errors**

- Check user role assignments in tenant_members table
- Verify RBAC policies are correctly implemented

**Stripe Integration Issues**

- Validate webhook endpoint configuration
- Check Stripe secret keys and webhook secrets
- Monitor Stripe dashboard for failed events

For additional support, refer to the main README.md and environment setup documentation.
