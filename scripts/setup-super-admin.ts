import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

// Setup database connection
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
console.log('🔍 Using database URL:', dbUrl?.substring(0, 50) + '...');
if (!dbUrl) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

const client = postgres(dbUrl);
const db = drizzle(client);

async function setupSuperAdmin() {
  const email = 'lee@wrelik.com';
  const password = 'admin123'; // Default password - should be changed after first login
  const name = 'Lee Wright';

  try {
    console.log('🔧 Setting up super admin user...');

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Super admin user already exists:', email);
      console.log('   User ID:', existingUser[0].id);
      console.log('   Role:', existingUser[0].role);
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await hash(password, 12);

    // Create super admin user
    console.log('👤 Creating super admin user...');
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: 'owner',
      })
      .returning();

    console.log('✅ Super admin user created successfully!');
    console.log('   Email:', newUser.email);
    console.log('   Name:', newUser.name);
    console.log('   Role:', newUser.role);
    console.log('   Default Password: admin123');
    console.log('');
    console.log('🚨 IMPORTANT: Change the default password after first login!');
    console.log('   Login at: http://localhost:3000/sign-in');

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupSuperAdmin()
  .then(() => {
    console.log('🎉 Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });