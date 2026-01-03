// سكريبت لإنشاء أول مشرف في النظام
// Create First Admin Script

const bcrypt = require('bcryptjs');

async function createFirstAdmin() {
  const password = 'Admin@123'; // كلمة المرور الافتراضية
  const hash = bcrypt.hashSync(password, 10);
  
  console.log('='.repeat(60));
  console.log('إنشاء أول مشرف في النظام');
  console.log('='.repeat(60));
  console.log('\nالبيانات:');
  console.log('البريد الإلكتروني: admin@baitalqudratt.com');
  console.log('كلمة المرور: Admin@123');
  console.log('\nكلمة المرور المشفرة (password_hash):');
  console.log(hash);
  console.log('\n' + '='.repeat(60));
  console.log('\nالآن انسخ الكود SQL التالي وشغله في Supabase Dashboard → SQL Editor:\n');
  console.log(`
-- إنشاء أول مشرف في النظام
INSERT INTO public.admins (email, password_hash, name, role_id, is_active)
VALUES (
  'admin@baitalqudratt.com',
  '${hash}',
  'المدير العام',
  (SELECT id FROM public.roles WHERE name = 'super_admin'),
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
  `);
  console.log('='.repeat(60));
  console.log('\nبعد تشغيل الكود، يمكنك تسجيل الدخول بالبيانات التالية:');
  console.log('البريد: admin@baitalqudratt.com');
  console.log('كلمة المرور: Admin@123');
  console.log('='.repeat(60));
}

createFirstAdmin();
