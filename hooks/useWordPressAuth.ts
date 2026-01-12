import { useState, useEffect } from 'react';
import { isAuthenticated, getWordPressUser, logout as wpLogout } from '../utils/wordpressAuth';
import type { DesignStudioRole } from '../utils/roleMapping';

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
    // Check authentication status
    if (isAuthenticated()) {
      const userData = getWordPressUser();
      setUser(userData);
    }
    setLoading(false);
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
