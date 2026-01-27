'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Smartphone,
  RefreshCw
} from 'lucide-react';

interface SiteSettings {
  logo_url?: string;
  site_name: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    fetchSiteSettings();
    verifyPayment();
  }, []);


  const fetchSiteSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      if (data) setSiteSettings(data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const verifyPayment = async () => {
    try {
      // طباعة كل الـ URL parameters
      const allParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
      });
      console.log('🔗 كل parameters في URL:', allParams);
      
      const paymentId = searchParams.get('id') || searchParams.get('payment_id') || searchParams.get('invoice_id');
      const paymentStatus = searchParams.get('status');

      console.log('🔍 التحقق من الدفع:', { paymentId, paymentStatus });

      // نجلب آخر دفعة للمستخدم من قاعدة البيانات دائماً
      let finalPaymentId = paymentId;
      
      // جلب بيانات المستخدم من localStorage
      const storedUser = localStorage.getItem('student_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('👤 User ID:', user.id);
        
        // جلب آخر دفعة للمستخدم (الأحدث)
        const { data: lastPayment } = await supabase
          .from('payments')
          .select('moyasar_payment_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastPayment?.moyasar_payment_id) {
          finalPaymentId = lastPayment.moyasar_payment_id;
          console.log('📦 آخر دفعة (invoice_id):', finalPaymentId);
        }
      }
      
      // إذا كان هناك معرف دفع، نستدعي verify-payment لتحديث الاشتراك
      if (finalPaymentId) {
        console.log('📞 استدعاء verify-payment مع paymentId:', finalPaymentId);
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { paymentId: finalPaymentId },
          });
          console.log('📦 نتيجة verify-payment:', data, error);
          
          if (data?.success) {
            setStatus('success');
            setPaymentDetails(data);
            setTimeout(() => {
              window.location.href = '/subscribe';
            }, 3000);
            return;
          }
        } catch (err) {
          console.error('verify-payment error:', err);
        }
      }
      
      // إذا كانت الحالة paid في URL، نعرض النجاح ونحول للاشتراكات
      if (paymentStatus === 'paid' || paymentStatus === 'success') {
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/subscribe';
        }, 3000);
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
      } else {
        // حالة pending أو غير معروفة - نعرض pending
        setStatus('pending');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setStatus('pending');
    }
  };

  const handleRetry = () => {
    window.location.href = '/subscribe';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 space-x-reverse">
              {siteSettings?.logo_url ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.site_name || 'بيت القدرات'} 
                  className="w-14 h-14 object-contain"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-[#1a5f7a] to-[#2c5f7a] rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-gray-800">{siteSettings?.site_name || 'بيت القدرات'}</span>
            </Link>
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#1a5f7a] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>الرئيسية</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="w-full h-full border-4 border-[#1a5f7a]/20 border-t-[#1a5f7a] rounded-full animate-spin"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">جاري التحقق من الدفع</h1>
              <p className="text-gray-600">يرجى الانتظار...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500 rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500 rounded-full opacity-10 blur-2xl"></div>

              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">تم الدفع بنجاح! 🎉</h1>
              <p className="text-gray-600 mb-4">
                تم تفعيل اشتراكك بنجاح. يمكنك الآن الاستمتاع بجميع المميزات
              </p>

              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <p className="text-[#1a5f7a] font-medium">
                  ⏳ سيتم تحويلك لصفحة الاشتراكات خلال 3 ثواني...
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-700 font-medium text-lg">
                  ارجع للتطبيق الآن للاستمتاع بجميع المميزات!
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/subscribe'}
                className="inline-block bg-gradient-to-r from-[#1a5f7a] to-[#2c5f7a] text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                الذهاب للاشتراكات الآن
              </button>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500 rounded-full opacity-10 blur-2xl"></div>

              {/* Failed Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <XCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">فشل الدفع</h1>
              <p className="text-gray-600 mb-8">
                عذراً، لم تتم عملية الدفع بنجاح. يرجى المحاولة مرة أخرى.
              </p>

              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1a5f7a] to-[#2c5f7a] text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Pending State */}
          {status === 'pending' && (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500 rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500 rounded-full opacity-10 blur-2xl"></div>

              {/* Pending Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Clock className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">قيد المعالجة</h1>
              <p className="text-gray-600 mb-8">
                جاري معالجة عملية الدفع. قد يستغرق الأمر بضع دقائق.
              </p>

              <div className="space-y-4">
                <button
                  onClick={verifyPayment}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1a5f7a] to-[#2c5f7a] text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  تحديث الحالة
                </button>
                
                <div>
                  <Link
                    href="/subscribe"
                    className="text-gray-600 hover:text-[#1a5f7a] transition-colors"
                  >
                    العودة للاشتراكات
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© {new Date().getFullYear()} {siteSettings?.site_name || 'بيت القدرات'}. جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a5f7a]/30 border-t-[#1a5f7a] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
