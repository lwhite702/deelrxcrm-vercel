import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isEmailSuperAdmin } from '@/lib/auth/super-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if email is in super admin list
    if (!isEmailSuperAdmin(email)) {
      return NextResponse.json(
        { error: 'Email not authorized for super admin access' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create super admin user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: name || 'Super Admin',
        passwordHash,
        role: 'owner', // Set as owner role for maximum permissions
      })
      .returning();

    return NextResponse.json(
      { 
        message: 'Super admin user created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Super admin creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}