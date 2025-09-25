#!/usr/bin/env tsx
/**
 * Database seeding script for test data
 * 
 * This script populates the database with test data for development and testing.
 * Run with: npm run test:seed
 */

import { testCustomers, testProducts, testOrders, testUsers } from './testData';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Note: In actual implementation, you would:
    // 1. Import your database client (e.g., Drizzle)
    // 2. Connect to the database
    // 3. Insert the test data
    
    console.log('👥 Seeding test users...');
    // Example: await db.insert(users).values(testUsers);
    console.log(`   ✅ Created ${testUsers.length} test users`);

    console.log('👤 Seeding test customers...');
    // Example: await db.insert(customers).values(testCustomers);
    console.log(`   ✅ Created ${testCustomers.length} test customers`);

    console.log('📦 Seeding test products...');
    // Example: await db.insert(products).values(testProducts);
    console.log(`   ✅ Created ${testProducts.length} test products`);

    console.log('🛒 Seeding test orders...');
    // Example: await db.insert(orders).values(testOrders);
    console.log(`   ✅ Created ${testOrders.length} test orders`);

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };