'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adminName, setAdminName] = useState<string>('مشرف');
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    system: false,
    content: true,
    users: false,
    rewards: false,
    subscriptions: false,
    support: false,
    settings: false
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch('/api/admin/session');
        const data = await response.json();
        
        if (data.success && data.admin) {
          setAdminName(data.admin.name);
          setPermissions(data.permissions || []);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
  }, [router]);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    return perms.some(p => permissions.includes(p));
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {adminName.charAt(0)}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">{adminName}</div>
                <button onClick={handleLogout} className="text-xs text-red-600 hover:text-red-700">تسجيل خروج</button>
              </div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">الصفحة الرئيسية</button>
            <span className="text-blue-600 font-bold text-lg">قدراتي</span>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-l border-gray-200 min-h-screen transition-all duration-300 overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {hasAnyPermission(['manage_admins', 'manage_roles', 'view_activity_logs']) && (
              <div>
                <button onClick={() => toggleMenu('system')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>إدارة النظام</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.system ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.system && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_admins') && <button onClick={() => router.push('/admins')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg><span>المشرفين</span></button>}
                    {hasPermission('manage_roles') && <button onClick={() => router.push('/roles')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg><span>الأدوار والصلاحيات</span></button>}
                    {hasPermission('view_activity_logs') && <button onClick={() => router.push('/activity-logs')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg><span>سجل النشاطات</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['manage_subjects', 'manage_onboarding', 'manage_banners', 'manage_calm_moments']) && (
              <div>
                <button onClick={() => toggleMenu('content')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>إدارة المحتوى</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.content ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.content && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_subjects') && <button onClick={() => router.push('/subjects')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span>المواد الدراسية</span></button>}
                    {hasPermission('manage_onboarding') && <button onClick={() => router.push('/onboarding-screens')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span>شاشات الترحيب</span></button>}
                    {hasPermission('manage_banners') && <button onClick={() => router.push('/banners')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>البانرات الإعلانية</span></button>}
                    {hasPermission('manage_calm_moments') && <button onClick={() => router.push('/calm-moments')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg><span>لحظات الهدوء</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['manage_users', 'send_notifications']) && (
              <div>
                <button onClick={() => toggleMenu('users')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>المستخدمين</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.users ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.users && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_users') && <button onClick={() => router.push('/users')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span>إدارة المستخدمين</span></button>}
                    {hasPermission('send_notifications') && <button onClick={() => router.push('/notifications')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><span>الإشعارات</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['manage_points', 'manage_rewards', 'approve_rewards']) && (
              <div>
                <button onClick={() => toggleMenu('rewards')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>النقاط والجوائز</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.rewards ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.rewards && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_points') && <button onClick={() => router.push('/points-settings')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg><span>إعدادات النقاط</span></button>}
                    {hasPermission('manage_rewards') && <button onClick={() => router.push('/rewards')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg><span>إدارة الجوائز</span></button>}
                    {hasPermission('approve_rewards') && <button onClick={() => router.push('/reward-requests')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg><span>طلبات الجوائز</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['manage_subscriptions', 'view_payments', 'view_reports']) && (
              <div>
                <button onClick={() => toggleMenu('subscriptions')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>الاشتراكات</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.subscriptions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.subscriptions && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_subscriptions') && <button onClick={() => router.push('/subscriptions')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg><span>إدارة الاشتراكات</span></button>}
                    {hasPermission('view_payments') && <button onClick={() => router.push('/payments')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg><span>المدفوعات</span></button>}
                    {hasPermission('view_reports') && <button onClick={() => router.push('/subscription-reports')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><span>تقارير الاشتراكات</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['view_tickets', 'manage_tickets']) && (
              <div>
                <button onClick={() => toggleMenu('support')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>الدعم الفني</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.support ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.support && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasAnyPermission(['view_tickets', 'manage_tickets']) && <button onClick={() => router.push('/tickets')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg><span>التذاكر</span></button>}
                  </div>
                )}
              </div>
            )}
            {hasAnyPermission(['manage_app_settings', 'manage_training_settings', 'manage_landing_page']) && (
              <div>
                <button onClick={() => toggleMenu('settings')} className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold hover:bg-gray-50 rounded-lg transition text-right">
                  <span>الإعدادات</span>
                  <svg className={`w-4 h-4 transition-transform ${openMenus.settings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openMenus.settings && (
                  <div className="mr-4 mt-1 space-y-1">
                    {hasPermission('manage_app_settings') && <button onClick={() => router.push('/app-settings')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span>إعدادات التطبيق</span></button>}
                    {hasPermission('manage_training_settings') && <button onClick={() => router.push('/training-settings')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg><span>إعدادات التدريب</span></button>}
                    <button onClick={() => router.push('/landing-page')} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition text-right"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>محتوى الصفحة الرئيسية</span></button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}