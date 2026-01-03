'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface SubscriptionReport {
  user_id: string;
  user_name: string;
  user_phone: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_end: string;
  plan_name: string;
  plan_price: number;
  payments: Payment[];
  days_remaining: number;
  last_reminder_sent: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  card_brand: string;
  card_last_four: string;
  created_at: string;
}

export default function SubscriptionReportsPage() {
  const [reports, setReports] = useState<SubscriptionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    basicCount: 0,
    premiumCount: 0,
    totalRevenue: 0,
    expiringCount: 0,
  });
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedUserPayments, setSelectedUserPayments] = useState<{ userName: string; payments: Payment[] } | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // جلب المستخدمين المشتركين مع بيانات الباقة
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          phone,
          subscription_tier,
          subscription_status,
          subscription_end,
          last_reminder_sent
        `)
        .neq('subscription_tier', 'free')
        .not('subscription_end', 'is', null);

      if (usersError) throw usersError;

      // جلب جميع المدفوعات
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // جلب خطط الاشتراك
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (plansError) throw plansError;

      // دمج البيانات
      const reportsData: SubscriptionReport[] = (users || []).map(user => {
        const userPayments = (payments || []).filter(p => p.user_id === user.id);
        const lastPayment = userPayments[0];
        const plan = plans?.find(p => p.id === lastPayment?.plan_id);

        const endDate = new Date(user.subscription_end);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          user_id: user.id,
          user_name: user.name,
          user_phone: user.phone,
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
          subscription_end: user.subscription_end,
          plan_name: plan?.name || 'غير محدد',
          plan_price: plan?.price || 0,
          payments: userPayments,
          days_remaining: daysRemaining,
          last_reminder_sent: user.last_reminder_sent,
        };
      });

      setReports(reportsData);

      // حساب الإحصائيات
      const totalSubscribers = reportsData.length;
      const basicCount = reportsData.filter(r => r.subscription_tier === 'basic').length;
      const premiumCount = reportsData.filter(r => r.subscription_tier === 'premium').length;
      const totalRevenue = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const expiringCount = reportsData.filter(r => r.days_remaining <= 3 && r.days_remaining >= 0).length;

      setStats({
        totalSubscribers,
        basicCount,
        premiumCount,
        totalRevenue,
        expiringCount,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('حدث خطأ في جلب التقارير');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (userId: string, userName: string) => {
    try {
      setSendingReminder(userId);

      const { error } = await supabase.functions.invoke('send-subscription-reminder', {
        body: { userId }
      });

      if (error) throw error;

      alert(`تم إرسال تذكير إلى ${userName} بنجاح`);
      
      // إعادة جلب البيانات لتحديث last_reminder_sent
      fetchReports();
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('حدث خطأ في إرسال التذكير');
    } finally {
      setSendingReminder(null);
    }
  };

  const canSendReminder = (lastReminderSent: string | null): boolean => {
    if (!lastReminderSent) return true;
    
    const lastSent = new Date(lastReminderSent);
    const now = new Date();
    const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastSent >= 24;
  };

  const getReminderButtonText = (lastReminderSent: string | null): string => {
    if (!lastReminderSent) return 'إرسال تذكير';
    
    const lastSent = new Date(lastReminderSent);
    const now = new Date();
    const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSent >= 24) return 'إرسال تذكير';
    
    const hoursRemaining = Math.ceil(24 - hoursSinceLastSent);
    return `انتظر ${hoursRemaining} ساعة`;
  };

  const filteredReports = reports.filter(report => {
    const matchesTier = filterTier === 'all' || report.subscription_tier === filterTier;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'expiring' && report.days_remaining <= 3 && report.days_remaining >= 0) ||
      (filterStatus === 'active' && report.days_remaining > 3) ||
      (filterStatus === 'expired' && report.days_remaining < 0);
    const matchesSearch = report.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user_phone.includes(searchTerm);

    return matchesTier && matchesStatus && matchesSearch;
  });

  const expiringReports = reports.filter(r => r.days_remaining <= 3 && r.days_remaining >= 0);

  if (loading) {
    return (
      <DashboardLayout title="تقارير الاشتراكات">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">جاري التحميل...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تقارير الاشتراكات">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">تقارير الاشتراكات</h1>
            <p className="text-gray-600">عرض وإدارة جميع الاشتراكات والمدفوعات</p>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">إجمالي المشتركين</h3>
              <p className="text-4xl font-bold">{stats.totalSubscribers}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">الباقة الأساسية</h3>
              <p className="text-4xl font-bold">{stats.basicCount}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">الباقة المميزة</h3>
              <p className="text-4xl font-bold">{stats.premiumCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">إجمالي الإيرادات</h3>
              <p className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} ريال</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">منتهية خلال 3 أيام</h3>
              <p className="text-4xl font-bold">{stats.expiringCount}</p>
            </div>
          </div>

          {/* الاشتراكات المنتهية قريباً */}
          {expiringReports.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-xl font-bold text-red-700 mb-4">⚠️ اشتراكات تنتهي خلال 3 أيام</h2>
            <div className="space-y-2">
              {expiringReports.map(report => (
                <div key={report.user_id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800">{report.user_name}</span>
                    <span className="text-gray-600 mr-2">({report.user_phone})</span>
                    <span className="text-red-600 font-semibold mr-2">
                      - باقي {report.days_remaining} يوم
                    </span>
                  </div>
                  <button
                    onClick={() => handleSendReminder(report.user_id, report.user_name)}
                    disabled={sendingReminder === report.user_id || !canSendReminder(report.last_reminder_sent)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm"
                    title={!canSendReminder(report.last_reminder_sent) ? 'يجب الانتظار 24 ساعة بين كل تذكير' : ''}
                  >
                    {sendingReminder === report.user_id ? 'جاري الإرسال...' : getReminderButtonText(report.last_reminder_sent)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* الفلاتر والبحث */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">البحث</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الهاتف"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">نوع الباقة</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="basic">أساسية</option>
                <option value="premium">مميزة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">حالة الاشتراك</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="expiring">ينتهي قريباً</option>
                <option value="expired">منتهي</option>
              </select>
            </div>
          </div>
        </div>

          {/* جدول التقارير */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الطالب</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم الهاتف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الباقة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الأيام المتبقية</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">عدد الدفعات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{report.user_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.user_phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.subscription_tier === 'premium' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.plan_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.days_remaining < 0 
                          ? 'bg-red-100 text-red-800'
                          : report.days_remaining <= 3
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.days_remaining < 0 ? 'منتهي' : report.days_remaining <= 3 ? 'ينتهي قريباً' : 'نشط'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(report.subscription_end).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${
                        report.days_remaining < 0 
                          ? 'text-red-600'
                          : report.days_remaining <= 3
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {report.days_remaining < 0 ? `منتهي منذ ${Math.abs(report.days_remaining)} يوم` : `${report.days_remaining} يوم`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-semibold">
                      {report.payments.length}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedUserPayments({
                            userName: report.user_name,
                            payments: report.payments
                          });
                          setShowPaymentsModal(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-xs font-semibold"
                      >
                        عرض الدفعات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد نتائج
              </div>
            )}
          </div>

          {/* Modal عرض المدفوعات */}
          {showPaymentsModal && selectedUserPayments && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentsModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">تفاصيل المدفوعات</h2>
                      <p className="text-sm opacity-90 mt-1">{selectedUserPayments.userName}</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentsModal(false)}
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
                  <div className="space-y-4">
                    {selectedUserPayments.payments.map((payment, index) => (
                      <div key={payment.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">الدفعة رقم {index + 1}</h3>
                              <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleString('ar-SA')}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-2xl font-bold text-green-600">{payment.amount} {payment.currency}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">طريقة الدفع</div>
                            <div className="font-semibold text-gray-800">
                              {payment.payment_method === 'creditcard' ? '💳 بطاقة ائتمان' :
                               payment.payment_method === 'applepay' ? '🍎 Apple Pay' :
                               payment.payment_method === 'stcpay' ? '📱 STC Pay' :
                               payment.payment_method || 'غير محدد'}
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">نوع البطاقة</div>
                            <div className="font-semibold text-gray-800">{payment.card_brand || 'غير محدد'}</div>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">آخر 4 أرقام</div>
                            <div className="font-semibold text-gray-800 font-mono">**** {payment.card_last_four || '****'}</div>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">الحالة</div>
                            <div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                ✓ مدفوع
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      إجمالي الدفعات: <span className="font-bold text-gray-800">{selectedUserPayments.payments.length}</span>
                    </div>
                    <button
                      onClick={() => setShowPaymentsModal(false)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
