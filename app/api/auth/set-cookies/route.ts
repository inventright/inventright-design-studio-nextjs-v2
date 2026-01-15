import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/auth/set-cookies - Set authentication cookies server-side
export async function POST(request: Request) {
  try {
    const { token, userData } = await request.json();

    if (!token || !userData) {
      return NextResponse.json(
        { error: 'Token and userData are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Set cookies with proper security settings
    cookieStore.set('auth_token', token, {
      path: '/',
      maxAge: 60 * 60 * 6, // 6 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Allow client-side access for compatibility
    });

    cookieStore.set('user_data', JSON.stringify(userData), {
      path: '/',
      maxAge: 60 * 60 * 6, // 6 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false // Allow client-side access for compatibility
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Auth] Error setting cookies:', error);
    return NextResponse.json(
      { error: 'Failed to set cookies', details: error.message },
      { status: 500 }
    );
  }
}
