import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isEmailSuperAdmin } from '@/lib/auth/super-admin';

/**
 * Handles the creation of a super admin user.
 *
 * This function processes a POST request to create a new super admin user. It first validates the presence of email and password, checks if the email is authorized for super admin access, and ensures that the user does not already exist in the database. If all checks pass, it hashes the password and inserts the new user into the database with the role of 'owner'. Finally, it returns a success message along with the new user's details.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response indicating the success or failure of the user creation process.
 * @throws Error If an internal server error occurs during the process.
 */
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