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
  // Try both token keys for compatibility
  return localStorage.getItem('auth_token') || localStorage.getItem('wordpress_token');
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
    
    // If token expires in less than 3 days, refresh it
    // This ensures continuous session with 7-day tokens
    const timeUntilExpiry = payload.exp - currentTime;
    const threeDays = 3 * 24 * 60 * 60;
    
    if (timeUntilExpiry < threeDays && timeUntilExpiry > 0) {
      console.log('[Auth] Token expiring soon, refreshing...');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update localStorage with both keys for compatibility
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('wordpress_token', data.token);
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
      } else {
        console.warn('[Auth] Token refresh failed, but not logging out');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Auth] Error refreshing token:', error);
    // Don't logout on refresh errors - just log and continue
    return false;
  }
};

export const isAuthenticated = () => {
  const token = getWordPressToken();
  const user = getWordPressUser();
  
  // Check if both token and user exist
  if (!token || !user) {
    return false;
  }
  
  // Validate token format (JWT tokens have 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.warn('[Auth] Invalid token format');
    // Don't immediately logout - could be a temporary issue
    return false;
  }
  
  // Try to decode the token payload to check expiration
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token has expired
    if (payload.exp && payload.exp < currentTime) {
      console.warn('[Auth] Token has expired');
      // Only logout if token is actually expired
      logout();
      return false;
    }
    
    // Proactively refresh token if expiring soon (async, don't wait)
    refreshTokenIfNeeded().catch(err => 
      console.error('[Auth] Background token refresh failed:', err)
    );
    
    return true;
  } catch (error) {
    // If we can't decode the token, don't immediately logout
    // The token might still be valid, just in a format we don't recognize
    console.error('[Auth] Error validating token, but not logging out:', error);
    
    // Still return true if we have token and user data
    // This prevents unnecessary logouts due to parsing errors
    return true;
  }
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
