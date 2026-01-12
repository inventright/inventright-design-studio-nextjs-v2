import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const { openId, name, email, loginMethod, role, wordpressId } = body;

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
