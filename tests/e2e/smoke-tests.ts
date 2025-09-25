/**
 * End-to-End Test Framework for DeelRx CRM
 * Uses Playwright for browser automation
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headless: process.env.CI === 'true',
};

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

class E2ETestHelper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async setup() {
    this.browser = await chromium.launch({ 
      headless: TEST_CONFIG.headless,
      timeout: TEST_CONFIG.timeout,
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    
    this.page = await this.context.newPage();
    
    // Set default timeout
    this.page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    return this.page;
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  async login(email: string = TEST_USER.email, password: string = TEST_USER.password): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${TEST_CONFIG.baseURL}/sign-in`);
    
    // Wait for login form
    await this.page.waitForSelector('form');
    
    // Fill login form
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard*');
    
    // Verify we're logged in
    const dashboardTitle = await this.page.textContent('h1');
    assert(dashboardTitle?.includes('Dashboard'), 'Should be on dashboard page');
  }

  async createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Navigate to customers page
    await this.page.goto(`${TEST_CONFIG.baseURL}/crm/customers`);
    
    // Click "Add Customer" button
    await this.page.click('button:has-text("Add Customer")');
    
    // Wait for modal or form
    await this.page.waitForSelector('form');
    
    // Fill customer form
    await this.page.fill('input[name="name"]', customerData.name);
    await this.page.fill('input[name="email"]', customerData.email);
    
    if (customerData.phone) {
      await this.page.fill('input[name="phone"]', customerData.phone);
    }
    
    if (customerData.address) {
      await this.page.fill('textarea[name="address"]', customerData.address);
    }
    
    // Submit form
    await this.page.click('button[type="submit"]:has-text("Save")');
    
    // Wait for success message or redirect
    await this.page.waitForSelector('.toast:has-text("Customer created")');
  }

  async createOrder(orderData: {
    customerName: string;
    items: Array<{ product: string; quantity: number; price: number }>;
  }): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Navigate to orders page
    await this.page.goto(`${TEST_CONFIG.baseURL}/crm/orders`);
    
    // Click "New Order" button
    await this.page.click('button:has-text("New Order")');
    
    // Select customer
    await this.page.click('select[name="customerId"]');
    await this.page.selectOption('select[name="customerId"]', { label: orderData.customerName });
    
    // Add items
    for (const item of orderData.items) {
      await this.page.click('button:has-text("Add Item")');
      
      // Fill item details (assuming form structure)
      await this.page.fill('.order-item:last-child input[name="product"]', item.product);
      await this.page.fill('.order-item:last-child input[name="quantity"]', item.quantity.toString());
      await this.page.fill('.order-item:last-child input[name="price"]', item.price.toString());
    }
    
    // Submit order
    await this.page.click('button[type="submit"]:has-text("Create Order")');
    
    // Wait for success
    await this.page.waitForSelector('.toast:has-text("Order created")');
  }

  async processPayment(amount: number, method: string = 'card'): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Assuming we're on an order detail page with payment section
    await this.page.click('button:has-text("Process Payment")');
    
    // Fill payment form
    await this.page.fill('input[name="amount"]', amount.toString());
    await this.page.selectOption('select[name="method"]', method);
    
    // For test environment, we might have a mock payment form
    if (method === 'card') {
      await this.page.fill('input[name="cardNumber"]', '4242424242424242'); // Test card
      await this.page.fill('input[name="expiryDate"]', '12/30');
      await this.page.fill('input[name="cvc"]', '123');
    }
    
    // Submit payment
    await this.page.click('button[type="submit"]:has-text("Process Payment")');
    
    // Wait for payment confirmation
    await this.page.waitForSelector('.toast:has-text("Payment processed")');
  }

  async takeScreenshot(name: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async checkAccessibility(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Basic accessibility checks
    const missingAltImages = await this.page.$$('img:not([alt])');
    assert(missingAltImages.length === 0, 'All images should have alt text');
    
    const missingLabels = await this.page.$$('input:not([aria-label]):not([id])');
    assert(missingLabels.length === 0, 'All inputs should have labels or aria-labels');
    
    // Check for proper heading hierarchy
    const headings = await this.page.$$eval('h1, h2, h3, h4, h5, h6', 
      elements => elements.map(el => ({ tag: el.tagName, text: el.textContent }))
    );
    
    assert(headings.length > 0, 'Page should have headings');
    assert(headings[0].tag === 'H1', 'Page should start with H1');
  }
}

// Export for use in test files
export { E2ETestHelper, TEST_CONFIG, TEST_USER };

// Sample E2E tests
describe('E2E Tests - Critical User Journeys', () => {
  let helper: E2ETestHelper;

  before(async () => {
    helper = new E2ETestHelper();
    await helper.setup();
  });

  after(async () => {
    await helper.cleanup();
  });

  test('Complete signup to first sale journey', async () => {
    // Note: This would require a test user signup flow
    // For now, we'll start from login
    
    await helper.login();
    
    // Create a customer
    await helper.createCustomer({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1234567890',
      address: '123 Main St, Anytown, USA',
    });
    
    // Create an order
    await helper.createOrder({
      customerName: 'Jane Doe',
      items: [
        { product: 'Widget A', quantity: 2, price: 25.00 },
        { product: 'Widget B', quantity: 1, price: 50.00 },
      ],
    });
    
    // Process payment
    await helper.processPayment(100.00);
    
    // Take screenshot for verification
    await helper.takeScreenshot('successful-sale');
  });

  test('Dashboard accessibility check', async () => {
    await helper.login();
    await helper.checkAccessibility();
  });

  test('Mobile responsiveness check', async () => {
    if (!helper.page) throw new Error('Page not initialized');
    
    // Test mobile viewport
    await helper.page.setViewportSize({ width: 375, height: 667 });
    await helper.login();
    
    // Check that navigation is accessible on mobile
    const mobileNav = await helper.page.$('.mobile-nav, .hamburger-menu, [aria-label*="menu"]');
    assert(mobileNav, 'Should have mobile navigation');
    
    // Take mobile screenshot
    await helper.takeScreenshot('mobile-dashboard');
  });
});

// CLI runner for E2E tests
if (process.argv[1] === import.meta.url) {
  console.log('Running E2E tests...');
  
  // Check if Playwright is installed
  try {
    await import('playwright');
  } catch (error) {
    console.error('Playwright not installed. Run: npm install playwright');
    process.exit(1);
  }
  
  // Run tests
  console.log('E2E test framework ready. Use with your test runner.');
}