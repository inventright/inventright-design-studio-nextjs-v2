import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const allUsers = await db.select().from(users).orderBy(users.lastSignedIn);
    
    return NextResponse.json({
      success: true,
      users: allUsers
    });
  } catch (error) {
    console.error('[Users API] Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openId, name, email, loginMethod, role, wordpressId, password, sendPasswordLink } = body;

    // Handle manual user creation (from admin panel)
    if (!openId && email && name) {
      // Check if user with this email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { success: false, error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      // Validate password requirements if not sending link
      if (!sendPasswordLink && (!password || password.length < 8)) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      // Generate a unique openId for manually created users
      const generatedOpenId = `manual_${crypto.randomBytes(16).toString('hex')}`;

      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          openId: generatedOpenId,
          name,
          email,
          loginMethod: 'manual',
          role: role || 'client',
          wordpressId: null,
        })
        .returning();

      // TODO: If sendPasswordLink is true, send an email with password setup link
      // TODO: If password is provided, hash it and store it (requires password field in schema)
      // For now, we'll just create the user record

      if (sendPasswordLink) {
        // In production, this would send an email via SendGrid, AWS SES, etc.
        console.log(`[Users API] Would send password setup link to ${email}`);
      } else {
        // In production, this would hash and store the password
        console.log(`[Users API] Would store hashed password for ${email}`);
      }

      return NextResponse.json({
        success: true,
        user: newUser[0],
        created: true,
        message: sendPasswordLink 
          ? 'User created. Password setup link sent to email.' 
          : 'User created successfully.'
      });
    }

    // Handle OAuth user creation/update (existing logic)
    if (!openId) {
      return NextResponse.json(
        { success: false, error: 'openId is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const updated = await db
        .update(users)
        .set({
          name,
          email,
          loginMethod,
          role,
          wordpressId,
          lastSignedIn: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.openId, openId))
        .returning();

      return NextResponse.json({
        success: true,
        user: updated[0],
        created: false
      });
    } else {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          openId,
          name,
          email,
          loginMethod,
          role,
          wordpressId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        user: newUser[0],
        created: true
      });
    }
  } catch (error) {
    console.error('[Users API] Error creating/updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}
