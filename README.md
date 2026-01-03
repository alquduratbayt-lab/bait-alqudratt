# بيت القدرات - Bait Al-Qudrat

تطبيق تعليمي متكامل مبني بـ React Native و Expo

## المتطلبات

- Node.js 18+
- Expo CLI
- Expo Go app على الهاتف

## التثبيت

```bash
# تثبيت المكتبات
npm install

# تشغيل التطبيق
npx expo start
```

## تشغيل التطبيق

1. قم بتثبيت تطبيق **Expo Go** من متجر التطبيقات
2. شغل الأمر `npx expo start`
3. امسح رمز QR بتطبيق Expo Go

## الميزات

- ✅ شاشة ترحيبية مع شعار بيت القدرات
- ✅ شاشة تسجيل دخول (طالب / ولي أمر)
- ✅ تصميم عربي RTL
- ✅ يعمل على iOS و Android

## هيكل المشروع

```
bait-alqudrat/
├── App.js                 # نقطة الدخول الرئيسية
├── src/
│   └── screens/
│       ├── SplashScreen.js   # شاشة الترحيب
│       └── LoginScreen.js    # شاشة تسجيل الدخول
├── assets/                # الصور والأيقونات
├── app.json              # إعدادات Expo
└── package.json          # المكتبات
```
