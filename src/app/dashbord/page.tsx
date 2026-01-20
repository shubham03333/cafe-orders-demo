'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CafeOrderSystem from '@/components/CafeOrderSystem';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('userRole');
      
      if (isLoggedIn === 'true' && userRole === 'dashboard') {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login page
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ThemeProvider>
        <CafeOrderSystem />
      </ThemeProvider>
    </div>
  );
}
