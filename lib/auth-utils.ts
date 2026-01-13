import { cookies } from 'next/headers';

// WordPress authentication with cookie support for server-side
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const userData = cookieStore.get('user_data')?.value;

    if (!authToken || !userData) {
      return null;
    }

    // Validate token format (JWT tokens have 3 parts separated by dots)
    const tokenParts = authToken.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    // Decode and validate token expiration
    try {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        return null; // Token expired
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }

    // Parse and return user data
    const user = JSON.parse(userData);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      data: {
        role: user.role || 'client',
        wordpressRoles: user.wordpressRoles || []
      }
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const role = (user as any).data?.role || 'client';
  
  if (role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

export async function requireDesigner() {
  const user = await requireAuth();
  const role = (user as any).data?.role || 'client';
  
  if (role !== 'designer' && role !== 'admin') {
    throw new Error('Forbidden: Designer access required');
  }
  
  return user;
}

export function hasRole(
  user: any,
  roles: string[]
): boolean {
  if (!user) return false;
  const role = user.data?.role || user.role || "client";
  return roles.includes(role);
}
