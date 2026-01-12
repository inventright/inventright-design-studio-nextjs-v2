// WordPress authentication utilities

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
    console.warn('Invalid token format, clearing authentication');
    logout();
    return false;
  }
  
  // Try to decode the token payload to check expiration
  try {
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token has expired
    if (payload.exp && payload.exp < currentTime) {
      console.warn('Token has expired, clearing authentication');
      logout();
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    logout();
    return false;
  }
  
  return true;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  window.location.href = '/';
};
