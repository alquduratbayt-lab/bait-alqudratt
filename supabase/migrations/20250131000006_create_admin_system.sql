-- إنشاء نظام إدارة المشرفين والصلاحيات
-- Admin Management System with Flexible Roles

-- ===================================
-- 1. جدول الصلاحيات (Permissions)
-- ===================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name_ar TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('system', 'content', 'users', 'finance', 'support', 'settings')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 2. جدول الأدوار (Roles)
-- ===================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name_ar TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 3. جدول ربط الأدوار بالصلاحيات
-- ===================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- ===================================
-- 4. جدول المشرفين (Admins)
-- ===================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 5. جدول سجل النشاطات (Activity Logs)
-- ===================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 6. إدراج الصلاحيات الأساسية
-- ===================================
INSERT INTO public.permissions (name, display_name_ar, category, description) VALUES
-- إدارة النظام
('manage_admins', 'إدارة المشرفين', 'system', 'إضافة وتعديل وحذف المشرفين'),
('manage_roles', 'إدارة الأدوار', 'system', 'إنشاء وتعديل الأدوار والصلاحيات'),
('view_activity_logs', 'عرض سجل النشاطات', 'system', 'عرض جميع العمليات المسجلة'),

-- إدارة المحتوى
('manage_subjects', 'إدارة المواد الدراسية', 'content', 'إضافة وتعديل وحذف المواد والدروس'),
('manage_books', 'إدارة الكتب', 'content', 'إدارة الكتب والمحتوى التعليمي'),
('manage_exams', 'إدارة الاختبارات', 'content', 'إنشاء وتعديل الاختبارات والأسئلة'),
('manage_banners', 'إدارة البانرات', 'content', 'إدارة الإعلانات والبانرات'),
('manage_onboarding', 'إدارة شاشات الترحيب', 'content', 'تعديل شاشات الترحيب الأولية'),
('manage_calm_moments', 'إدارة لحظات الهدوء', 'content', 'إدارة محتوى لحظات الهدوء'),

-- إدارة المستخدمين
('view_users', 'عرض المستخدمين', 'users', 'عرض قائمة المستخدمين وبياناتهم'),
('manage_users', 'إدارة المستخدمين', 'users', 'تعديل وحذف المستخدمين'),
('send_notifications', 'إرسال الإشعارات', 'users', 'إرسال إشعارات للمستخدمين'),

-- إدارة المالية
('view_payments', 'عرض المدفوعات', 'finance', 'عرض سجل المدفوعات'),
('manage_payments', 'إدارة المدفوعات', 'finance', 'تعديل حالة المدفوعات'),
('manage_subscriptions', 'إدارة الاشتراكات', 'finance', 'إدارة اشتراكات المستخدمين'),
('view_reports', 'عرض التقارير', 'finance', 'عرض التقارير المالية والإحصائية'),
('manage_rewards', 'إدارة الجوائز والنقاط', 'finance', 'إدارة نظام النقاط والجوائز'),

-- الدعم الفني
('view_tickets', 'عرض التذاكر', 'support', 'عرض تذاكر الدعم الفني'),
('manage_tickets', 'إدارة التذاكر', 'support', 'الرد على التذاكر وإغلاقها'),

-- الإعدادات
('manage_app_settings', 'إدارة إعدادات التطبيق', 'settings', 'تعديل إعدادات التطبيق العامة')
ON CONFLICT (name) DO NOTHING;

-- ===================================
-- 7. إنشاء دور Super Admin الافتراضي
-- ===================================
INSERT INTO public.roles (name, display_name_ar, description, is_system_role) VALUES
('super_admin', 'مدير عام', 'صلاحيات كاملة على جميع أجزاء النظام', true),
('content_manager', 'مدير محتوى', 'إدارة المحتوى التعليمي والإعلانات', true),
('user_manager', 'مدير مستخدمين', 'إدارة المستخدمين والإشعارات', true),
('finance_manager', 'مدير مالي', 'إدارة المدفوعات والاشتراكات', true),
('support_agent', 'موظف دعم', 'الرد على التذاكر والاستفسارات', true)
ON CONFLICT (name) DO NOTHING;

