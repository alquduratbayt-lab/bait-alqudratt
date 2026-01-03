import { supabaseAdmin } from './adminAuth';

interface LogActivityParams {
  adminId: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view';
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
}

export async function logActivity({
  adminId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
}: LogActivityParams) {
  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        admin_id: adminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details ? JSON.stringify(details) : null,
        ip_address: ipAddress,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// دوال مساعدة لتسجيل أنواع محددة من النشاطات
export const ActivityLogger = {
  // تسجيل دخول
  login: (adminId: string, email: string, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'login',
      resourceType: 'auth',
      details: { email },
      ipAddress,
    }),

  // تسجيل خروج
  logout: (adminId: string, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'logout',
      resourceType: 'auth',
      ipAddress,
    }),

  // إنشاء مشرف
  createAdmin: (adminId: string, newAdminData: any, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'create',
      resourceType: 'admins',
      resourceId: newAdminData.id,
      details: {
        name: newAdminData.name,
        email: newAdminData.email,
        role: newAdminData.role_name,
      },
      ipAddress,
    }),

  // تعديل مشرف
  updateAdmin: (adminId: string, targetAdminId: string, changes: any, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'update',
      resourceType: 'admins',
      resourceId: targetAdminId,
      details: changes,
      ipAddress,
    }),

  // حذف مشرف
  deleteAdmin: (adminId: string, targetAdminId: string, targetAdminName: string, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'delete',
      resourceType: 'admins',
      resourceId: targetAdminId,
      details: { name: targetAdminName },
      ipAddress,
    }),

  // إنشاء دور
  createRole: (adminId: string, roleData: any, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'create',
      resourceType: 'roles',
      resourceId: roleData.id,
      details: {
        name: roleData.name,
        display_name: roleData.display_name_ar,
      },
      ipAddress,
    }),

  // تعديل دور
  updateRole: (adminId: string, roleId: string, changes: any, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'update',
      resourceType: 'roles',
      resourceId: roleId,
      details: changes,
      ipAddress,
    }),

  // حذف دور
  deleteRole: (adminId: string, roleId: string, roleName: string, ipAddress?: string) =>
    logActivity({
      adminId,
      action: 'delete',
      resourceType: 'roles',
      resourceId: roleId,
      details: { name: roleName },
      ipAddress,
    }),

  // عام - لأي نوع آخر
  custom: (params: LogActivityParams) => logActivity(params),
};
