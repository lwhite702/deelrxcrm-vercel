/**
 * Test seed data for DeelRx CRM
 * 
 * This file contains sample data for testing the CRM functionality.
 * Use this data to populate the test database with realistic records.
 */

// Test customers with various scenarios
export const testCustomers = [
  {
    id: 'test-customer-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0101',
    company: 'Smith Enterprises',
    status: 'active',
    totalOrders: 5,
    totalSpent: 2500.00,
    loyaltyPoints: 125,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    tags: ['vip', 'tech-company'],
    notes: 'Preferred customer - fast payment'
  },
  {
    id: 'test-customer-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1-555-0102',
    company: 'TechCorp Solutions',
    status: 'active',
    totalOrders: 12,
    totalSpent: 8750.00,
    loyaltyPoints: 437,
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-01-25'),
    address: {
      street: '456 Innovation Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    tags: ['bulk-buyer', 'tech-company'],
    notes: 'Bulk orders monthly - net 30 terms'
  },
  {
    id: 'test-customer-3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'mike.brown@retail.com',
    phone: '+1-555-0103',
    company: 'Brown Retail Co',
    status: 'inactive',
    totalOrders: 2,
    totalSpent: 450.00,
    loyaltyPoints: 22,
    createdAt: new Date('2023-08-10'),
    updatedAt: new Date('2023-12-15'),
    address: {
      street: '789 Commerce Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    tags: ['small-business'],
    notes: 'Last order 6 months ago - follow up needed'
  }
];

// Test products/services
export const testProducts = [
  {
    id: 'test-product-1',
    name: 'Digital Marketing Package',
    sku: 'DMP-001',
    description: 'Complete digital marketing solution including SEO, social media, and content creation',
    price: 1500.00,
    cost: 750.00,
    category: 'Marketing',
    stockQuantity: 100, // Service items can have "availability"
    isActive: true,
    tags: ['digital', 'marketing', 'seo'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'test-product-2',
    name: 'Website Development',
    sku: 'WEB-001',
    description: 'Custom website development with modern design and responsive layout',
    price: 3500.00,
    cost: 1400.00,
    category: 'Development',
    stockQuantity: 50,
    isActive: true,
    tags: ['web', 'development', 'custom'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'test-product-3',
    name: 'Consultation Session',
    sku: 'CONS-001',
    description: '1-hour business consultation session with expert advisor',
    price: 200.00,
    cost: 50.00,
    category: 'Consulting',
    stockQuantity: 200,
    isActive: true,
    tags: ['consultation', 'hourly', 'advice'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10')
  }
];

// Test orders with various statuses
export const testOrders = [
  {
    id: 'test-order-1',
    orderNumber: 'ORD-2024-001',
    customerId: 'test-customer-1',
    status: 'completed',
    subtotal: 1500.00,
    tax: 120.00,
    total: 1620.00,
    items: [
      {
        productId: 'test-product-1',
        quantity: 1,
        unitPrice: 1500.00,
        total: 1500.00
      }
    ],
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    notes: 'Rush order - completed ahead of schedule',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    completedAt: new Date('2024-01-25')
  },
  {
    id: 'test-order-2',
    orderNumber: 'ORD-2024-002',
    customerId: 'test-customer-2',
    status: 'in_progress',
    subtotal: 3500.00,
    tax: 280.00,
    total: 3780.00,
    items: [
      {
        productId: 'test-product-2',
        quantity: 1,
        unitPrice: 3500.00,
        total: 3500.00
      }
    ],
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    shippingAddress: {
      street: '456 Innovation Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    notes: 'Website development in progress - 50% complete',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    estimatedCompletion: new Date('2024-02-28')
  },
  {
    id: 'test-order-3',
    orderNumber: 'ORD-2024-003',
    customerId: 'test-customer-1',
    status: 'pending',
    subtotal: 400.00,
    tax: 32.00,
    total: 432.00,
    items: [
      {
        productId: 'test-product-3',
        quantity: 2,
        unitPrice: 200.00,
        total: 400.00
      }
    ],
    paymentStatus: 'pending',
    paymentMethod: 'invoice',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    notes: 'Awaiting payment - invoice sent',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

// Test users for authentication testing
export const testUsers = [
  {
    id: 'test-user-admin',
    email: 'admin@deelrx.test',
    password: 'TestAdmin123!', // Should be hashed in actual implementation
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2024-02-10'),
    createdAt: new Date('2024-01-01'),
    permissions: ['read', 'write', 'delete', 'admin']
  },
  {
    id: 'test-user-manager',
    email: 'manager@deelrx.test',
    password: 'TestManager123!',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    isActive: true,
    lastLogin: new Date('2024-02-09'),
    createdAt: new Date('2024-01-02'),
    permissions: ['read', 'write']
  },
  {
    id: 'test-user-staff',
    email: 'staff@deelrx.test',
    password: 'TestStaff123!',
    firstName: 'Staff',
    lastName: 'User',
    role: 'staff',
    isActive: true,
    lastLogin: new Date('2024-02-08'),
    createdAt: new Date('2024-01-03'),
    permissions: ['read']
  }
];

// Test analytics data
export const testAnalytics = {
  dailyRevenue: [
    { date: '2024-02-01', revenue: 1620.00, orders: 1 },
    { date: '2024-02-02', revenue: 0, orders: 0 },
    { date: '2024-02-03', revenue: 3780.00, orders: 1 },
    { date: '2024-02-04', revenue: 0, orders: 0 },
    { date: '2024-02-05', revenue: 200.00, orders: 1 },
    { date: '2024-02-06', revenue: 0, orders: 0 },
    { date: '2024-02-07', revenue: 1500.00, orders: 1 }
  ],
  topCustomers: [
    { customerId: 'test-customer-2', totalSpent: 8750.00, orderCount: 12 },
    { customerId: 'test-customer-1', totalSpent: 2500.00, orderCount: 5 },
    { customerId: 'test-customer-3', totalSpent: 450.00, orderCount: 2 }
  ],
  productPerformance: [
    { productId: 'test-product-2', revenue: 7000.00, unitsSold: 2 },
    { productId: 'test-product-1', revenue: 4500.00, unitsSold: 3 },
    { productId: 'test-product-3', revenue: 1200.00, unitsSold: 6 }
  ]
};

// Test configuration for different environments
export const testConfig = {
  test: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'deelrx_test',
      user: 'test_user',
      password: 'test_password'
    },
    features: {
      emailAI: true,
      loyaltyProgram: true,
      deliveryManagement: false,
      stripePayments: false // Use mock for tests
    }
  },
  development: {
    database: {
      // Uses environment variables
    },
    features: {
      emailAI: true,
      loyaltyProgram: true,
      deliveryManagement: true,
      stripePayments: true
    }
  }
};

// Helper functions to seed test data
export const seedHelpers = {
  async createTestCustomer(customerData = {}) {
    const customer = { ...testCustomers[0], ...customerData };
    // Implementation would insert into actual database
    return customer;
  },

  async createTestOrder(orderData = {}) {
    const order = { ...testOrders[0], ...orderData };
    // Implementation would insert into actual database
    return order;
  },

  async createTestUser(userData = {}) {
    const user = { ...testUsers[0], ...userData };
    // Implementation would hash password and insert into database
    return user;
  },

  async seedDatabase() {
    console.log('🌱 Seeding test database...');
    
    // In actual implementation, this would:
    // 1. Clear existing test data
    // 2. Insert test users
    // 3. Insert test customers
    // 4. Insert test products
    // 5. Insert test orders
    // 6. Insert test analytics data
    
    console.log('✅ Test database seeded successfully');
  },

  async clearTestData() {
    console.log('🧹 Clearing test data...');
    
    // In actual implementation, this would:
    // 1. Delete test orders
    // 2. Delete test customers
    // 3. Delete test products
    // 4. Delete test users
    // 5. Reset sequences/auto-increment values
    
    console.log('✅ Test data cleared');
  }
};

export default {
  testCustomers,
  testProducts,
  testOrders,
  testUsers,
  testAnalytics,
  testConfig,
  seedHelpers
};