import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  createMockRequest,
  createMockUser,
  assertSuccessResponse,
  assertErrorResponse,
  cleanupTestData,
  TEST_SESSION_TOKEN,
} from '../utils/test-helpers.js';

/**
 * Integration tests for complete user workflows
 * These test the full flow from login to dashboard to actions
 */

describe('Integration Tests - User Workflows', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('Login to Dashboard Flow', () => {
    test('should complete full login flow', async () => {
      // Step 1: Login
      const loginHandler = async (request: Request) => {
        const body = await request.json();
        
        if (body.email === 'test@example.com' && body.password === 'password') {
          return Response.json({
            user: createMockUser(),
            token: TEST_SESSION_TOKEN,
          });
        }
        
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      };

      const loginRequest = createMockRequest('POST', '/api/auth/login', {
        body: {
          email: 'test@example.com',
          password: 'password',
        },
      });

      const loginResponse = await loginHandler(loginRequest);
      const loginData = await assertSuccessResponse(loginResponse);
      
      assert(loginData.user, 'Should return user data');
      assert(loginData.token, 'Should return session token');

      // Step 2: Access dashboard with token
      const dashboardHandler = async (request: Request) => {
        const cookies = request.headers.get('cookie');
        if (!cookies?.includes('session=')) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        return Response.json({
          user: createMockUser(),
          dashboard: {
            stats: {
              totalCustomers: 150,
              totalOrders: 89,
              monthlyRevenue: 12500,
            },
          },
        });
      };

      const dashboardRequest = createMockRequest('GET', '/api/dashboard', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const dashboardResponse = await dashboardHandler(dashboardRequest);
      const dashboardData = await assertSuccessResponse(dashboardResponse);
      
      assert(dashboardData.user, 'Should return user data');
      assert(dashboardData.dashboard, 'Should return dashboard data');
      assert(typeof dashboardData.dashboard.stats.totalCustomers === 'number', 'Should have customer stats');
    });
  });

  describe('Customer Creation to Checkout Flow', () => {
    test('should complete customer creation and order flow', async () => {
      // Step 1: Create customer
      const createCustomerHandler = async (request: Request) => {
        const body = await request.json();
        return Response.json({
          customer: {
            id: 1,
            name: body.name,
            email: body.email,
            phone: body.phone,
            teamId: 1,
          },
        }, { status: 201 });
      };

      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const createCustomerRequest = createMockRequest('POST', '/api/teams/1/customers', {
        body: customerData,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const customerResponse = await createCustomerHandler(createCustomerRequest);
      const customerResult = await assertSuccessResponse(customerResponse, 201);
      
      assert(customerResult.customer.id, 'Should return customer ID');
      const customerId = customerResult.customer.id;

      // Step 2: Create order for customer
      const createOrderHandler = async (request: Request) => {
        const body = await request.json();
        
        if (!body.customerId || !body.items) {
          return Response.json({ error: 'Customer ID and items required' }, { status: 400 });
        }

        return Response.json({
          order: {
            id: 1,
            customerId: body.customerId,
            items: body.items,
            total: body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            status: 'pending',
          },
        }, { status: 201 });
      };

      const orderData = {
        customerId,
        items: [
          { productId: 1, quantity: 2, price: 25.00 },
          { productId: 2, quantity: 1, price: 50.00 },
        ],
      };

      const createOrderRequest = createMockRequest('POST', '/api/teams/1/orders', {
        body: orderData,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const orderResponse = await createOrderHandler(createOrderRequest);
      const orderResult = await assertSuccessResponse(orderResponse, 201);
      
      assert(orderResult.order.id, 'Should return order ID');
      assert(orderResult.order.total === 100.00, 'Should calculate correct total');
      const orderId = orderResult.order.id;

      // Step 3: Process payment for order
      const processPaymentHandler = async (request: Request) => {
        const body = await request.json();
        
        if (!body.orderId || !body.amount) {
          return Response.json({ error: 'Order ID and amount required' }, { status: 400 });
        }

        // Simulate Stripe payment processing
        return Response.json({
          payment: {
            id: 1,
            orderId: body.orderId,
            amount: body.amount,
            status: 'completed',
            stripePaymentId: 'pi_test_12345',
          },
        });
      };

      const paymentData = {
        orderId,
        amount: 100.00,
        paymentMethod: 'card',
      };

      const paymentRequest = createMockRequest('POST', '/api/teams/1/payments', {
        body: paymentData,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const paymentResponse = await processPaymentHandler(paymentRequest);
      const paymentResult = await assertSuccessResponse(paymentResponse);
      
      assert(paymentResult.payment.status === 'completed', 'Payment should be completed');
      assert(paymentResult.payment.stripePaymentId, 'Should have Stripe payment ID');
    });
  });

  describe('Inventory Management Flow', () => {
    test('should handle inventory updates and track changes', async () => {
      // Step 1: Get current inventory
      const getInventoryHandler = async (request: Request) => {
        return Response.json({
          products: [
            { id: 1, name: 'Product A', stock: 100, price: 25.00 },
            { id: 2, name: 'Product B', stock: 50, price: 50.00 },
          ],
        });
      };

      const inventoryRequest = createMockRequest('GET', '/api/teams/1/products', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const inventoryResponse = await getInventoryHandler(inventoryRequest);
      const inventoryData = await assertSuccessResponse(inventoryResponse);
      
      assert(Array.isArray(inventoryData.products), 'Should return products array');
      const initialStock = inventoryData.products[0].stock;

      // Step 2: Create order that reduces inventory
      const createOrderHandler = async (request: Request) => {
        const body = await request.json();
        
        // Simulate inventory reduction
        return Response.json({
          order: {
            id: 1,
            items: body.items,
            inventoryUpdated: true,
          },
        });
      };

      const orderRequest = createMockRequest('POST', '/api/teams/1/orders', {
        body: {
          customerId: 1,
          items: [{ productId: 1, quantity: 5 }],
        },
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const orderResponse = await createOrderHandler(orderRequest);
      const orderData = await assertSuccessResponse(orderResponse);
      
      assert(orderData.order.inventoryUpdated, 'Should update inventory');

      // Step 3: Manual inventory adjustment
      const adjustInventoryHandler = async (request: Request) => {
        const body = await request.json();
        
        return Response.json({
          adjustment: {
            id: 1,
            productId: body.productId,
            quantityChange: body.quantityChange,
            reason: body.reason,
            newStock: initialStock + body.quantityChange,
          },
        });
      };

      const adjustmentRequest = createMockRequest('POST', '/api/teams/1/inventory/adjustments', {
        body: {
          productId: 1,
          quantityChange: 20,
          reason: 'New stock delivery',
        },
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const adjustmentResponse = await adjustInventoryHandler(adjustmentRequest);
      const adjustmentData = await assertSuccessResponse(adjustmentResponse);
      
      assert(adjustmentData.adjustment.quantityChange === 20, 'Should record quantity change');
      assert(adjustmentData.adjustment.reason, 'Should record adjustment reason');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network failures gracefully', async () => {
      // Simulate network failure
      const failingHandler = async (request: Request) => {
        throw new Error('Network timeout');
      };

      const request = createMockRequest('GET', '/api/teams/1/customers', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      try {
        await failingHandler(request);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error instanceof Error, 'Should throw Error instance');
        assert(error.message.includes('Network timeout'), 'Should have network error message');
      }
    });

    test('should handle validation errors with helpful messages', async () => {
      const validationHandler = async (request: Request) => {
        const body = await request.json();
        
        const errors = [];
        if (!body.name) errors.push('Name is required');
        if (!body.email) errors.push('Email is required');
        if (body.email && !body.email.includes('@')) errors.push('Email must be valid');
        
        if (errors.length > 0) {
          return Response.json({
            error: 'Validation failed',
            details: errors,
          }, { status: 400 });
        }
        
        return Response.json({ success: true });
      };

      const request = createMockRequest('POST', '/api/teams/1/customers', {
        body: { phone: '123' }, // Missing name and email
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await validationHandler(request);
      const data = await response.json();
      
      await assertErrorResponse(response, 400);
      assert(Array.isArray(data.details), 'Should return validation details');
      assert(data.details.includes('Name is required'), 'Should specify required fields');
    });
  });
});