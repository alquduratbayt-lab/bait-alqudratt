'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabaseAdmin } from '@/lib/adminAuth';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
  admins?: {
    name: string;
    email: string;
  };
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabaseAdmin
        .from('activity_logs')
        .select('*, admins(name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      login: { color: 'bg-green-100 text-green-700', text: 'تسجيل دخول' },
      logout: { color: 'bg-gray-100 text-gray-700', text: 'تسجيل خروج' },
      create: { color: 'bg-blue-100 text-blue-700', text: 'إنشاء' },
      update: { color: 'bg-yellow-100 text-yellow-700', text: 'تحديث' },
      delete: { color: 'bg-red-100 text-red-700', text: 'حذف' },
      view: { color: 'bg-indigo-100 text-indigo-700', text: 'عرض' },
    };

    const badge = badges[action] || { color: 'bg-gray-100 text-gray-700', text: action };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getResourceTypeName = (resourceType: string | null | undefined) => {
    if (!resourceType) return '-';
    
    const resourceTypes: Record<string, string> = {
      'auth': 'المصادقة',
      'admins': 'المشرفين',
      'roles': 'الأدوار',
      'permissions': 'الصلاحيات',
      'users': 'المستخدمين',
      'subjects': 'المواد الدراسية',
      'lessons': 'الدروس',
      'questions': 'الأسئلة',
      'subscriptions': 'الاشتراكات',
      'payments': 'المدفوعات',
      'rewards': 'الجوائز',
      'tickets': 'التذاكر',
      'notifications': 'الإشعارات',
      'banners': 'البانرات',
      'settings': 'الإعدادات',
    };

    return resourceTypes[resourceType] || resourceType;
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    let parsedDetails = details;
    
    // إذا كان نص JSON، نحوله إلى كائن
    if (typeof details === 'string') {
      try {
        parsedDetails = JSON.parse(details);
      } catch (e) {
        // إذا فشل التحويل، نعرضه كنص عادي
        return <span className="text-gray-700">{details}</span>;
      }
    }
    
    // إذا كان كائن، نعرضه بشكل منظم
    if (typeof parsedDetails === 'object' && parsedDetails !== null) {
      // إزالة البيانات المكررة (email, name, id)
      const filteredDetails = Object.entries(parsedDetails).filter(
        ([key]) => !['email', 'id', 'admin_id', 'user_id'].includes(key)
      );
      
      // إذا لم يتبق شيء مفيد، لا نعرض شيء
      if (filteredDetails.length === 0) {
        return <span className="text-gray-400 text-sm">لا توجد تفاصيل إضافية</span>;
      }
      
      return (
        <div className="space-y-2">
          {filteredDetails.map(([key, value]) => {
            // ترجمة المفاتيح الشائعة
            const translations: Record<string, string> = {
              'old_value': 'القيمة القديمة',
              'new_value': 'القيمة الجديدة',
              'reason': 'السبب',
              'note': 'ملاحظة',
              'status': 'الحالة',
              'role': 'الدور',
              'changes': 'التغييرات',
              'field': 'الحقل',
              'message': 'الرسالة',
            };
            
            const displayKey = translations[key] || key;
            
            return (
              <div key={key} className="flex items-start gap-3">
                <span className="font-semibold text-blue-700 min-w-[120px] text-right">{displayKey}:</span>
                <span className="text-gray-800 flex-1">{String(value)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    
    return <span className="text-gray-700">{String(parsedDetails)}</span>;
  };

  return (
    <DashboardLayout title="سجل النشاطات">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* الهيدر */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">سجل النشاطات</h1>
              <p className="text-gray-600 mt-1">جميع العمليات المسجلة في النظام</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع العمليات</option>
                <option value="login">تسجيل دخول</option>
                <option value="create">إنشاء</option>
                <option value="update">تحديث</option>
                <option value="delete">حذف</option>
              </select>
              <button
                onClick={fetchLogs}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* جدول السجلات */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">التاريخ والوقت</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">المشرف</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">العملية</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">نوع المورد</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">التفاصيل</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        جاري التحميل...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        لا توجد سجلات
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-gray-800">
                            {log.admins?.name || 'غير معروف'}
                          </div>
                          <div className="text-sm text-gray-500" dir="ltr">
                            {log.admins?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{getActionBadge(log.action)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {getResourceTypeName(log.resource_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 text-sm">
                          {log.details ? (
                            <details className="cursor-pointer group">
                              <summary className="text-blue-600 hover:text-blue-700 hover:underline font-medium list-none flex items-center gap-1">
                                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                عرض التفاصيل
                              </summary>
                              <div className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 max-w-md">
                                {formatDetails(log.details)}
                              </div>
                            </details>
                          ) : (
                            <span className="text-gray-400">لا توجد تفاصيل</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 text-sm" dir="ltr">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
