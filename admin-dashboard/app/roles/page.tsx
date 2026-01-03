'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabaseAdmin } from '@/lib/adminAuth';

interface Permission {
  id: string;
  name: string;
  display_name_ar: string;
  category: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  display_name_ar: string;
  description?: string;
  is_system_role: boolean;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name_ar: '',
    description: '',
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (error) throw error;
      setRolePermissions(data.map((rp: any) => rp.permission_id));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    fetchRolePermissions(role.id);
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole) return;

    const newPermissions = rolePermissions.includes(permissionId)
      ? rolePermissions.filter((p) => p !== permissionId)
      : [...rolePermissions, permissionId];

    try {
      // حذف جميع الصلاحيات القديمة
      await supabaseAdmin
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      // إضافة الصلاحيات الجديدة
      if (newPermissions.length > 0) {
        const rolePerms = newPermissions.map((permId) => ({
          role_id: selectedRole.id,
          permission_id: permId,
        }));

        await supabaseAdmin.from('role_permissions').insert(rolePerms);
      }

      setRolePermissions(newPermissions);
      alert('تم تحديث الصلاحيات بنجاح');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('حدث خطأ أثناء تحديث الصلاحيات');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من البيانات المدخلة
    if (!formData.name || !formData.display_name_ar) {
      alert('الرجاء إدخال اسم الدور والاسم العربي');
      return;
    }

    try {
      console.log('Creating role with data:', formData);
      
      const { data, error } = await supabaseAdmin
        .from('roles')
        .insert([
          {
            name: formData.name,
            display_name_ar: formData.display_name_ar,
            description: formData.description,
            is_system_role: false,
          },
        ])
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        throw new Error(error.message || error.hint || error.details || 'فشل في إنشاء الدور - تحقق من صلاحيات قاعدة البيانات');
      }

      if (!data) {
        throw new Error('لم يتم إرجاع بيانات من قاعدة البيانات');
      }

      alert('تم إنشاء الدور بنجاح');
      setShowModal(false);
      setFormData({ name: '', display_name_ar: '', description: '' });
      fetchRoles();
    } catch (error: any) {
      console.error('Error creating role:', error);
      const errorMessage = error?.message || 'حدث خطأ أثناء إنشاء الدور';
      alert(`خطأ: ${errorMessage}\n\nتحقق من Console للمزيد من التفاصيل`);
    }
  };

  const handleDeleteRole = async (roleId: string, isSystemRole: boolean) => {
    if (isSystemRole) {
      alert('لا يمكن حذف الأدوار النظامية');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

    try {
      const { error } = await supabaseAdmin.from('roles').delete().eq('id', roleId);

      if (error) throw error;

      alert('تم حذف الدور بنجاح');
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setRolePermissions([]);
      }
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('حدث خطأ أثناء حذف الدور');
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryNames: Record<string, string> = {
    system: 'إدارة النظام',
    content: 'إدارة المحتوى',
    users: 'إدارة المستخدمين',
    finance: 'إدارة المالية',
    support: 'الدعم الفني',
    settings: 'الإعدادات',
  };

  return (
    <DashboardLayout title="إدارة الأدوار والصلاحيات">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* الهيدر */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">إدارة الأدوار والصلاحيات</h1>
              <p className="text-gray-600 mt-1">إنشاء أدوار مخصصة وتعيين الصلاحيات</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إنشاء دور جديد
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* قائمة الأدوار */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">الأدوار</h2>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                  ) : roles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">لا توجد أدوار</div>
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedRole?.id === role.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectRole(role)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{role.display_name_ar}</h3>
                            <p className="text-sm text-gray-500">{role.name}</p>
                          </div>
                          {role.is_system_role && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              نظامي
                            </span>
                          )}
                        </div>
                        {!role.is_system_role && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id, role.is_system_role);
                            }}
                            className="mt-2 text-red-600 text-sm hover:underline"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* الصلاحيات */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {selectedRole ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-800">{selectedRole.display_name_ar}</h2>
                      <p className="text-gray-600">{selectedRole.description || 'لا يوجد وصف'}</p>
                    </div>

                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {categoryNames[category] || category}
                          </h3>
                          <div className="space-y-2">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={rolePermissions.includes(perm.id)}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">{perm.display_name_ar}</div>
                                  {perm.description && (
                                    <div className="text-sm text-gray-500">{perm.description}</div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-lg">اختر دوراً لعرض وتعديل صلاحياته</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal إنشاء دور */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">إنشاء دور جديد</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم الدور (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                  placeholder="custom_role"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم الدور (بالعربية)
                </label>
                <input
                  type="text"
                  value={formData.display_name_ar}
                  onChange={(e) => setFormData({ ...formData, display_name_ar: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                  placeholder="دور مخصص"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="وصف الدور..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
