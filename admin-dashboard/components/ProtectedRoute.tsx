'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const checkAuth = () => {
      const admin = localStorage.getItem('admin');
      
      if (!admin && pathname !== '/admin-login') {
        // إذا لم يكن مسجل دخول، حوله لصفحة تسجيل الدخول
        router.push('/admin-login');
      } else if (admin && pathname === '/admin-login') {
        // إذا مسجل دخول ويحاول الوصول لصفحة تسجيل الدخول، حوله للداشبورد
        router.push('/dashboard');
      } else {
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/admin-login') {
    return null;
  }

  return <>{children}</>;
}