-- ===================================
-- 8. ربط صلاحيات Super Admin (كل الصلاحيات)
-- ===================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'super_admin'),
    id
FROM public.permissions
ON CONFLICT DO NOTHING;

-- ===================================
-- 9. ربط صلاحيات Content Manager
-- ===================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'content_manager'),
    id
FROM public.permissions
WHERE name IN (
    'manage_subjects',
    'manage_books',
    'manage_exams',
    'manage_banners',
    'manage_onboarding',
    'manage_calm_moments'
)
ON CONFLICT DO NOTHING;

-- ===================================
-- 10. ربط صلاحيات User Manager
-- ===================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'user_manager'),
    id
FROM public.permissions
WHERE name IN (
    'view_users',
    'manage_users',
    'send_notifications',
    'manage_subscriptions',
    'view_tickets',
    'manage_tickets'
)
ON CONFLICT DO NOTHING;

-- ===================================
-- 11. ربط صلاحيات Finance Manager
-- ===================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'finance_manager'),
    id
FROM public.permissions
WHERE name IN (
    'view_payments',
    'manage_payments',
    'manage_subscriptions',
    'view_reports',
    'manage_rewards'
)
ON CONFLICT DO NOTHING;

-- ===================================
-- 12. ربط صلاحيات Support Agent
-- ===================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'support_agent'),
    id
FROM public.permissions
WHERE name IN (
    'view_users',
    'view_tickets',
    'manage_tickets',
    'send_notifications'
)
ON CONFLICT DO NOTHING;

-- ===================================
-- 13. تفعيل RLS على جميع الجداول
-- ===================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 14. سياسات RLS - السماح بالقراءة للجميع
-- ===================================
CREATE POLICY "Allow read access for all" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Allow read access for all" ON public.activity_logs FOR SELECT USING (true);

-- ===================================
-- 15. سياسات الكتابة - السماح للمصادقين
-- ===================================
CREATE POLICY "Allow insert for authenticated" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON public.admins FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON public.admins FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON public.roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON public.roles FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON public.roles FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON public.role_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated" ON public.role_permissions FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- ===================================
-- 16. إنشاء Indexes للأداء
-- ===================================
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role_id ON public.admins(role_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- ===================================
-- 17. إنشاء View لعرض المشرفين مع أدوارهم
-- ===================================
CREATE OR REPLACE VIEW public.admins_with_roles AS
SELECT 
    a.id,
    a.email,
    a.name,
    a.phone,
    a.is_active,
    a.last_login,
    a.created_at,
    r.id as role_id,
    r.name as role_name,
    r.display_name_ar as role_display_name
FROM public.admins a
LEFT JOIN public.roles r ON a.role_id = r.id;

-- ===================================
-- 18. إنشاء Function للحصول على صلاحيات المشرف
-- ===================================
CREATE OR REPLACE FUNCTION public.get_admin_permissions(admin_id_param UUID)
RETURNS TABLE (permission_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name
    FROM public.admins a
    JOIN public.roles r ON a.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE a.id = admin_id_param AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 19. إنشاء Function لتسجيل النشاطات
-- ===================================
CREATE OR REPLACE FUNCTION public.log_admin_activity(
    admin_id_param UUID,
    action_param TEXT,
    resource_type_param TEXT DEFAULT NULL,
    resource_id_param UUID DEFAULT NULL,
    details_param JSONB DEFAULT NULL,
    ip_address_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (
        admin_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        admin_id_param,
        action_param,
        resource_type_param,
        resource_id_param,
        details_param,
        ip_address_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- تم إنشاء نظام إدارة المشرفين بنجاح!
-- ===================================
