'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function SubscriptionNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkAndSendNotifications = async () => {
    try {
      setLoading(true);
      setResult(null);

      const today = new Date();

      // جلب المشتركين النشطين
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, subscription_end, push_token')
        .eq('subscription_status', 'active')
        .not('subscription_end', 'is', null);

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        setResult({ success: true, message: 'لا يوجد مشتركين نشطين', notificationsSent: 0 });
        return;
      }

      let notificationsSent = 0;
      const notifications: any[] = [];

      for (const user of users) {
        const endDate = new Date(user.subscription_end);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let shouldNotify = false;
        let title = '';
        let message = '';

        if (diffDays === 1) {
          shouldNotify = true;
          title = '⚠️ تنبيه: اشتراكك ينتهي غداً';
          message = 'اشتراكك سينتهي غداً. جدد اشتراكك الآن';
        } else if (diffDays === 3) {
          shouldNotify = true;
          title = '⏰ تذكير: اشتراكك ينتهي خلال 3 أيام';
          message = 'اشتراكك سينتهي خلال 3 أيام';
        } else if (diffDays === 7) {
          shouldNotify = true;
          title = '📅 تذكير: اشتراكك ينتهي خلال أسبوع';
          message = 'اشتراكك سينتهي خلال أسبوع';
        } else if (diffDays <= 0) {
          shouldNotify = true;
          title = '❌ انتهى اشتراكك';
          message = 'انتهى اشتراكك. جدد الآن';
        }

        if (shouldNotify) {
          // حفظ الإشعار
          const { error: notifError } = await supabase
            .from('student_notifications')
            .insert({
              student_id: user.id,
              type: 'subscription_expiring',
              title,
              message,
              is_read: false
            });

          if (!notifError) {
            // إرسال Push Notification
            if (user.push_token && user.push_token.startsWith('ExponentPushToken')) {
              try {
                await fetch('/api/send-push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tokens: [user.push_token],
                    title,
                    body: message,
                    data: { type: 'subscription_expiring', daysRemaining: diffDays }
                  })
                });
              } catch (error) {
                console.error('Error sending push:', error);
              }
            }

            notificationsSent++;
            notifications.push({ name: user.name, daysRemaining: diffDays, title });
          }
        }
      }

      setResult({
        success: true,
        notificationsSent,
        totalUsers: users.length,
        notifications
      });

    } catch (error) {
      console.error('Error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="إشعارات الاشتراكات">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إشعارات انتهاء الاشتراكات</h1>
            <p className="text-gray-600 mb-8">فحص وإرسال إشعارات للمشتركين الذين على وشك انتهاء اشتراكهم</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📋 متى يتم إرسال الإشعارات؟</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• قبل انتهاء الاشتراك بـ 7 أيام</li>
                <li>• قبل انتهاء الاشتراك بـ 3 أيام</li>
                <li>• قبل انتهاء الاشتراك بيوم واحد</li>
                <li>• عند انتهاء الاشتراك (اليوم)</li>
              </ul>
            </div>

            <button
              onClick={checkAndSendNotifications}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الفحص والإرسال...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  فحص وإرسال الإشعارات
                </>
              )}
            </button>

            {result && (
              <div className={`mt-6 p-6 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-bold text-lg mb-3 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? '✅ تم بنجاح' : '❌ حدث خطأ'}
                </h3>
                
                {result.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">إجمالي المشتركين</p>
                        <p className="text-2xl font-bold text-gray-900">{result.totalUsers}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600">الإشعارات المرسلة</p>
                        <p className="text-2xl font-bold text-green-600">{result.notificationsSent}</p>
                      </div>
                    </div>

                    {result.notifications && result.notifications.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الإشعارات المرسلة:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {result.notifications.map((notif: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{notif.name}</p>
                                <p className="text-sm text-gray-600">{notif.title}</p>
                              </div>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {notif.daysRemaining} يوم
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">{result.error || result.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
