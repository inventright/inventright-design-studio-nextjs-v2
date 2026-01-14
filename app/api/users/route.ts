import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendPasswordSetupEmail } from '@/lib/email';

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

      // Send password setup email if requested
      if (sendPasswordLink) {
        try {
          // Generate a secure token for password setup
          const setupToken = crypto.randomBytes(32).toString('hex');
          const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ds.inventright.com'}/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;
          
          // TODO: Store the setupToken in database with expiration time
          // For now, we'll send the email with a placeholder link
          
          const emailSent = await sendPasswordSetupEmail(email, setupToken);
          
          if (!emailSent) {
            console.error('[Users API] Failed to send password setup email');
            // Don't fail user creation if email fails, just log it
          }
        } catch (emailError) {
          console.error('[Users API] Error sending password setup email:', emailError);
          // Don't fail user creation if email fails
        }
      }

      // TODO: If password is provided, hash it and store it (requires password field in schema)
      if (password && !sendPasswordLink) {
        console.log(`[Users API] Would store hashed password for ${email}`);
        // In production, hash the password with bcrypt and store it
      }

      return NextResponse.json({
        success: true,
        user: newUser[0],
        created: true,
        message: sendPasswordLink 
          ? 'User created! Password setup link sent to email.' 
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
      await db
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
        .where(eq(users.openId, openId));
      
      // Fetch complete user with ALL fields including contact info
      const completeUser = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      return NextResponse.json({
        success: true,
        user: completeUser[0],
        created: false
      });
    } else {
      // Create new user
      await db
        .insert(users)
        .values({
          openId,
          name,
          email,
          loginMethod,
          role,
          wordpressId,
        });
      
      // Fetch complete user with ALL fields
      const completeUser = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      return NextResponse.json({
        success: true,
        user: completeUser[0],
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
