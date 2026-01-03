'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adminName, setAdminName] = useState('');
  const [canViewStats, setCanViewStats] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalLessons: 0,
    totalQuestions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    monthlyRevenue: 0,
    totalPoints: 0,
    pendingRewards: 0,
    completedLessonsToday: 0,
    studentsCount: 0,
    parentsCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([]);
  const [pendingRewardRequests, setPendingRewardRequests] = useState<any[]>([]);
  const [subscriptionChart, setSubscriptionChart] = useState<any[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState({
    monthly: 0,
    yearly: 0,
    trial: 0,
  });
  const [alerts, setAlerts] = useState({
    newRewardRequests: 0,
    expiringSubscriptions: 0,
    newTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const response = await fetch('/api/admin/session');
      const data = await response.json();
      
      if (data.success && data.admin) {
        setAdminName(data.admin.name);
        setPermissions(data.permissions || []);
        
        // التحقق من الصلاحيات - فقط المدير العام والمدير المالي يمكنهم رؤية الإحصائيات
        const hasFinancePermissions = data.permissions?.some((p: string) => 
          ['view_payments', 'manage_subscriptions', 'view_reports', 'manage_payments'].includes(p)
        );
        
        setCanViewStats(hasFinancePermissions || data.permissions?.length > 15); // Super admin has all permissions
        
        if (hasFinancePermissions || data.permissions?.length > 15) {
          fetchDashboardData();
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // جلب عدد المستخدمين
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // جلب عدد الطلاب
      const { count: studentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'student');
      
      // جلب عدد أولياء الأمور
      const { count: parentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'parent');
      
      // جلب عدد المواد
      const { count: subjectsCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });
      
      // جلب عدد الدروس
      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      
      // جلب عدد الأسئلة
      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      
      // جلب الاشتراكات النشطة
      const { count: activeSubsCount, error: activeSubsError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      console.log('Active Subscriptions Count:', activeSubsCount);
      console.log('Active Subscriptions Error:', activeSubsError);
      
      // جلب جميع الاشتراكات للتحقق
      const { count: allSubsCount, data: allSubsData } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact' });
      
      console.log('All Subscriptions Count:', allSubsCount);
      console.log('All Subscriptions Data:', allSubsData);
      
      // جلب الاشتراكات المنتهية
      const { count: expiredSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.expired,status.eq.cancelled');
      
      // جلب إجمالي الإيرادات الشهرية
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startOfMonth)
        .eq('status', 'completed');
      
      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      
      // جلب إجمالي النقاط
      const { data: pointsData } = await supabase
        .from('points_transactions')
        .select('points');
      
      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
      
      // جلب طلبات الجوائز المعلقة
      const { count: pendingRewardsCount } = await supabase
        .from('reward_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // جلب الدروس المكتملة اليوم
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count: completedTodayCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('updated_at', startOfDay.toISOString());
      
      // جلب آخر المستخدمين
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('Recent Users Data:', users);
      console.log('User Types:', users?.map(u => ({ name: u.full_name || u.username, type: u.type })));
      
      // جلب آخر الاشتراكات
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, users(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // جلب طلبات الجوائز المعلقة
      const { data: rewardRequests } = await supabase
        .from('reward_requests')
        .select('*, users(full_name, username), rewards(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // جلب بيانات الرسم البياني للاشتراكات (آخر 7 أيام)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        last7Days.push({
          day: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
          count: count || 0
        });
      }
      
      // جلب توزيع الاشتراكات
      const { count: monthlyCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('tier', 'monthly')
        .eq('status', 'active');
      
      const { count: yearlyCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('tier', 'yearly')
        .eq('status', 'active');
      
      const { count: trialCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('tier', 'trial')
        .eq('status', 'active');
      
      const totalActiveSubs = (monthlyCount || 0) + (yearlyCount || 0) + (trialCount || 0);
      
      // جلب التنبيهات
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const { count: expiringCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('end_date', sevenDaysFromNow.toISOString())
        .gte('end_date', new Date().toISOString());
      
      const { count: newTicketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      setStats({
        totalUsers: usersCount || 0,
        totalSubjects: subjectsCount || 0,
        totalLessons: lessonsCount || 0,
        totalQuestions: questionsCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        expiredSubscriptions: expiredSubsCount || 0,
        monthlyRevenue: monthlyRevenue,
        totalPoints: totalPoints,
        pendingRewards: pendingRewardsCount || 0,
        completedLessonsToday: completedTodayCount || 0,
        studentsCount: studentsCount || 0,
        parentsCount: parentsCount || 0,
      });
      
      setRecentUsers(users || []);
      setRecentSubscriptions(subscriptions || []);
      setPendingRewardRequests(rewardRequests || []);
      setSubscriptionChart(last7Days);
      setSubscriptionDistribution({
        monthly: totalActiveSubs > 0 ? Math.round((monthlyCount || 0) / totalActiveSubs * 100) : 0,
        yearly: totalActiveSubs > 0 ? Math.round((yearlyCount || 0) / totalActiveSubs * 100) : 0,
        trial: totalActiveSubs > 0 ? Math.round((trialCount || 0) / totalActiveSubs * 100) : 0,
      });
      setAlerts({
        newRewardRequests: pendingRewardsCount || 0,
        expiringSubscriptions: expiringCount || 0,
        newTickets: newTicketsCount || 0,
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const maxChartValue = Math.max(...subscriptionChart.map(d => d.count), 1);

  return (
    <DashboardLayout title="الصفحة الرئيسية">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* رسالة ترحيب للموظفين بدون صلاحيات الإحصائيات */}
          {!canViewStats && !loading && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-200 text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
                  {adminName.charAt(0)}
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">مرحباً {adminName}! 👋</h1>
                <p className="text-lg text-gray-600 mb-6">
                  أهلاً بك في لوحة التحكم الخاصة بك
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-gray-700">
                    يمكنك الوصول إلى الأقسام المخصصة لك من القائمة الجانبية
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-sm text-gray-500">ابدأ العمل من القائمة الجانبية</p>
                </div>
              </div>
            </div>
          )}

          {/* الإحصائيات - فقط للمدير العام والمدير المالي */}
          {canViewStats && (
            <>
              {/* التنبيهات */}
              {(alerts.newRewardRequests > 0 || alerts.expiringSubscriptions > 0 || alerts.newTickets > 0) && (
            <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-yellow-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                تنبيهات مهمة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alerts.newRewardRequests > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">طلبات جوائز جديدة</p>
                    <p className="text-2xl font-bold text-yellow-700">{alerts.newRewardRequests}</p>
                  </div>
                )}
                {alerts.expiringSubscriptions > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">اشتراكات قريبة من الانتهاء</p>
                    <p className="text-2xl font-bold text-orange-700">{alerts.expiringSubscriptions}</p>
                  </div>
                )}
                {alerts.newTickets > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">تذاكر دعم فني جديدة</p>
                    <p className="text-2xl font-bold text-red-700">{alerts.newTickets}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">المستخدمين</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-2">طلاب: {stats.studentsCount} | أولياء: {stats.parentsCount}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">الاشتراكات النشطة</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.activeSubscriptions}</p>
              <p className="text-xs opacity-75 mt-2">منتهية: {stats.expiredSubscriptions}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">الإيرادات الشهرية</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-2">ريال سعودي</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">طلبات الجوائز</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.pendingRewards}</p>
              <p className="text-xs opacity-75 mt-2">معلقة</p>
            </div>
          </div>

          {/* إحصائيات إضافية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">المواد الدراسية</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.totalSubjects}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">الدروس</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.totalLessons.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">الأسئلة</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.totalQuestions.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-10 h-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm opacity-90 mb-2">دروس مكتملة اليوم</h3>
              <p className="text-4xl font-bold">{loading ? '...' : stats.completedLessonsToday}</p>
            </div>
          </div>

          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* رسم الاشتراكات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">الاشتراكات الجديدة</h2>
                <p className="text-sm text-gray-500">آخر 7 أيام</p>
              </div>
              <div className="h-48 flex items-end justify-between gap-2">
                {subscriptionChart.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-400" 
                      style={{ height: `${(data.count / maxChartValue) * 100}%`, minHeight: data.count > 0 ? '20px' : '0' }}
                      title={`${data.count} اشتراك`}
                    >
                      {data.count > 0 && (
                        <div className="text-xs text-white font-bold text-center pt-1">{data.count}</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* توزيع الاشتراكات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-2">توزيع الاشتراكات</h2>
              <p className="text-sm text-gray-500 mb-6">حسب نوع الاشتراك</p>
              <div className="flex items-center justify-center gap-8">
                {stats.activeSubscriptions > 0 ? (
                  <>
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {subscriptionDistribution.monthly > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="20" 
                            strokeDasharray={`${(subscriptionDistribution.monthly / 100) * 251.2} 251.2`} 
                          />
                        )}
                        {subscriptionDistribution.yearly > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke="#93c5fd" 
                            strokeWidth="20" 
                            strokeDasharray={`${(subscriptionDistribution.yearly / 100) * 251.2} 251.2`} 
                            strokeDashoffset={`-${(subscriptionDistribution.monthly / 100) * 251.2}`}
                          />
                        )}
                        {subscriptionDistribution.trial > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke="#dbeafe" 
                            strokeWidth="20" 
                            strokeDasharray={`${(subscriptionDistribution.trial / 100) * 251.2} 251.2`} 
                            strokeDashoffset={`-${((subscriptionDistribution.monthly + subscriptionDistribution.yearly) / 100) * 251.2}`}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{stats.activeSubscriptions}</p>
                          <p className="text-xs text-gray-500">نشطة</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-700 font-medium">شهرية {subscriptionDistribution.monthly}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                        <span className="text-sm text-gray-700 font-medium">سنوية {subscriptionDistribution.yearly}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                        <span className="text-sm text-gray-700 font-medium">تجريبية {subscriptionDistribution.trial}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">لا توجد اشتراكات نشطة</div>
                )}
              </div>
            </div>
          </div>

          {/* الجداول */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* آخر الاشتراكات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">آخر الاشتراكات</h2>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                ) : recentSubscriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد اشتراكات</div>
                ) : (
                  recentSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="font-semibold text-gray-800">{sub.users?.full_name || sub.users?.username || 'مستخدم'}</p>
                        <p className="text-sm text-gray-500">{sub.tier === 'monthly' ? 'شهري' : sub.tier === 'yearly' ? 'سنوي' : 'تجريبي'}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-600">{sub.amount || 0} ريال</p>
                        <p className="text-xs text-gray-500">{new Date(sub.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* طلبات الجوائز المعلقة */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">طلبات الجوائز المعلقة</h2>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                ) : pendingRewardRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد طلبات معلقة</div>
                ) : (
                  pendingRewardRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                      <div>
                        <p className="font-semibold text-gray-800">{req.users?.full_name || req.users?.username || 'مستخدم'}</p>
                        <p className="text-sm text-gray-600">{req.rewards?.name || 'جائزة'}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-yellow-700">{req.points_spent || 0} نقطة</p>
                        <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* آخر المستخدمين */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">آخر المستخدمين المسجلين</h2>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
              ) : recentUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">تاريخ التسجيل</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">النوع</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">البريد الإلكتروني</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">رقم الهاتف</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الاسم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user, index) => (
                      <tr key={user.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {new Date(user.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {user.type === 'student' ? 'طالب' : 'ولي أمر'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{user.email || '-'}</td>
                        <td className="py-3 px-4 text-gray-700">{user.phone || '-'}</td>
                        <td className="py-3 px-4 text-gray-700 font-semibold">{user.full_name || user.username || 'مستخدم'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيل الخروج
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
