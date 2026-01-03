-- إصلاح RLS Policies لنظام إدارة المشرفين
-- Fix RLS Policies for Admin Management System

-- ===================================
-- 1. حذف السياسات القديمة
-- ===================================
DROP POLICY IF EXISTS "Allow read access to all" ON public.permissions;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.permissions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.permissions;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.permissions;

DROP POLICY IF EXISTS "Allow read access to all" ON public.roles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.roles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.roles;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.roles;

DROP POLICY IF EXISTS "Allow read access to all" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.role_permissions;

DROP POLICY IF EXISTS "Allow read access to all" ON public.admins;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.admins;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.admins;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.admins;

DROP POLICY IF EXISTS "Allow read access to all" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.activity_logs;

-- ===================================
-- 2. إنشاء سياسات جديدة تسمح بالوصول الكامل
-- ===================================

-- Permissions Table
CREATE POLICY "Enable all access for service role" ON public.permissions
    FOR ALL USING (true) WITH CHECK (true);

-- Roles Table
CREATE POLICY "Enable all access for service role" ON public.roles
    FOR ALL USING (true) WITH CHECK (true);

-- Role Permissions Table
CREATE POLICY "Enable all access for service role" ON public.role_permissions
    FOR ALL USING (true) WITH CHECK (true);

-- Admins Table
CREATE POLICY "Enable all access for service role" ON public.admins
    FOR ALL USING (true) WITH CHECK (true);

-- Activity Logs Table
CREATE POLICY "Enable all access for service role" ON public.activity_logs
    FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 3. تأكيد تفعيل RLS
-- ===================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
