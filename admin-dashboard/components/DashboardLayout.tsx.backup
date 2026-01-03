'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { supabaseAdmin } from '@/lib/adminAuth';

interface Admin {
  id: string;
  email: string;
  name: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
}

interface Role {
  id: string;
  name: string;
  display_name_ar: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role_id: '',
  });

  useEffect(() => {
    fetchAdmins();
    fetchRoles();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('admins_with_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('display_name_ar', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        password: '',
        name: admin.name,
        phone: admin.phone || '',
        role_id: admin.role_id,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        role_id: roles[0]?.id || '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/manage', {
        method: editingAdmin ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingAdmin?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingAdmin ? 'تم تحديث المشرف بنجاح' : 'تم إضافة المشرف بنجاح');
        handleCloseModal();
        fetchAdmins();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: admin.id,
          is_active: !admin.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAdmins();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;

    try {
      const response = await fetch('/api/admin/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: adminId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('تم حذف المشرف بنجاح');
        fetchAdmins();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <DashboardLayout title="إدارة المشرفين">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* الهيدر */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">إدارة المشرفين</h1>
              <p className="text-gray-600 mt-1">إضافة وتعديل وحذف المشرفين</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة مشرف جديد
            </button>
          </div>

          {/* جدول المشرفين */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الاسم</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الهاتف</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">آخر دخول</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        جاري التحميل...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        لا يوجد مشرفين
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-right">
                          <div className="font-semibold text-gray-800">{admin.name}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600" dir="ltr">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600" dir="ltr">
                          {admin.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {admin.role_display_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleActive(admin)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              admin.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {admin.is_active ? 'نشط' : 'معطل'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 text-sm">
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString('ar-SA')
                            : 'لم يسجل دخول بعد'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(admin)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="تعديل"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="حذف"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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

      {/* Modal إضافة/تعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAdmin ? 'تعديل مشرف' : 'إضافة مشرف جديد'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الاسم</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الدور</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.display_name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  كلمة المرور {editingAdmin && '(اتركها فارغة إذا لم ترد تغييرها)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  {editingAdmin ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
