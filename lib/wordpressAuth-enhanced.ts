// Enhanced WordPress authentication utilities with token refresh

export const getWordPressUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error loading WordPress user:', error);
    return null;
  }
};

export const getWordPressToken = () => {
  return localStorage.getItem('auth_token');
};

// Refresh token if it's close to expiring
export const refreshTokenIfNeeded = async () => {
  const token = getWordPressToken();
  if (!token) return false;

  try {
    // Decode token to check expiration
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;

    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // If token expires in less than 7 days, refresh it
    const timeUntilExpiry = payload.exp - currentTime;
    const sevenDays = 7 * 24 * 60 * 60;
    
    if (timeUntilExpiry < sevenDays && timeUntilExpiry > 0) {
      console.log('[Auth] Token expiring soon, refreshing...');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Update cookies via API
        await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: data.token, 
            userData: data.user 
          }),
          credentials: 'include',
        });
        
        console.log('[Auth] Token refreshed successfully');
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Auth] Error refreshing token:', error);
    return false;
  }
};

export const isAuthenticated = async () => {
  const token = getWordPressToken();
  const user = getWordPressUser();
  
  // Check if both token and user exist
  if (!token || !user) {
    return false;
  }
  
  // Validate token format (JWT tokens have 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.warn('[Auth] Invalid token format, clearing authentication');
    logout();
    return false;
  }
  
  // Try to decode the token payload to check expiration
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token has expired
    if (payload.exp && payload.exp < currentTime) {
      console.warn('[Auth] Token has expired, attempting refresh...');
      
      // Try to refresh the token
      const refreshed = await refreshTokenIfNeeded();
      if (!refreshed) {
        console.warn('[Auth] Token refresh failed, logging out');
        logout();
        return false;
      }
      return true;
    }
    
    // Proactively refresh token if expiring soon
    await refreshTokenIfNeeded();
  } catch (error) {
    console.error('[Auth] Error validating token:', error);
    logout();
    return false;
  }
  
  return true;
};

export const logout = () => {
  // Clear both localStorage and cookies
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('wordpress_token'); // Clear legacy token too
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'user_data=; path=/; max-age=0';
    window.location.href = '/';
  }
};

// Initialize auth check with token refresh on app load
export const initializeAuth = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    // Refresh token proactively on app load
    await refreshTokenIfNeeded();
  }
  return authenticated;
};
