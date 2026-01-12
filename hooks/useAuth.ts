'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getWordPressUser, logout as wpLogout } from '@/lib/wordpressAuth';
import type { DesignStudioRole } from '@/lib/roleMapping';

export interface User {
  id: number | string;
  name: string;
  email: string;
  username: string;
  role: DesignStudioRole;
  wordpressRoles?: string[];
  loginMethod?: string;
  googleLinked?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    if (typeof window !== 'undefined' && isAuthenticated()) {
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
    logout,
    isAuthenticated: !!user,
  };
}
