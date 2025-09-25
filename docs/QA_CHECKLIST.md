# DeelRx CRM - Manual QA Checklist

This checklist should be completed before each production deployment to ensure all critical functionality works correctly.

## Pre-Test Setup
- [ ] Test environment is running (staging/production-like)
- [ ] Database is seeded with test data
- [ ] All required environment variables are set
- [ ] Test user accounts are created

## Authentication & Security
- [ ] **Sign Up Flow**
  - [ ] New user can create account with valid email/password
  - [ ] Email validation works (format check)
  - [ ] Password strength requirements enforced
  - [ ] Account activation email sent (if applicable)
  - [ ] Duplicate email registration blocked

- [ ] **Sign In Flow**
  - [ ] Valid credentials allow login
  - [ ] Invalid credentials rejected with clear error
  - [ ] Session persists after browser refresh
  - [ ] "Remember me" functionality works
  - [ ] Forgot password flow works

- [ ] **Session Management**
  - [ ] User stays logged in during normal usage
  - [ ] Session expires after inactivity (if configured)
  - [ ] Logout clears session completely
  - [ ] Multiple browser tabs share session state

- [ ] **Role-based Access**
  - [ ] Admin users can access admin features
  - [ ] Regular users cannot access admin features
  - [ ] Team isolation works (users can't see other teams' data)
  - [ ] Proper error messages for unauthorized access

## Dashboard & Navigation
- [ ] **Dashboard Loading**
  - [ ] Dashboard loads within 3 seconds
  - [ ] All stats/metrics display correctly
  - [ ] Charts and graphs render properly
  - [ ] No console errors in browser

- [ ] **Navigation**
  - [ ] All main navigation links work
  - [ ] Breadcrumbs show correct path
  - [ ] Back button works correctly
  - [ ] Mobile navigation works on small screens

## Customer Management
- [ ] **Customer List**
  - [ ] Customer list loads and displays correctly
  - [ ] Search functionality works
  - [ ] Pagination works if many customers
  - [ ] Sorting by different columns works
  - [ ] Customer count is accurate

- [ ] **Add Customer**
  - [ ] "Add Customer" button opens form/modal
  - [ ] All required fields marked clearly
  - [ ] Form validation works (email format, required fields)
  - [ ] Customer saves successfully with success message
  - [ ] New customer appears in list immediately

- [ ] **Edit Customer**
  - [ ] Click customer or edit button opens edit form
  - [ ] Form pre-populated with existing data
  - [ ] Changes save successfully
  - [ ] Updates reflected immediately in UI
  - [ ] Cancel button discards changes

- [ ] **Delete Customer**
  - [ ] Delete option available (with appropriate permissions)
  - [ ] Confirmation dialog appears
  - [ ] Customer removed from list after confirmation
  - [ ] Associated orders/data handled appropriately

## Order Management
- [ ] **Order List**
  - [ ] Orders display with key information (customer, date, total, status)
  - [ ] Filter by status works (pending, completed, cancelled)
  - [ ] Search orders works
  - [ ] Order history is chronological

- [ ] **Create Order**
  - [ ] New order form accessible
  - [ ] Customer selection works (dropdown/autocomplete)
  - [ ] Product selection works
  - [ ] Quantity and pricing calculate correctly
  - [ ] Order total updates automatically
  - [ ] Order saves with all correct information

- [ ] **Order Details**
  - [ ] Order detail page shows complete information
  - [ ] Customer information linked/clickable
  - [ ] Order items display correctly
  - [ ] Order status can be updated
  - [ ] Print/export functionality works

## Payment Processing
- [ ] **Payment Recording**
  - [ ] Payment form accessible from order
  - [ ] Different payment methods available
  - [ ] Payment amount validates against order total
  - [ ] Payment saves and updates order status

- [ ] **Stripe Integration** (if applicable)
  - [ ] Stripe Checkout loads correctly
  - [ ] Test card payments process successfully
  - [ ] Payment success redirects properly
  - [ ] Failed payments show appropriate error
  - [ ] Webhook updates order status correctly

- [ ] **Payment History**
  - [ ] Payment history displays correctly
  - [ ] Refund functionality works (if applicable)
  - [ ] Payment receipts can be generated/sent

## Inventory Management
- [ ] **Product List**
  - [ ] Products display with current stock levels
  - [ ] Low stock items highlighted
  - [ ] Product search works
  - [ ] Product categories filter correctly

- [ ] **Stock Updates**
  - [ ] Manual stock adjustments work
  - [ ] Stock decreases when orders created
  - [ ] Stock adjustment history tracked
  - [ ] Negative stock warnings appear

- [ ] **Product Management**
  - [ ] Add new products
  - [ ] Edit existing products
  - [ ] Archive/delete products
  - [ ] Product pricing updates correctly

