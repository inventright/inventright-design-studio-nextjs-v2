'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for user data (from WordPress auth)
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
}
