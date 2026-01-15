import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a password reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // Token expires in 24 hours

    // Update user with the token
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      token,
      email: user.email,
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    console.error('[Generate Password Token API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate password token' },
      { status: 500 }
    );
  }
}
