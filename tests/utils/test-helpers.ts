import { test, describe } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';

/**
 * Test utilities for API routes
 */

export function createMockRequest(
  method: string,
  url: string,
  options: {
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  
  const headers = new Headers({
    'content-type': 'application/json',
    ...options.headers,
  });
  
  // Add cookies to headers
  if (options.cookies) {
    const cookieString = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headers.set('cookie', cookieString);
  }
  
  const request = new NextRequest(fullUrl, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  return request;
}

export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    teamId: 1,
    ...overrides,
  };
}

export function createMockCustomer(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    teamId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockOrder(overrides: Partial<any> = {}) {
  return {
    id: 1,
    customerId: 1,
    teamId: 1,
    total: 100.00,
    status: 'completed',
    items: [
      {
        productId: 1,
        quantity: 2,
        price: 50.00,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPayment(overrides: Partial<any> = {}) {
  return {
    id: 1,
    orderId: 1,
    customerId: 1,
    teamId: 1,
    amount: 100.00,
    method: 'credit_card',
    status: 'completed',
    stripePaymentId: 'pi_test_123',
    createdAt: new Date(),
    ...overrides,
  };
}

// Mock database functions
export const mockDb = {
  customers: {
    findMany: () => Promise.resolve([createMockCustomer()]),
    findUnique: (params: any) => Promise.resolve(createMockCustomer({ id: params.where.id })),
    create: (params: any) => Promise.resolve(createMockCustomer(params.data)),
    update: (params: any) => Promise.resolve(createMockCustomer({ ...params.data, id: params.where.id })),
    delete: (params: any) => Promise.resolve(createMockCustomer({ id: params.where.id })),
  },
  orders: {
    findMany: () => Promise.resolve([createMockOrder()]),
    findUnique: (params: any) => Promise.resolve(createMockOrder({ id: params.where.id })),
    create: (params: any) => Promise.resolve(createMockOrder(params.data)),
    update: (params: any) => Promise.resolve(createMockOrder({ ...params.data, id: params.where.id })),
  },
  payments: {
    findMany: () => Promise.resolve([createMockPayment()]),
    create: (params: any) => Promise.resolve(createMockPayment(params.data)),
  },
};

// Mock authentication
export function mockAuth(user = createMockUser()) {
  return {
    getUser: () => Promise.resolve(user),
    requireAuth: () => Promise.resolve(user),
    requireRole: (role: string) => {
      if (user.role !== role && user.role !== 'superAdmin') {
        throw new Error('Insufficient permissions');
      }
      return Promise.resolve(user);
    },
  };
}

// Test session token
export const TEST_SESSION_TOKEN = 'test-session-token';
export const TEST_ADMIN_TOKEN = 'test-admin-token';

// Common test assertions
export async function assertSuccessResponse(response: Response, expectedStatus = 200) {
  assert.strictEqual(response.status, expectedStatus, `Expected status ${expectedStatus}, got ${response.status}`);
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    assert.strictEqual(typeof data, 'object', 'Response should be JSON object');
    return data;
  }
  
  return response;
}

export async function assertErrorResponse(response: Response, expectedStatus: number, expectedMessage?: string) {
  assert.strictEqual(response.status, expectedStatus, `Expected status ${expectedStatus}, got ${response.status}`);
  
  if (expectedMessage) {
    const text = await response.text();
    assert(text.includes(expectedMessage), `Expected error message to contain "${expectedMessage}", got "${text}"`);
  }
}

export function assertValidationError(data: any, field: string) {
  assert(data.error, 'Should have error property');
  assert(data.error.includes(field) || data.message?.includes(field), `Error should mention field "${field}"`);
}

// Database cleanup utilities
export async function cleanupTestData() {
  // In a real implementation, this would clean up test data
  // For now, it's a placeholder
  console.log('Cleaning up test data...');
}

export { test, describe, assert };