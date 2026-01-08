'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [unlockAllLessons, setUnlockAllLessons] = useState(false);
  const [loading, setLoading] = useState(true);

  // بيانات تجريبية
  const user = {
    id: params.id,
    name: 'محمد احمد',
    phone: '+965 90 123 4567',
    email: 'Mohdabdoong.business@gmail.com',
    parentEmail: 'غير مفعل',
    subscriptionType: 'الشهرية',
    subscriptionStatus: 'نشط',
    startDate: '01/3/2025',
    endDate: '30/3/2025',
    image: 'https://via.placeholder.com/150',
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [params.id]);

  const fetchUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('unlock_all_lessons')
        .eq('id', params.id)
        .single();

      if (!error && data) {
        setUnlockAllLessons(data.unlock_all_lessons || false);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnlock = async () => {
    const newValue = !unlockAllLessons;
    
    const { error } = await supabase
      .from('users')
      .update({ unlock_all_lessons: newValue })
      .eq('id', params.id);
      
    if (!error) {
      setUnlockAllLessons(newValue);
      alert(newValue ? 'تم فتح جميع الدروس للطالب' : 'تم إغلاق صلاحية فتح الدروس');
    } else {
      alert('حدث خطأ أثناء تحديث الصلاحية');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الهيدر */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-800">ادارة المستخدمين</h1>

          <div className="flex items-center gap-4">
            <span className="text-blue-600 font-bold text-lg">قدراتي</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* القائمة الجانبية */}
        <aside className="w-64 bg-white border-l border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>الصفحة الرئيسية</span>
            </button>
            <button
              onClick={() => router.push('/users')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg text-right"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>ادارة المستخدمين</span>
            </button>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>الفريق</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>التقارير و الملاحظة</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>المواد الدراسية</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>الامتحانات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>الاشتراكات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>النشاط والمحتويات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>طلبات الانضمام</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>الاشعارات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>الدعم الفني</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>الاعلانات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition text-right">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>تحديثات</span>
            </a>
          </nav>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-right">تفاصيل الطالب</h2>

            {/* صورة المستخدم */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center mb-8">{user.name}</h3>

            {/* تفاصيل المستخدم */}
            <div className="space-y-6">
              {/* الاسم الأول ورقم الهاتف */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">الاسم الأول</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">محمد</div>
                </div>
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">رقم الهاتف</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.phone}</div>
                </div>
              </div>

              {/* البريد الإلكتروني وولي الأمر */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">البريد الالكتروني</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.email}</div>
                </div>
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">ولي الامر</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.parentEmail}</div>
                </div>
              </div>

              {/* نوع الاشتراك وحالة الاشتراك */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">نوع الاشتراك</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.subscriptionType}</div>
                </div>
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">حالة الاشتراك</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-green-600 font-semibold">{user.subscriptionStatus}</div>
                </div>
              </div>

              {/* تاريخ بداية ونهاية الاشتراك */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">تاريخ بداية الاشتراك</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.startDate}</div>
                </div>
                <div className="text-right">
                  <label className="block text-sm text-gray-600 mb-2">تاريخ نهاية الاشتراك</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{user.endDate}</div>
                </div>
              </div>
            </div>

            {/* زر فتح/إغلاق جميع الدروس */}
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={handleToggleUnlock}
                disabled={loading}
                className={`px-8 py-3 rounded-lg transition font-semibold shadow-md ${
                  unlockAllLessons 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {unlockAllLessons ? '🔓 إغلاق جميع الدروس' : '🔒 فتح جميع الدروس'}
              </button>
              
              <button className="px-8 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition font-semibold">
                حذف الحساب
              </button>
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيل الخروج
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
