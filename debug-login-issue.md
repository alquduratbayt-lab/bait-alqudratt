# مشكلة تسجيل دخول ولي الأمر

## المشكلة:
- ولي الأمر لا يستطيع تسجيل الدخول
- حتى بعد تغيير كلمة المرور من لوحة التحكم

## السبب المحتمل:
ولي الأمر تم تسجيله **قبل** التعديلات على نظام Auth (قبل تحويل phone إلى email)

## صيغة Email الحالية في LoginScreen:
```javascript
const formattedPhone = phone.startsWith('+966') ? phone : `+966${phone}`;
const email = `${formattedPhone.replace(/\+/g, '')}@bait-alqudratt.temp`;
```

مثال: `0501234567` → `+9660501234567` → `9660501234567@bait-alqudratt.temp`

## صيغة Email القديمة (قبل التعديلات):
```javascript
const email = `${phone}@phone.com`;
```

مثال: `0501234567` → `0501234567@phone.com`

## الحل:
يجب التأكد من أن ولي الأمر مسجل بصيغة email الجديدة، أو تحديث حسابه في Supabase Auth.

## خطوات الفحص:
1. افتح Supabase Dashboard → Authentication → Users
2. ابحث عن ولي الأمر
3. تحقق من صيغة email المسجلة
4. إذا كانت بصيغة قديمة (`@phone.com`)، احذف الحساب وسجل من جديد
