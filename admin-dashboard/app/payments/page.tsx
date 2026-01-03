'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  moyasar_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  card_brand: string;
  card_last_four: string;
  created_at: string;
  users: {
    name: string;
    phone: string;
  };
  subscription_plans: {
    name: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users (name, phone),
          subscription_plans (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data || []);

      // حساب الإحصائيات
      if (data) {
        const totalRevenue = data
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const successfulPayments = data.filter(p => p.status === 'paid').length;
        const failedPayments = data.filter(p => p.status === 'failed').length;

        const today = new Date().toISOString().split('T')[0];
        const todayRevenue = data
          .filter(p => p.status === 'paid' && p.created_at.startsWith(today))
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        setStats({
          totalRevenue,
          successfulPayments,
          failedPayments,
          todayRevenue
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      paid: 'مدفوع',
      failed: 'فشل',
      pending: 'قيد المعالجة',
      refunded: 'مسترد'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      creditcard: '💳',
      applepay: '🍎',
      stcpay: '📱',
      mada: '💳'
    };
    return icons[method as keyof typeof icons] || '💰';
  };

  return (
    <DashboardLayout title="المدفوعات">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              المدفوعات
            </h1>
            <p className="text-gray-600">عرض وإدارة جميع المدفوعات في النظام</p>
          </div>

          {/* البطاقات العلوية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">إجمالي الإيرادات</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>
                {stats.totalRevenue.toLocaleString()} ريال
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">المدفوعات الناجحة</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>
                {stats.successfulPayments}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">المدفوعات الفاشلة</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>
                {stats.failedPayments}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-sm opacity-90 mb-2">إيرادات اليوم</h3>
              <p className="text-4xl font-bold" suppressHydrationWarning>
                {stats.todayRevenue.toLocaleString()} ريال
              </p>
            </div>
          </div>

          {/* جدول المدفوعات */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل المدفوعات</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد مدفوعات بعد
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">الطالب</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">الباقة</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">المبلغ</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">طريقة الدفع</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">الحالة</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{payment.users?.name}</p>
                            <p className="text-sm text-gray-500">{payment.users?.phone}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            {payment.subscription_plans?.name}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-gray-900">
                            {parseFloat(String(payment.amount)).toLocaleString()} {payment.currency}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span>{getPaymentMethodIcon(payment.payment_method)}</span>
                            {payment.card_brand && (
                              <span className="text-sm text-gray-600">
                                {payment.card_brand} •••• {payment.card_last_four}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {new Date(payment.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
