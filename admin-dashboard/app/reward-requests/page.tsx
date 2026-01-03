'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string;
    email: string;
  };
  rewards: {
    title: string;
    image_url: string;
  };
}

export default function RewardRequestsPage() {
  const [requests, setRequests] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('user_rewards')
        .select(`
          *,
          rewards:reward_id (title, image_url)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // جلب معلومات المستخدمين من جدول users المخصص
      const requestsWithUsers = await Promise.all(
        (data || []).map(async (request) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', request.user_id)
            .single();

          return {
            ...request,
            users: {
              full_name: userData?.name || 'غير معروف',
              email: userData?.email || ''
            }
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('user_rewards')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
      alert('تم تحديث حالة الطلب بنجاح!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'قيد الانتظار',
      approved: 'تمت الموافقة',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <DashboardLayout title="طلبات الجوائز">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">طلبات الجوائز</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              قيد الانتظار
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              تمت الموافقة
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'delivered' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              تم التسليم
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الجائزة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النقاط
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.users?.full_name || 'غير معروف'}
                        </div>
                        <div className="text-sm text-gray-500">{request.users?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {request.rewards?.image_url && (
                          <img
                            src={request.rewards.image_url}
                            alt={request.rewards.title}
                            className="w-10 h-10 rounded object-cover ml-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {request.rewards?.title || 'غير معروف'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.points_spent} نقطة</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(request.id, 'approved')}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => updateStatus(request.id, 'cancelled')}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(request.id, 'delivered')}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          تم التسليم
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
