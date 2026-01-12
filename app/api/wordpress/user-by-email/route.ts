import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://inventtraining.com/wp-json';
const WORDPRESS_ADMIN_USERNAME = process.env.WORDPRESS_ADMIN_USERNAME;
const WORDPRESS_ADMIN_PASSWORD = process.env.WORDPRESS_ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log('[Backend API] Received request for email:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // First, get an admin JWT token
    let adminToken: string;
    
    if (WORDPRESS_ADMIN_USERNAME && WORDPRESS_ADMIN_PASSWORD) {
      console.log('[Backend API] Using admin credentials, username:', WORDPRESS_ADMIN_USERNAME);
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
        const errorText = await tokenResponse.text();
        console.error('[Backend API] Failed to get admin token:', tokenResponse.status, errorText);
        return NextResponse.json(
          { error: 'WordPress authentication failed' },
          { status: 500 }
        );
      }

      const tokenData = await tokenResponse.json();
      adminToken = tokenData.token;
      console.log('[Backend API] Successfully got admin token');
    } else {
      console.error('[Backend API] WordPress admin credentials not configured');
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    // Search for user by email using admin token
    console.log('[Backend API] Searching for user with email:', email);
    const searchResponse = await fetch(
      `${WORDPRESS_API_URL}/wp/v2/users?search=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[Backend API] Failed to search WordPress users:', searchResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to search WordPress users' },
        { status: 500 }
      );
    }

    const users = await searchResponse.json();
    console.log('[Backend API] Search returned', users.length, 'users');
    
    if (users.length === 0) {
      console.log('[Backend API] No users found in search');
      return NextResponse.json(
        { found: false },
        { status: 200 }
      );
    }

    // Fetch full details for each user to get email addresses
    // (search endpoint doesn't return emails for privacy)
    console.log('[Backend API] Fetching full details for', users.length, 'users');
    const userDetailsPromises = users.map((user: any) =>
      fetch(`${WORDPRESS_API_URL}/wp/v2/users/${user.id}?context=edit`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }).then(res => res.json())
    );

    const usersWithDetails = await Promise.all(userDetailsPromises);
    console.log('[Backend API] User emails found:', usersWithDetails.map((u: any) => u.email));
    
    const matchingUser = usersWithDetails.find((u: any) => u.email === email);

    if (!matchingUser) {
      console.log('[Backend API] No exact email match found for:', email);
      return NextResponse.json(
        { found: false },
        { status: 200 }
      );
    }
    
    console.log('[Backend API] Found matching user:', matchingUser.id, matchingUser.email);
    const fullUserData = matchingUser;

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
