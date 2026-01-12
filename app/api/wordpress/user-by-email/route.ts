import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://inventtraining.com/wp-json';
const WORDPRESS_ADMIN_USERNAME = process.env.WORDPRESS_ADMIN_USERNAME;
const WORDPRESS_ADMIN_PASSWORD = process.env.WORDPRESS_ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // First, get an admin JWT token
    let adminToken: string;
    
    if (WORDPRESS_ADMIN_USERNAME && WORDPRESS_ADMIN_PASSWORD) {
      // Use admin credentials to get a token
      const tokenResponse = await fetch(`${WORDPRESS_API_URL}/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: WORDPRESS_ADMIN_USERNAME,
          password: WORDPRESS_ADMIN_PASSWORD
        })
      });

      if (!tokenResponse.ok) {
        console.error('Failed to get admin token');
        return NextResponse.json(
          { error: 'WordPress authentication failed' },
          { status: 500 }
        );
      }

      const tokenData = await tokenResponse.json();
      adminToken = tokenData.token;
    } else {
      console.error('WordPress admin credentials not configured');
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    // Search for user by email using admin token
    const searchResponse = await fetch(
      `${WORDPRESS_API_URL}/wp/v2/users?search=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      console.error('Failed to search WordPress users');
      return NextResponse.json(
        { error: 'Failed to search WordPress users' },
        { status: 500 }
      );
    }

    const users = await searchResponse.json();
    const matchingUser = users.find((u: any) => u.email === email);

    if (!matchingUser) {
      return NextResponse.json(
        { found: false },
        { status: 200 }
      );
    }

    // Get full user details with roles using context=edit
    const userResponse = await fetch(
      `${WORDPRESS_API_URL}/wp/v2/users/${matchingUser.id}?context=edit`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    if (!userResponse.ok) {
      console.error('Failed to get user details');
      return NextResponse.json(
        { error: 'Failed to get user details' },
        { status: 500 }
      );
    }

    const fullUserData = await userResponse.json();

    return NextResponse.json({
      found: true,
      user: {
        id: fullUserData.id,
        email: fullUserData.email,
        name: fullUserData.name,
        username: fullUserData.slug,
        roles: fullUserData.roles || []
      }
    });

  } catch (error) {
    console.error('Error fetching WordPress user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
