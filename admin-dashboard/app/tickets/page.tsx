'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface Ticket {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  user_type: string;
  problem_type: string;
  description: string;
  image_url: string | null;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.admin_response || '');
    setSelectedStatus(ticket.status);
    setSelectedPriority(ticket.priority);
  };

  const handleDelete = async () => {
    if (!selectedTicket) return;

    if (!confirm('هل أنت متأكد من حذف هذه التذكرة؟ لن يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      setSaving(true);

      // حذف الصورة من Storage إن وجدت
      if (selectedTicket.image_url) {
        await supabase.storage
          .from('tickets')
          .remove([selectedTicket.image_url]);
      }

      // حذف التذكرة من قاعدة البيانات
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', selectedTicket.id);

      if (error) throw error;

      alert('تم حذف التذكرة بنجاح');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('حدث خطأ أثناء حذف التذكرة');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTicket) return;

    try {
      setSaving(true);

      const updates: any = {
        status: selectedStatus,
        priority: selectedPriority,
      };

      if (adminResponse.trim()) {
        updates.admin_response = adminResponse.trim();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // إرسال إشعار للمستخدم عند تغيير الحالة
      if (selectedStatus !== selectedTicket.status) {
        let notificationMessage = '';
        if (selectedStatus === 'قيد المعالجة') {
          notificationMessage = `تذكرتك "${selectedTicket.problem_type}" قيد المعالجة الآن`;
        } else if (selectedStatus === 'محلولة') {
          notificationMessage = `تم حل تذكرتك "${selectedTicket.problem_type}"`;
        } else if (selectedStatus === 'مغلقة') {
          notificationMessage = `تم إغلاق تذكرتك "${selectedTicket.problem_type}"`;
        }

        if (notificationMessage) {
          // إرسال للطلاب
          if (selectedTicket.user_type === 'طالب') {
            await supabase.from('student_notifications').insert({
              student_id: selectedTicket.user_id,
              parent_id: selectedTicket.user_id,
              title: 'تحديث حالة التذكرة',
              message: notificationMessage,
              type: 'general',
              is_read: false,
            });
          }
          // إرسال لأولياء الأمور
          else if (selectedTicket.user_type === 'ولي الأمر') {
            await supabase.from('parent_notifications').insert({
              parent_id: selectedTicket.user_id,
              student_id: selectedTicket.user_id,
              title: 'تحديث حالة التذكرة',
              message: notificationMessage,
              type: 'general',
              is_read: false,
            });
          }
        }
      }

      // إرسال إشعار للمستخدم إذا تم إضافة رد
      if (adminResponse.trim() && adminResponse !== selectedTicket.admin_response) {
        // إرسال للطلاب
        if (selectedTicket.user_type === 'طالب') {
          await supabase.from('student_notifications').insert({
            student_id: selectedTicket.user_id,
            parent_id: selectedTicket.user_id,
            title: 'رد على تذكرتك',
            message: `تم الرد على تذكرتك: ${selectedTicket.problem_type}`,
            type: 'general',
            is_read: false,
          });
        }
        // إرسال لأولياء الأمور
        else if (selectedTicket.user_type === 'ولي الأمر') {
          await supabase.from('parent_notifications').insert({
            parent_id: selectedTicket.user_id,
            student_id: selectedTicket.user_id,
            title: 'رد على تذكرتك',
            message: `تم الرد على تذكرتك: ${selectedTicket.problem_type}`,
            type: 'general',
            is_read: false,
          });
        }
      }

      alert('تم حفظ التحديثات بنجاح');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('حدث خطأ أثناء حفظ التحديثات');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديدة': return 'bg-blue-100 text-blue-800';
      case 'قيد المعالجة': return 'bg-yellow-100 text-yellow-800';
      case 'محلولة': return 'bg-green-100 text-green-800';
      case 'مغلقة': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'عاجلة': return 'bg-red-100 text-red-800';
      case 'عالية': return 'bg-orange-100 text-orange-800';
      case 'عادية': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'جديدة').length,
    inProgress: tickets.filter(t => t.status === 'قيد المعالجة').length,
    resolved: tickets.filter(t => t.status === 'محلولة').length,
  };

  return (
    <DashboardLayout title="التذاكر">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التذاكر</h1>
          <p className="text-gray-600">عرض ومعالجة تذاكر الدعم الفني</p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">إجمالي التذاكر</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm text-blue-600 mb-1">جديدة</div>
            <div className="text-3xl font-bold text-blue-700">{stats.new}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm text-yellow-600 mb-1">قيد المعالجة</div>
            <div className="text-3xl font-bold text-yellow-700">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-green-600 mb-1">محلولة</div>
            <div className="text-3xl font-bold text-green-700">{stats.resolved}</div>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus('جديدة')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'جديدة' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              جديدة ({stats.new})
            </button>
            <button
              onClick={() => setFilterStatus('قيد المعالجة')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'قيد المعالجة' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قيد المعالجة ({stats.inProgress})
            </button>
            <button
              onClick={() => setFilterStatus('محلولة')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'محلولة' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              محلولة ({stats.resolved})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* قائمة التذاكر */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">التذاكر</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد تذاكر
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket)}
                    className={`p-4 border rounded-lg cursor-pointer transition hover:shadow-md ${
                      selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{ticket.problem_type}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{ticket.name} - {ticket.user_type}</span>
                      <span>{ticket.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل التذكرة */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">تفاصيل التذكرة</h2>
            
            {!selectedTicket ? (
              <div className="text-center py-12 text-gray-500">
                اختر تذكرة لعرض التفاصيل
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
                  >
                    <option value="جديدة">جديدة</option>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="محلولة">محلولة</option>
                    <option value="مغلقة">مغلقة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
                  >
                    <option value="عادية">عادية</option>
                    <option value="عالية">عالية</option>
                    <option value="عاجلة">عاجلة</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">معلومات المستخدم</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold text-gray-900">الاسم:</span> <span className="font-semibold text-gray-900">{selectedTicket.name}</span></p>
                    <p><span className="font-semibold text-gray-900">الهاتف:</span> <span className="font-semibold text-gray-900">{selectedTicket.phone}</span></p>
                    <p><span className="font-semibold text-gray-900">النوع:</span> <span className="font-semibold text-gray-900">{selectedTicket.user_type}</span></p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">نوع المشكلة</h3>
                  <p className="text-sm text-gray-700">{selectedTicket.problem_type}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">الوصف</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {selectedTicket.image_url && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">الصورة المرفقة</h3>
                    <img
                      src={`https://xyrdpmhzwjejkstwovyx.supabase.co/storage/v1/object/public/tickets/${selectedTicket.image_url}`}
                      alt="Ticket attachment"
                      className="w-full max-h-64 object-contain rounded-lg border"
                      onError={(e) => {
                        console.error('Image load error:', selectedTicket.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">رد الإدارة</label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
                    placeholder="اكتب ردك هنا..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    حذف التذكرة
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التحديثات'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
