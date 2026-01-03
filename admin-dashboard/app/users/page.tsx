'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface User {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  parent_id: string | null;
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_tier: string;
  subscription_end: string | null;
  created_at: string;
  is_blocked?: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [subscriptionData, setSubscriptionData] = useState({
    tier: 'basic',
    end_date: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'parent'>('all');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalParents: 0,
    activePercentage: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      
      // حساب الإحصائيات الحقيقية
      if (data) {
        const totalUsers = data.length;
        const totalStudents = data.filter(u => u.type === 'student').length;
        const totalParents = data.filter(u => u.type === 'parent').length;
        
        // حساب المستخدمين النشطين (الذين لديهم اشتراك نشط)
        const activeUsers = data.filter(u => {
          if (!u.subscription_end) return false;
          const endDate = new Date(u.subscription_end);
          return endDate > new Date() && u.subscription_status === 'active';
        }).length;
        
        const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
        
        setStats({
          totalUsers,
          totalStudents,
          totalParents,
          activePercentage
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (user: User) => {
    setSelectedUser(user);
    setSubscriptionData({
      tier: user.subscription_tier || 'basic',
      end_date: user.subscription_end ? new Date(user.subscription_end).toISOString().slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleShowUserDetails = (user: User) => {
    setUserDetails(user);
    setNewPassword('');
    setShowUserDetailsModal(true);
  };

  const handleChangePassword = async () => {
    if (!userDetails || !newPassword) {
      alert('الرجاء إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!confirm(`هل أنت متأكد من تغيير كلمة المرور للمستخدم "${userDetails.name}"؟`)) {
      return;
    }

    try {
      setChangingPassword(true);

      // استدعاء Edge Function لتغيير كلمة المرور
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: { 
          userId: userDetails.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      if (data.success) {
        alert('تم تغيير كلمة المرور بنجاح');
        setNewPassword('');
        setShowUserDetailsModal(false);
      } else {
        throw new Error(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert('حدث خطأ أثناء تغيير كلمة المرور: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\n\nتحذير: هذا الإجراء لا يمكن التراجع عنه!\n\nسيتم حذف المستخدم من قاعدة البيانات ومن نظام المصادقة.`)) {
      return;
    }

    try {
      setLoading(true);

      // استدعاء Edge Function لحذف المستخدم من Auth وقاعدة البيانات
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      if (data.success) {
        alert('تم حذف المستخدم بنجاح من قاعدة البيانات ونظام المصادقة');
        fetchUsers();
      } else {
        throw new Error(data.error || 'فشل حذف المستخدم');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('حدث خطأ أثناء حذف المستخدم: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlockUser = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'إلغاء حظر' : 'حظر';
    if (!confirm(`هل أنت متأكد من ${action} المستخدم "${userName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      alert(`تم ${action} المستخدم بنجاح`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling block status:', error);
      alert(`حدث خطأ أثناء ${action} المستخدم`);
    }
  };

  const handleSaveSubscription = async () => {
    if (!selectedUser || !subscriptionData.end_date) {
      alert('الرجاء تحديد تاريخ الانتهاء');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: subscriptionData.tier,
          subscription_status: 'active',
          subscription_end: subscriptionData.end_date,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      alert('تم تحديث الاشتراك بنجاح!');
      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTierLabel = (tier: string) => {
    const labels: { [key: string]: string } = { free: 'مجاني', basic: 'أساسي', premium: 'مميز' };
    return labels[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || user.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout title="إدارة المستخدمين">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">إدارة المستخدمين</h1>
            <p className="text-gray-600">عرض وإدارة جميع المستخدمين في النظام</p>
          </div>

          {/* البطاقات العلوية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">إجمالي المستخدمين</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">عدد الطلاب</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>{stats.totalStudents.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">عدد أولياء الأمور</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>{stats.totalParents.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">معدل المستخدمين النشطين</h3>
              <p className="text-4xl font-bold">{stats.activePercentage}%</p>
            </div>
          </div>

          {/* جدول المستخدمين */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..."
                  className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold"
                />
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${filterType === 'all' ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setFilterType('student')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${filterType === 'student' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  طالب
                </button>
                <button 
                  onClick={() => setFilterType('parent')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${filterType === 'parent' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  ولي الأمر
                </button>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">إدارة المستخدمين</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الإجراءات</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">تاريخ الانتهاء</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الباقة</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">رقم الهاتف</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">النوع</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الاسم</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={`border-b border-gray-100 hover:bg-gray-50 ${user.is_blocked ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            onClick={() => handleShowUserDetails(user)}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-all"
                          >
                            عرض التفاصيل
                          </button>
                          {user.type === 'student' && (
                            <button 
                              onClick={() => handleEditSubscription(user)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                            >
                              تعديل الاشتراك
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleBlockUser(user.id, user.name, user.is_blocked || false)}
                            className={`px-3 py-1 text-white rounded-lg text-sm transition-all ${user.is_blocked ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                          >
                            {user.is_blocked ? 'إلغاء الحظر' : 'حظر'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.subscription_status === 'active' || user.subscription_status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.subscription_status === 'active' || user.subscription_status === 'نشط' ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(user.subscription_tier || 'free')}`}>
                          {getTierLabel(user.subscription_tier || 'free')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{user.phone}</td>
                      <td className="py-3 px-4 text-gray-700">{user.type === 'student' ? 'طالب' : 'ولي أمر'}</td>
                      <td className="py-3 px-4 text-gray-700">{user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>لا توجد نتائج</p>
              </div>
            )}
          </div>

          {/* Modal عرض تفاصيل المستخدم */}
          {showUserDetailsModal && userDetails && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserDetailsModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">تفاصيل المستخدم</h2>
                      <p className="text-sm opacity-90 mt-1">{userDetails.name}</p>
                    </div>
                    <button
                      onClick={() => setShowUserDetailsModal(false)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">الاسم</div>
                      <div className="font-semibold text-gray-800">{userDetails.name}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">النوع</div>
                      <div className="font-semibold text-gray-800">{userDetails.type === 'student' ? 'طالب' : 'ولي أمر'}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">رقم الهاتف</div>
                      <div className="font-semibold text-gray-800 font-mono">{userDetails.phone}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">البريد الإلكتروني</div>
                      <div className="font-semibold text-gray-800">{userDetails.email || 'غير محدد'}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">الباقة</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(userDetails.subscription_tier || 'free')}`}>
                          {getTierLabel(userDetails.subscription_tier || 'free')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">حالة الاشتراك</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userDetails.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {userDetails.subscription_status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</div>
                      <div className="font-semibold text-gray-800">
                        {userDetails.subscription_end ? new Date(userDetails.subscription_end).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">حالة الحظر</div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userDetails.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {userDetails.is_blocked ? '🚫 محظور' : '✓ غير محظور'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                      <div className="text-xs text-gray-500 mb-1">تاريخ التسجيل</div>
                      <div className="font-semibold text-gray-800">
                        {new Date(userDetails.created_at).toLocaleString('ar-SA')}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                      <div className="text-xs text-gray-500 mb-1">معرف المستخدم (ID)</div>
                      <div className="font-semibold text-gray-800 font-mono text-xs break-all">{userDetails.id}</div>
                    </div>

                    {/* تغيير كلمة المرور */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 col-span-2 border-2 border-orange-200">
                      <div className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        تغيير كلمة المرور
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                          className="flex-1 px-4 py-2 border border-orange-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled={changingPassword}
                        />
                        <button
                          onClick={handleChangePassword}
                          disabled={changingPassword || !newPassword}
                          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {changingPassword ? 'جاري التغيير...' : 'تغيير'}
                        </button>
                      </div>
                      <p className="text-xs text-orange-600 mt-2">⚠️ سيتم تغيير كلمة المرور فوراً ولن يتمكن المستخدم من تسجيل الدخول بكلمة المرور القديمة</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowUserDetailsModal(false)}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal تعديل الاشتراك */}
          {showModal && selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/20 animate-slideUp">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 text-right">
                  تعديل اشتراك: {selectedUser.name}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                      نوع الباقة
                    </label>
                    <select
                      value={subscriptionData.tier}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, tier: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    >
                      <option value="free">مجاني</option>
                      <option value="basic">أساسي</option>
                      <option value="premium">مميز</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                      تاريخ الانتهاء
                    </label>
                    <input
                      type="date"
                      value={subscriptionData.end_date}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-3 text-right text-base">مميزات الباقة:</h3>
                    <ul className="text-sm font-medium text-blue-800 space-y-2 text-right">
                      {subscriptionData.tier === 'free' && (
                        <>
                          <li>• درس واحد مجاني فقط</li>
                          <li>• لا يمكن الوصول للمعلم الذكي</li>
                        </>
                      )}
                      {subscriptionData.tier === 'basic' && (
                        <>
                          <li>• جميع الدروس المسجلة</li>
                          <li>• الوصول للمعلم الذكي ✓</li>
                        </>
                      )}
                      {subscriptionData.tier === 'premium' && (
                        <>
                          <li>• جميع الدروس المسجلة</li>
                          <li>• الوصول للمعلم الذكي ✓</li>
                          <li>• الوصول للتدريب المباشر ✓</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold transition-all transform hover:scale-105 shadow-md"
                    disabled={loading}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveSubscription}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold transition-all transform hover:scale-105 shadow-lg"
                    disabled={loading}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
