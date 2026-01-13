// Client-side helper to set auth cookies
export function setAuthCookies(token: string, userData: any) {
  // Set cookies with proper security settings
  const cookieOptions = 'path=/; max-age=604800; SameSite=Lax'; // 7 days
  
  document.cookie = `auth_token=${encodeURIComponent(token)}; ${cookieOptions}`;
  document.cookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; ${cookieOptions}`;
  
  // Also set in localStorage for client-side access
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
}

export function clearAuthCookies() {
  // Clear cookies
  document.cookie = 'auth_token=; path=/; max-age=0';
  document.cookie = 'user_data=; path=/; max-age=0';
  
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}
