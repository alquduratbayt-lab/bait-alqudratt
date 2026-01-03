# إعدادات Supabase Auth المطلوبة

## تعطيل تأكيد البريد الإلكتروني

اذهب إلى:
1. Supabase Dashboard
2. Authentication → Settings
3. Email Auth
4. **قم بتعطيل "Enable email confirmations"**

أو نفذ هذا SQL:

```sql
-- تعطيل تأكيد البريد الإلكتروني
UPDATE auth.config 
SET enable_signup = true;

-- السماح بتسجيل الدخول بدون تأكيد البريد
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT NOW();
```

## ملاحظة
بما أننا نستخدم بريد إلكتروني وهمي (`phone@phone.com`)، يجب تعطيل تأكيد البريد الإلكتروني.
