# Smoke Test Checklist

Run this checklist after deployment to verify all critical systems are working.

## Pre-Test Setup

- [ ] Deployment completed successfully in Vercel
- [ ] All environment variables are set in Vercel
- [ ] Database migrations applied (`npm run db:push`)
- [ ] External service webhooks configured (Clerk, Stripe)

## Core Application Tests

### 1. Basic Site Access

- [ ] Visit root URL - site loads without errors
- [ ] Check browser console - no critical JavaScript errors
- [ ] Verify page renders with expected layout/styling

### 2. Authentication Flow

- [ ] Navigate to `/login` - Clerk sign-in component renders
- [ ] Navigate to `/signup` - Clerk sign-up component renders
- [ ] Sign up new test user with valid email
- [ ] Complete email verification if required
- [ ] User successfully redirected after authentication

### 3. Post-Authentication Experience

- [ ] Dashboard or main app area loads
- [ ] User profile/settings accessible via `/user`
- [ ] Navigation elements render correctly
- [ ] No authentication-related errors in console

### 4. Multi-Tenancy

- [ ] Personal tenant automatically created on first login
- [ ] Tenant context properly set (check URL or UI indicators)
- [ ] Tenant switching works if multiple tenants exist
- [ ] User settings persist tenant selection

### 5. Database Integration

- [ ] Navigate to pages that query database (dashboard, settings)
- [ ] Data loads without connection errors
- [ ] Check Vercel function logs for successful DB queries
- [ ] No database timeout or SSL errors

### 5.1. Core CRM UI Tests (Phase 1)

- [ ] **Dashboard Page** (`/dashboard`)
  - KPI cards show real data (sales, customers, orders, products)
  - Low stock alerts display when products below threshold
  - Recent orders list shows with customer names
  - Quick action buttons navigate to correct pages
- [ ] **Inventory Management** (`/inventory`)
  - Product list loads with search and pagination
  - Add new product form validates required fields
  - Edit product updates stock levels correctly
  - Stock status indicators show low/out of stock warnings
- [ ] **Customer Management** (`/customers`)
  - Customer list displays with search functionality
  - Add customer form accepts contact details and addresses
  - Customer records update successfully
  - Email and phone validation works
- [ ] **Sales POS** (`/sales-pos`)
  - Product selection shows available inventory
  - Shopping cart calculates totals correctly
  - Customer selection works (optional for walk-ins)
  - Order creation reduces stock automatically
- [ ] **Payment Management** (`/payments`)
  - Payment history loads with status indicators
  - Search and filter by payment status works
  - Refund modal opens and processes test refunds
  - Payment method display shows correctly

### 6. File Upload (if implemented)

- [ ] Upload small test file (< 1MB)
- [ ] File appears in Vercel Blob storage
- [ ] Download/access uploaded file works
- [ ] File cleanup/deletion works if implemented

### 7. API Routes

- [ ] Test basic API endpoint: `/api/health` or similar
- [ ] Authenticated API routes require valid session
- [ ] API responses include proper headers and status codes
- [ ] Rate limiting works if implemented

### 7.1. Core CRM API Tests (Phase 1)

- [ ] **Dashboard KPIs**: GET `/api/tenants/{tenantId}/dashboard/kpis`
  - Returns total sales, customers, orders, products
  - Low stock alerts shown when applicable
  - Recent orders list populated
- [ ] **Products API**: GET/POST `/api/tenants/{tenantId}/products`
  - List products with search and pagination
  - Create new product with validation
  - Update existing product stock levels
- [ ] **Customers API**: GET/POST `/api/tenants/{tenantId}/customers`
  - List customers with search functionality
  - Create new customer with address data
  - Update customer contact information
- [ ] **Orders API**: GET/POST `/api/tenants/{tenantId}/orders`
  - Create order with multiple line items
  - Stock levels automatically reduced
  - Order total calculated correctly
- [ ] **Refund API**: POST `/api/tenants/{tenantId}/refund-payment`
  - Process refund via Stripe (test mode)
  - Payment status updated correctly
  - Refund amount tracked properly

### 8. Stripe Integration

- [ ] Webhook endpoint accessible: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Test webhook with Stripe CLI:
  ```bash
  stripe trigger payment_intent.succeeded
  ```
- [ ] Webhook returns 200 status
- [ ] Check Vercel logs for successful webhook processing
- [ ] No signature verification errors

### 9. Error Handling

- [ ] Visit non-existent page (404 handling)
- [ ] Test with invalid authentication (401/403 handling)
- [ ] Verify error pages render properly
- [ ] Critical errors logged but don't crash app

### 10. Performance & Monitoring

- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals in acceptable ranges
- [ ] Vercel function execution times reasonable
- [ ] No memory or timeout issues in logs

## External Service Verification

### Clerk

- [ ] Authentication flow completes
- [ ] User profile updates sync
- [ ] Webhook endpoint receives events
- [ ] Organization features work if used

### Stripe

- [ ] Webhook signature verification passes
- [ ] Payment-related pages load (if implemented)
- [ ] Test mode clearly indicated
- [ ] No live payment processing in test environment

### Neon Database

- [ ] Connection pooling working
- [ ] Query performance acceptable
- [ ] No connection limit issues
- [ ] SSL connections enforced

## Security Checks

- [ ] HTTPS enforced on all pages
- [ ] Sensitive routes require authentication
- [ ] API endpoints validate permissions
- [ ] Environment variables not exposed to client
- [ ] CORS properly configured
- [ ] No hardcoded secrets in client code

## Rollback Plan

If critical issues found:

1. **Immediate**: Revert to previous working deployment
2. **Investigate**: Check Vercel function logs and external service logs
3. **Fix**: Address issues in development environment
4. **Re-test**: Run smoke test again before re-deploying
5. **Monitor**: Watch logs for 24 hours after successful deployment

## Post-Test Actions

- [ ] Document any issues found and resolutions
- [ ] Update monitoring/alerting if needed
- [ ] Schedule follow-up tests for complex features
- [ ] Notify stakeholders of successful deployment

## Emergency Contacts

- **Vercel Support**: [support link]
- **Neon Support**: [support link]
- **Clerk Support**: [support link]
- **Stripe Support**: [support link]

---

**Result**: ✅ PASS / ❌ FAIL

**Issues Found**: [Document any issues and their resolution]

**Tested By**: [Name]

**Date**: [Date]

**Deployment Version**: [Git commit or tag]
