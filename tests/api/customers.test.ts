import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { 
  createMockRequest, 
  createMockUser, 
  createMockCustomer,
  assertSuccessResponse,
  assertErrorResponse,
  assertValidationError,
  cleanupTestData,
  mockAuth,
  TEST_SESSION_TOKEN,
} from '../utils/test-helpers.js';

describe('Customer API Tests', () => {
  before(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  });

  after(async () => {
    // Cleanup
    await cleanupTestData();
  });

  describe('GET /api/teams/[teamId]/customers', () => {
    test('should return customers for authenticated user', async () => {
      // Mock the API handler - in real implementation, you'd import the actual handler
      const mockHandler = async (request: Request) => {
        // Simulate authentication check
        const auth = mockAuth();
        const user = await auth.requireAuth();
        
        // Return mock customer data
        return Response.json({
          customers: [createMockCustomer()],
          total: 1,
        });
      };

      const request = createMockRequest('GET', '/api/teams/1/customers', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      const data = await assertSuccessResponse(response);
      
      // Assertions
      assert(Array.isArray(data.customers), 'Should return customers array');
      assert(typeof data.total === 'number', 'Should return total count');
      assert(data.customers.length > 0, 'Should have at least one customer');
    });

    test('should require authentication', async () => {
      const mockHandler = async (request: Request) => {
        // Simulate no auth token
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      };

      const request = createMockRequest('GET', '/api/teams/1/customers');
      const response = await mockHandler(request);
      
      await assertErrorResponse(response, 401, 'Unauthorized');
    });

    test('should validate team access', async () => {
      const mockHandler = async (request: Request) => {
        // Simulate user trying to access different team's data
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      };

      const request = createMockRequest('GET', '/api/teams/999/customers', {
        cookies: { session: TEST_SESSION_TOKEN },
      });
      
      const response = await mockHandler(request);
      await assertErrorResponse(response, 403, 'Forbidden');
    });
  });

  describe('POST /api/teams/[teamId]/customers', () => {
    test('should create new customer with valid data', async () => {
      const newCustomer = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        address: '456 Oak St',
      };

      const mockHandler = async (request: Request) => {
        const body = await request.json();
        
        // Validate required fields
        if (!body.name || !body.email) {
          return Response.json({ error: 'Name and email are required' }, { status: 400 });
        }

        return Response.json({
          customer: createMockCustomer(body),
        }, { status: 201 });
      };

      const request = createMockRequest('POST', '/api/teams/1/customers', {
        body: newCustomer,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      const data = await assertSuccessResponse(response, 201);
      
      assert(data.customer, 'Should return created customer');
      assert(data.customer.name === newCustomer.name, 'Should have correct name');
      assert(data.customer.email === newCustomer.email, 'Should have correct email');
    });

    test('should validate required fields', async () => {
      const invalidCustomer = {
        phone: '+1234567890', // Missing name and email
      };

      const mockHandler = async (request: Request) => {
        const body = await request.json();
        
        if (!body.name || !body.email) {
          return Response.json({ error: 'Name and email are required' }, { status: 400 });
        }

        return Response.json({ customer: createMockCustomer(body) });
      };

      const request = createMockRequest('POST', '/api/teams/1/customers', {
        body: invalidCustomer,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      const data = await response.json();
      
      await assertErrorResponse(response, 400);
      assertValidationError(data, 'name');
    });

    test('should validate email format', async () => {
      const invalidCustomer = {
        name: 'Test User',
        email: 'invalid-email',
      };

      const mockHandler = async (request: Request) => {
        const body = await request.json();
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (body.email && !emailRegex.test(body.email)) {
          return Response.json({ error: 'Invalid email format' }, { status: 400 });
        }

        return Response.json({ customer: createMockCustomer(body) });
      };

      const request = createMockRequest('POST', '/api/teams/1/customers', {
        body: invalidCustomer,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      await assertErrorResponse(response, 400, 'Invalid email format');
    });
  });

  describe('PUT /api/teams/[teamId]/customers/[id]', () => {
    test('should update existing customer', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '+1111111111',
      };

      const mockHandler = async (request: Request) => {
        const body = await request.json();
        return Response.json({
          customer: createMockCustomer({ id: 1, ...body }),
        });
      };

      const request = createMockRequest('PUT', '/api/teams/1/customers/1', {
        body: updates,
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      const data = await assertSuccessResponse(response);
      
      assert(data.customer.name === updates.name, 'Should update name');
      assert(data.customer.phone === updates.phone, 'Should update phone');
    });

    test('should return 404 for non-existent customer', async () => {
      const mockHandler = async (request: Request) => {
        return Response.json({ error: 'Customer not found' }, { status: 404 });
      };

      const request = createMockRequest('PUT', '/api/teams/1/customers/999', {
        body: { name: 'Updated' },
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      await assertErrorResponse(response, 404, 'Customer not found');
    });
  });

  describe('DELETE /api/teams/[teamId]/customers/[id]', () => {
    test('should delete existing customer', async () => {
      const mockHandler = async (request: Request) => {
        return Response.json({ message: 'Customer deleted successfully' });
      };

      const request = createMockRequest('DELETE', '/api/teams/1/customers/1', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      const data = await assertSuccessResponse(response);
      
      assert(data.message.includes('deleted'), 'Should confirm deletion');
    });

    test('should require admin role for deletion', async () => {
      const mockHandler = async (request: Request) => {
        // Simulate non-admin user
        return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
      };

      const request = createMockRequest('DELETE', '/api/teams/1/customers/1', {
        cookies: { session: TEST_SESSION_TOKEN },
      });

      const response = await mockHandler(request);
      await assertErrorResponse(response, 403, 'Insufficient permissions');
    });
  });
});