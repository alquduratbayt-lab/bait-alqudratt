# 🚀 تعليمات إعداد نظام الدفع ميسر

## ✅ المفاتيح المتوفرة:

```
Publishable Key: pk_test_ijJF2iPkzA26ooHsaBAjPugoHUzv9fjSWTYVYiHZ
Secret Key: sk_test_5K2CusjQLiMxfMmasyrsysn9WP3Ftg5NQNvgu1Gh
```

---

## 📋 خطوات التنفيذ:

### **1️⃣ إنشاء جدول المدفوعات في Supabase**

1. افتح Supabase Dashboard: https://supabase.com/dashboard
2. اذهب إلى: **SQL Editor** → **New Query**
3. انسخ محتوى الملف: `admin-dashboard/lib/setup-payments-table.sql`
4. الصق في SQL Editor
5. اضغط **Run** أو **F5**

---

### **2️⃣ رفع Edge Functions إلى Supabase**

افتح Terminal في مجلد المشروع ونفذ الأوامر التالية:

```bash
# 1. تسجيل الدخول لـ Supabase (إذا لم تكن مسجل)
npx supabase login

# 2. ربط المشروع (استبدل YOUR_PROJECT_ID بـ Project ID من Supabase)
npx supabase link --project-ref YOUR_PROJECT_ID

# 3. إضافة المفتاح السري كـ Secret
npx supabase secrets set MOYASAR_SECRET_KEY=sk_test_5K2CusjQLiMxfMmasyrsysn9WP3Ftg5NQNvgu1Gh

# 4. رفع Function: create-payment
npx supabase functions deploy create-payment

# 5. رفع Function: moyasar-webhook
npx supabase functions deploy moyasar-webhook
```

**للحصول على Project ID:**
- Supabase Dashboard → Settings → General → Reference ID

---

### **3️⃣ إعداد Webhook في ميسر**

1. اذهب إلى: https://moyasar.com/dashboard
2. اضغط: **Settings** → **Webhooks**
3. اضغط: **Add Webhook**
4. أدخل URL:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/moyasar-webhook
```
5. اختر Events: ✅ `payment.paid`
6. احفظ

---

### **4️⃣ إضافة Publishable Key في التطبيق**

افتح ملف `app.json` وأضف:

```json
{
  "expo": {
    "name": "بيت القدرات",
    "slug": "bait-alqudratt",
    "extra": {
      "moyasarPublishableKey": "pk_test_ijJF2iPkzA26ooHsaBAjPugoHUzv9fjSWTYVYiHZ"
    }
  }
}
```

---

### **5️⃣ اختبار النظام**

#### **بطاقات تجريبية:**
```
رقم البطاقة: 4111 1111 1111 1111
CVV: 123
تاريخ الانتهاء: 12/25
الاسم: Test User
```

#### **خطوات الاختبار:**
1. شغل التطبيق: `npx expo start`
2. اذهب لصفحة الاشتراكات
3. اختر باقة واضغط "اشترك الآن"
4. أدخل بيانات البطاقة التجريبية
5. أكمل الدفع
6. تأكد من تحديث الاشتراك في الملف الشخصي

---

## 🔍 التحقق من نجاح العملية:

### **في Supabase:**
- اذهب: **Table Editor** → **payments**
- يجب أن تشاهد السجل الجديد بحالة `paid`

### **في لوحة التحكم:**
- افتح: `http://localhost:3000/payments`
- يجب أن تشاهد المدفوعات والإحصائيات

### **في ميسر:**
- اذهب: Dashboard → Payments
- يجب أن تشاهد عملية الدفع التجريبية

---

## ⚠️ ملاحظات مهمة:

1. **Test Mode:** حالياً في وضع التجربة
2. **Live Mode:** للتحويل للإنتاج، استبدل `pk_test_` و `sk_test_` بـ `pk_live_` و `sk_live_`
3. **الأمان:** لا تشارك المفتاح السري أبداً في الكود أو Git

---

## 🆘 حل المشاكل:

### **إذا لم يعمل الدفع:**
1. تأكد من رفع Edge Functions بنجاح
2. تأكد من إضافة Secret Key في Supabase
3. تأكد من إعداد Webhook في ميسر
4. افحص Logs في Supabase: Functions → Logs

### **إذا لم يتحدث الاشتراك:**
1. افحص Webhook Logs في ميسر
2. افحص Function Logs في Supabase
3. تأكد من أن Webhook URL صحيح

---

## ✅ Checklist:

- [ ] إنشاء جدول payments في Supabase
- [ ] رفع create-payment function
- [ ] رفع moyasar-webhook function
- [ ] إضافة Secret Key في Supabase
- [ ] إعداد Webhook في ميسر
- [ ] إضافة Publishable Key في app.json
- [ ] اختبار الدفع ببطاقة تجريبية
- [ ] التحقق من تحديث الاشتراك

---

**جاهز للتشغيل! 🎉**
