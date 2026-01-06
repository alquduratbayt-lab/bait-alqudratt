'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // الصفحات العامة التي لا تحتاج تسجيل دخول
  const publicRoutes = [
    '/',
    '/privacy',
    '/terms',
    '/refund',
    '/admin-login'
  ];

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const checkAuth = () => {
      const admin = localStorage.getItem('admin');
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (!admin && !isPublicRoute) {
        // إذا لم يكن مسجل دخول ويحاول الوصول لصفحة محمية، حوله لصفحة تسجيل الدخول
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

  // إذا كانت صفحة عامة، اعرضها مباشرة بدون تحميل
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

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

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
