'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  type: 'student' | 'parent';
  push_token?: string;
}

interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  students: {
    total: number;
    read: number;
    unread: number;
  };
  parents: {
    total: number;
    read: number;
    unread: number;
  };
  timeframes: {
    today: number;
    week: number;
    month: number;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'students' | 'parents' | 'both'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchSentNotifications();
    fetchStats();

    // تحديث تلقائي للإحصائيات كل 30 ثانية
    const interval = setInterval(() => {
      fetchStats();
      fetchSentNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/notifications/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('حدث خطأ أثناء جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentNotifications = async () => {
    try {
      // جلب الإشعارات من جدولي student_notifications و parent_notifications
      const { data: studentNotifs, error: studentError } = await supabase
        .from('student_notifications')
        .select('*, users!student_notifications_student_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: parentNotifs, error: parentError } = await supabase
        .from('parent_notifications')
        .select('*, users!parent_notifications_parent_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (studentError) console.error('Student notifications error:', studentError);
      if (parentError) console.error('Parent notifications error:', parentError);

      // دمج الإشعارات وترتيبها
      const allNotifications = [
        ...(studentNotifs || []).map(n => ({ ...n, recipient_type: 'student' })),
        ...(parentNotifs || []).map(n => ({ ...n, recipient_type: 'parent' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 20);

      setSentNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getFilteredUsers = () => {
    // استبعاد admins من جميع الفئات
    const nonAdminUsers = users.filter(u => u.type !== 'admin');
    
    if (targetType === 'all') return nonAdminUsers;
    if (targetType === 'students') return nonAdminUsers.filter(u => u.type === 'student');
    if (targetType === 'parents') return nonAdminUsers.filter(u => u.type === 'parent');
    if (targetType === 'both') return nonAdminUsers.filter(u => u.type === 'student' || u.type === 'parent');
    return nonAdminUsers;
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert('الرجاء إدخال العنوان والرسالة');
      return;
    }

    try {
      setSending(true);
      
      const targetUsers = selectedUsers.length > 0 
        ? users.filter(u => selectedUsers.includes(u.id))
        : getFilteredUsers();

      if (targetUsers.length === 0) {
        alert('لا يوجد مستخدمين لإرسال الإشعار إليهم');
        return;
      }

      // تجهيز بيانات الإشعار
      const notificationData = {
        title,
        message,
        target_type: targetType,
        created_at: new Date().toISOString(),
      };

      // إرسال Push Notifications للمستخدمين الذين لديهم push_token
      console.log('📊 Target users:', targetUsers.length);
      console.log('👥 Users data:', targetUsers.map(u => ({ id: u.id, name: u.name, token: u.push_token })));
      
      const usersWithTokens = targetUsers.filter(u => u.push_token && u.push_token.trim() !== '');
      console.log('✅ Users with valid tokens:', usersWithTokens.length);
      
      let pushResult = { success: 0, failed: 0 };
      if (usersWithTokens.length > 0) {
        const tokens = usersWithTokens.map(u => u.push_token!);
        console.log('🔑 Tokens to send:', tokens);
        
        // استدعاء API Route لإرسال Push Notifications
        try {
          const apiResponse = await fetch('/api/send-push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tokens,
              title,
              body: message,
              data: {
                type: 'admin_notification',
                notification_id: notificationData.created_at,
              },
            }),
          });

          if (apiResponse.ok) {
            const result = await apiResponse.json();
            pushResult = { success: result.success || 0, failed: result.failed || 0 };
            console.log(`✅ Push notifications result: ${pushResult.success} success, ${pushResult.failed} failed`);
          } else {
            const errorText = await apiResponse.text();
            console.error('❌ API Error:', apiResponse.status, errorText);
            alert(`خطأ في إرسال الإشعار: ${errorText}`);
            pushResult = { success: 0, failed: tokens.length };
          }
        } catch (error: any) {
          console.error('❌ Failed to call push API:', error);
          alert(`خطأ في الاتصال بالـ API: ${error.message}`);
          pushResult = { success: 0, failed: tokens.length };
        }
      } else {
        console.warn('⚠️ No users with valid push tokens found!');
      }

      // حفظ الإشعارات في جدول student_notifications لكل مستخدم
      const studentNotifications = targetUsers
        .filter(u => u.type === 'student')
        .map(user => ({
          student_id: user.id,
          parent_id: null,
          type: 'general',
          title: title,
          message: message,
          is_read: false,
        }));

      if (studentNotifications.length > 0) {
        const { error: studentNotifError } = await supabase
          .from('student_notifications')
          .insert(studentNotifications);

        if (studentNotifError) {
          console.error('Error saving student notifications:', studentNotifError);
        } else {
          console.log(`✅ Saved ${studentNotifications.length} notifications to student_notifications table`);
        }
      }

      // حفظ الإشعارات في جدول parent_notifications لأولياء الأمور
      const parentNotifications = targetUsers
        .filter(u => u.type === 'parent')
        .map(user => ({
          parent_id: user.id,
          student_id: null,
          type: 'general',
          title: title,
          message: message,
          is_read: false,
        }));

      if (parentNotifications.length > 0) {
        const { error: parentNotifError } = await supabase
          .from('parent_notifications')
          .insert(parentNotifications);

        if (parentNotifError) {
          console.error('Error saving parent notifications:', parentNotifError);
        } else {
          console.log(`✅ Saved ${parentNotifications.length} notifications to parent_notifications table`);
        }
      }

      alert(`تم إرسال الإشعار بنجاح!\n- إلى ${targetUsers.length} مستخدم\n- Push Notifications: ${pushResult.success} نجح، ${pushResult.failed} فشل\n- محفوظ في التطبيق: ${studentNotifications.length + parentNotifications.length}`);
      
      // إعادة تعيين النموذج
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      fetchSentNotifications();
      fetchStats();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredUsers();
    setSelectedUsers(filtered.map(u => u.id));
  };

  const deselectAll = () => {
    setSelectedUsers([]);
  };

  const filteredUsers = getFilteredUsers();

  return (
    <DashboardLayout title="إدارة الإشعارات">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* عنوان وزر التحديث */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">إدارة الإشعارات</h1>
              <p className="text-sm text-gray-600 mt-1">إرسال ومتابعة الإشعارات للطلاب وأولياء الأمور</p>
            </div>
            <button
              onClick={() => {
                fetchStats();
                fetchSentNotifications();
              }}
              disabled={loadingStats}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 text-indigo-600 ${loadingStats ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium text-gray-700">تحديث</span>
            </button>
          </div>

          {/* إحصائيات الإشعارات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* إجمالي الإشعارات */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الإشعارات</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {loadingStats ? '...' : stats?.total || 0}
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-green-600 font-semibold">✓ {stats?.read || 0} مقروء</span>
                <span className="text-gray-400">•</span>
                <span className="text-orange-600 font-semibold">○ {stats?.unread || 0} غير مقروء</span>
              </div>
            </div>

            {/* إشعارات الطلاب */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إشعارات الطلاب</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {loadingStats ? '...' : stats?.students.total || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                {stats?.students.unread || 0} غير مقروء من {stats?.students.total || 0}
              </div>
            </div>

            {/* إشعارات أولياء الأمور */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إشعارات الأولياء</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loadingStats ? '...' : stats?.parents.total || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                {stats?.parents.unread || 0} غير مقروء من {stats?.parents.total || 0}
              </div>
            </div>

            {/* إشعارات اليوم */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إشعارات اليوم</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {loadingStats ? '...' : stats?.timeframes.today || 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                هذا الأسبوع: {stats?.timeframes.week || 0} • هذا الشهر: {stats?.timeframes.month || 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* نموذج إرسال الإشعار */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  إرسال إشعار جديد
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">عنوان الإشعار</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="مثال: تحديث جديد في المنصة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نص الرسالة</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="اكتب رسالة الإشعار هنا..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الفئة المستهدفة</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => setTargetType('all')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          targetType === 'all'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        الجميع
                      </button>
                      <button
                        onClick={() => setTargetType('students')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          targetType === 'students'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        الطلاب فقط
                      </button>
                      <button
                        onClick={() => setTargetType('parents')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          targetType === 'parents'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        أولياء الأمور
                      </button>
                      <button
                        onClick={() => setTargetType('both')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          targetType === 'both'
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        الطلاب والأولياء
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {selectedUsers.length > 0 ? (
                        <span className="font-semibold text-purple-600">
                          {selectedUsers.length} مستخدم محدد
                        </span>
                      ) : (
                        <span>
                          سيتم الإرسال إلى {filteredUsers.length} مستخدم
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleSendNotification}
                      disabled={sending || !title.trim() || !message.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          إرسال الإشعار
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* قائمة المستخدمين */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllFiltered}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      تحديد الكل
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    المستخدمين ({filteredUsers.length})
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">لا يوجد مستخدمين</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                          selectedUsers.includes(user.id)
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.name || user.username || 'مستخدم'}
                            </p>
                            <p className="text-sm text-gray-500">{user.email || user.phone}</p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.type === 'student'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {user.type === 'student' ? 'طالب' : 'ولي أمر'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* الإشعارات المرسلة */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  آخر الإشعارات المرسلة
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {sentNotifications.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">لا توجد إشعارات مرسلة</p>
                  ) : (
                    sentNotifications.map((notif, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-800 text-sm mb-1">{notif.title}</p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{notif.sent_count} مستخدم</span>
                          <span>{new Date(notif.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
