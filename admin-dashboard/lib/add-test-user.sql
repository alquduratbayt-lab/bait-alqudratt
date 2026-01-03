-- إضافة مستخدم تجريبي للاختبار
INSERT INTO users (id, name, email, phone, type, subscription_type, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'طالب تجريبي',
  'test@example.com',
  '0500000000',
  'student',
  'premium',
  'active'
)
ON CONFLICT (id) DO NOTHING;