## Loyalty Program (if enabled)
- [ ] **Customer Loyalty**
  - [ ] Points accrue on purchases
  - [ ] Points display correctly in customer profile
  - [ ] Point redemption works
  - [ ] Loyalty tiers function properly

- [ ] **Loyalty Analytics**
  - [ ] Loyalty program stats display
  - [ ] Top customers by loyalty shown
  - [ ] Redemption history tracked

## Delivery Management (if enabled)
- [ ] **Delivery Scheduling**
  - [ ] Delivery can be scheduled for orders
  - [ ] Delivery date/time selection works
  - [ ] Delivery address validation
  - [ ] Delivery status updates work

- [ ] **Delivery Tracking**
  - [ ] Delivery status visible to customers
  - [ ] Delivery completion updates order
  - [ ] Delivery history maintained

## Analytics & Reporting
- [ ] **Sales Analytics**
  - [ ] Revenue charts display correctly
  - [ ] Date range filters work
  - [ ] Export functionality works
  - [ ] Key metrics calculate accurately

- [ ] **Customer Analytics**
  - [ ] Customer acquisition metrics
  - [ ] Customer lifetime value calculations
  - [ ] Top customers list accurate

## Email & Notifications
- [ ] **Email Templates**
  - [ ] Order confirmation emails send
  - [ ] Payment receipt emails send
  - [ ] Email templates render correctly
  - [ ] Unsubscribe links work

- [ ] **AI Email Features** (if enabled)
  - [ ] AI subject generation works
  - [ ] AI email body composition works
  - [ ] Generated content is appropriate
  - [ ] Feature flags control access

## Mobile Responsiveness
- [ ] **Mobile Layout**
  - [ ] App usable on phone (375px width)
  - [ ] Touch targets are large enough
  - [ ] Text is readable without zooming
  - [ ] Navigation works on mobile

- [ ] **Tablet Layout**
  - [ ] App works well on tablet (768px width)
  - [ ] Layout adapts appropriately
  - [ ] All features accessible

## Performance & Loading
- [ ] **Page Load Times**
  - [ ] Dashboard loads in < 3 seconds
  - [ ] Customer list loads in < 3 seconds
  - [ ] Large data sets paginate/load efficiently

- [ ] **Network Handling**
  - [ ] App handles slow connections gracefully
  - [ ] Loading states show during data fetching
  - [ ] Offline functionality (if applicable)

## Error Handling
- [ ] **User-Friendly Errors**
  - [ ] Clear error messages for validation failures
  - [ ] Network errors handled gracefully
  - [ ] 404 pages for missing resources
  - [ ] No crashes from unexpected errors

- [ ] **Error Recovery**
  - [ ] Users can retry failed operations
  - [ ] Form data preserved during errors
  - [ ] Session recovery after network issues

## Data Integrity
- [ ] **Data Consistency**
  - [ ] Customer data displays consistently across pages
  - [ ] Order totals match item calculations
  - [ ] Inventory counts accurate after operations
  - [ ] Payment amounts match order totals

- [ ] **Data Validation**
  - [ ] Required fields enforced
  - [ ] Data format validation (emails, phones, dates)
  - [ ] Reasonable limits on text fields
  - [ ] SQL injection protection

## Security
- [ ] **Input Sanitization**
  - [ ] XSS protection in forms
  - [ ] HTML tags stripped from user input
  - [ ] File upload restrictions (if applicable)

- [ ] **Authentication Security**
  - [ ] Password reset tokens expire
  - [ ] Session tokens secure
  - [ ] HTTPS enforced in production
  - [ ] CSRF protection active

## Team Collaboration
- [ ] **Multi-user Support**
  - [ ] Multiple users can work simultaneously
  - [ ] Changes by one user visible to others
  - [ ] Conflict resolution for concurrent edits
  - [ ] User activity logging

## Integration Testing
- [ ] **Third-party Services**
  - [ ] Stripe payments work end-to-end
  - [ ] Email delivery works (Resend/SendGrid)
  - [ ] SMS notifications work (if Twilio enabled)
  - [ ] Analytics tracking works (Statsig)

## Final Checks
- [ ] **Browser Compatibility**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Environment Verification**
  - [ ] All environment variables set in production
  - [ ] Database connections work
  - [ ] External service connections work
  - [ ] Monitoring/logging active

## Sign-off
- [ ] **QA Complete**
  - QA Tester: _________________ Date: _________
  - Issues Found: _______________
  - Critical Issues: 0 ⚠️ Must be 0 for production deployment
  - Minor Issues: _______________

- [ ] **Ready for Production**
  - Product Owner: _________________ Date: _________
  - Technical Lead: _________________ Date: _________

---

## Notes
Use this section to document any issues found, workarounds, or special deployment instructions:

```
[Space for notes]
```

---

**Important**: All critical issues must be resolved before production deployment. Minor issues should be documented and scheduled for future releases.