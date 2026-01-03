import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Admin {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name_ar: string;
  description?: string;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  name: string;
  display_name_ar: string;
  category: string;
  description?: string;
}

export interface AdminWithRole extends Admin {
  role_name: string;
  role_display_name: string;
}

// تشفير كلمة المرور
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// التحقق من كلمة المرور
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// تسجيل دخول المشرف
export async function loginAdmin(email: string, password: string) {
  try {
    console.log('🔐 محاولة تسجيل دخول:', { email });
    
    // جلب المشرف من قاعدة البيانات
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    console.log('📊 نتيجة البحث:', { 
      found: !!admin, 
      error: error?.message,
      errorCode: error?.code,
      hasPasswordHash: admin ? !!admin.password_hash : false
    });

    if (error || !admin) {
      console.log('❌ المشرف غير موجود أو غير نشط');
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // التحقق من كلمة المرور
    console.log('🔑 التحقق من كلمة المرور...');
    const isValidPassword = await verifyPassword(password, admin.password_hash);
    console.log('🔑 نتيجة التحقق:', { isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ كلمة المرور غير صحيحة');
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    console.log('✅ تسجيل الدخول نجح');

    // تحديث آخر تسجيل دخول
    await supabaseAdmin
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // تسجيل النشاط
    await logActivity(admin.id, 'login', null, null, { email });

    // جلب الدور والصلاحيات
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', admin.role_id)
      .single();

    const permissions = await getAdminPermissions(admin.id);

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        phone: admin.phone,
        role: role,
        permissions: permissions,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
  }
}

// الحصول على صلاحيات المشرف
export async function getAdminPermissions(adminId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_admin_permissions', {
      admin_id_param: adminId,
    });

    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }

    return data.map((row: any) => row.permission_name);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

// التحقق من صلاحية معينة
export async function hasPermission(adminId: string, permissionName: string): Promise<boolean> {
  const permissions = await getAdminPermissions(adminId);
  return permissions.includes(permissionName);
}

// تسجيل نشاط
export async function logActivity(
  adminId: string,
  action: string,
  resourceType?: string | null,
  resourceId?: string | null,
  details?: any,
  ipAddress?: string
) {
  try {
    await supabaseAdmin.rpc('log_admin_activity', {
      admin_id_param: adminId,
      action_param: action,
      resource_type_param: resourceType,
      resource_id_param: resourceId,
      details_param: details ? JSON.stringify(details) : null,
      ip_address_param: ipAddress,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// جلب جميع المشرفين
export async function getAllAdmins() {
  const { data, error } = await supabaseAdmin
    .from('admins_with_roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }

  return data;
}

// جلب جميع الأدوار
export async function getAllRoles() {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return data;
}

// جلب جميع الصلاحيات
export async function getAllPermissions() {
  const { data, error } = await supabaseAdmin
    .from('permissions')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  return data;
}

// جلب صلاحيات دور معين
export async function getRolePermissions(roleId: string) {
  const { data, error } = await supabaseAdmin
    .from('role_permissions')
    .select('permission_id, permissions(*)')
    .eq('role_id', roleId);

  if (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }

  return data.map((rp: any) => rp.permissions);
}

// إنشاء مشرف جديد
export async function createAdmin(
  email: string,
  password: string,
  name: string,
  roleId: string,
  phone?: string
) {
  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name,
          role_id: roleId,
          phone,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true, admin: data };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return { success: false, error: error.message };
  }
}

// تحديث مشرف
export async function updateAdmin(
  adminId: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    role_id?: string;
    is_active?: boolean;
    password?: string;
  }
) {
  try {
    const updateData: any = { ...updates };

    // إذا كان هناك كلمة مرور جديدة، قم بتشفيرها
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
      delete updateData.password;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true, admin: data };
  } catch (error: any) {
    console.error('Error updating admin:', error);
    return { success: false, error: error.message };
  }
}

// حذف مشرف
export async function deleteAdmin(adminId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('Error deleting admin:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    return { success: false, error: error.message };
  }
}

// إنشاء دور جديد
export async function createRole(
  name: string,
  displayNameAr: string,
  description?: string,
  permissionIds: string[] = []
) {
  try {
    // إنشاء الدور
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .insert([
        {
          name,
          display_name_ar: displayNameAr,
          description,
          is_system_role: false,
        },
      ])
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role:', roleError);
      return { success: false, error: roleError.message };
    }

    // ربط الصلاحيات
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permId) => ({
        role_id: role.id,
        permission_id: permId,
      }));

      const { error: permError } = await supabaseAdmin
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) {
        console.error('Error assigning permissions:', permError);
      }
    }

    return { success: true, role };
  } catch (error: any) {
    console.error('Error creating role:', error);
    return { success: false, error: error.message };
  }
}

// تحديث صلاحيات دور
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    // حذف الصلاحيات القديمة
    await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId);

    // إضافة الصلاحيات الجديدة
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permId) => ({
        role_id: roleId,
        permission_id: permId,
      }));

      const { error } = await supabaseAdmin
        .from('role_permissions')
        .insert(rolePermissions);

      if (error) {
        console.error('Error updating permissions:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return { success: false, error: error.message };
  }
}

// حذف دور
export async function deleteRole(roleId: string) {
  try {
    const { error } = await supabaseAdmin.from('roles').delete().eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return { success: false, error: error.message };
  }
}
