import { useState, useEffect } from 'react';
import { isAuthenticated, getWordPressUser, logout as wpLogout, refreshTokenIfNeeded } from '@/lib/wordpressAuth';
import type { DesignStudioRole } from '@/lib/roleMapping';

interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  role: DesignStudioRole;
  wordpressRoles?: string[];
}

export function useWordPressAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial authentication check
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getWordPressUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    };

    checkAuth();
    setLoading(false);

    // Periodically check authentication and refresh token
    // Check every 5 minutes to ensure session stays alive
    const interval = setInterval(() => {
      console.log('[Auth] Periodic authentication check...');
      
      // Refresh token if needed
      refreshTokenIfNeeded().then(refreshed => {
        if (refreshed) {
          // Update user data after refresh
          const userData = getWordPressUser();
          setUser(userData);
        }
      });
      
      // Verify authentication status
      if (!isAuthenticated()) {
        console.warn('[Auth] Authentication check failed');
        setUser(null);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    wpLogout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout
  };
}
