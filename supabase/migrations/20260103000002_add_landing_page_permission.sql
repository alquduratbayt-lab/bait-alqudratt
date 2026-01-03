-- إضافة صلاحية إدارة محتوى الصفحة الرئيسية

INSERT INTO permissions (name, display_name_ar, category, description)
VALUES (
  'manage_landing_page',
  'إدارة محتوى الصفحة الرئيسية',
  'content',
  'السماح بإدارة وتعديل محتوى الصفحة الرئيسية للموقع (من نحن، الميزات، الأسئلة الشائعة، التقييمات، معلومات التواصل)'
)
ON CONFLICT (name) DO NOTHING;

-- إضافة الصلاحية لدور Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.name = 'manage_landing_page'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
