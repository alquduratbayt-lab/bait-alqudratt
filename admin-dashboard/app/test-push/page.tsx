'use client';

import { useState } from 'react';
import { sendSinglePushNotification } from '@/lib/sendPushNotification';

export default function TestPushPage() {
  const [token, setToken] = useState('');
  const [title, setTitle] = useState('اختبار الإشعار');
  const [message, setMessage] = useState('هذا إشعار تجريبي');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!token.trim()) {
      alert('الرجاء إدخال Push Token');
      return;
    }

    setLoading(true);
    setResult('جاري الإرسال...');

    try {
      const success = await sendSinglePushNotification(token, title, message);
      
      if (success) {
        setResult('✅ تم إرسال الإشعار بنجاح!');
      } else {
        setResult('❌ فشل إرسال الإشعار. تحقق من Console للتفاصيل.');
      }
    } catch (error: any) {
      setResult(`❌ خطأ: ${error?.message || 'حدث خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            اختبار Push Notifications
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                Push Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
                placeholder="ExponentPushToken[xxxxxx...]"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                انسخ Push Token من Console التطبيق أو من جدول users في Supabase
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                العنوان
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                الرسالة
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right resize-none"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الإشعار التجريبي'}
            </button>

            {result && (
              <div className={`p-4 rounded-lg text-center font-semibold ${
                result.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2 text-right">📝 ملاحظات مهمة:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-right list-disc list-inside">
              <li>Push Notifications لا تعمل على Simulator/Emulator</li>
              <li>يجب استخدام جهاز حقيقي (iPhone أو Android)</li>
              <li>تأكد من منح أذونات الإشعارات في التطبيق</li>
              <li>Push Token يبدأ بـ ExponentPushToken[...]</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2 text-right">🔍 كيفية الحصول على Push Token:</h3>
            <ol className="text-sm text-gray-700 space-y-2 text-right list-decimal list-inside">
              <li>افتح التطبيق على جهاز حقيقي</li>
              <li>سجل دخول كطالب أو ولي أمر</li>
              <li>افتح Console في Metro Bundler</li>
              <li>ابحث عن "Push token:" في الـ logs</li>
              <li>انسخ الـ token والصقه هنا</li>
            </ol>
            <p className="text-xs text-gray-500 mt-3 text-right">
              أو استعلم من Supabase: SELECT push_token FROM users WHERE push_token IS NOT NULL;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
