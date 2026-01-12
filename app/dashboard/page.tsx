'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWordPressAuth } from '@/hooks/useWordPressAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useWordPressAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login');
      } else {
        // Redirect based on user role
        const role = user.role || 'client';
        router.push(`/dashboard/${role}`);
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
