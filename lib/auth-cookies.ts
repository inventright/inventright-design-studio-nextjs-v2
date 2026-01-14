// Client-side helper to set auth cookies
export async function setAuthCookies(token: string, userData: any) {
  // Set in localStorage first for immediate client-side access
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
  
  // Call server-side API to set cookies properly
  try {
    await fetch('/api/auth/set-cookies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, userData }),
      credentials: 'include' // Ensure cookies are sent
    });
  } catch (error) {
    console.error('Failed to set auth cookies via API:', error);
    // Fallback to client-side cookie setting
    const cookieOptions = 'path=/; max-age=604800; SameSite=Lax';
    document.cookie = `auth_token=${encodeURIComponent(token)}; ${cookieOptions}`;
    document.cookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; ${cookieOptions}`;
  }
}

export function clearAuthCookies() {
  // Clear cookies
  document.cookie = 'auth_token=; path=/; max-age=0';
  document.cookie = 'user_data=; path=/; max-age=0';
  
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}
