'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles,
  ArrowLeft,
  Crown,
  Rocket,
  Star,
  Check,
  Shield,
  CreditCard,
  Zap
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

interface UserData {
  id: string;
  name: string;
  phone: string;
  subscription_tier: string;
  subscription_end: string | null;
  subscription_status: string;
}

interface SiteSettings {
  logo_url?: string;
  site_name: string;
}

export default function SubscribePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    fetchSiteSettings();
    fetchPlans();
  }, []);

  const checkAuth = async () => {
    try {
      // التحقق من وجود جلسة محفوظة
      const storedUser = localStorage.getItem('student_user');
      
      console.log('🔍 التحقق من الجلسة:', storedUser ? 'موجودة' : 'غير موجودة');
      
      if (!storedUser) {
        console.log('❌ لا توجد جلسة - التحويل لصفحة تسجيل الدخول');
        window.location.href = '/login';
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      
      // جلب أحدث بيانات المستخدم من قاعدة البيانات بالـ phone
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', parsedUser.phone)
        .single();

      if (userError || !userData) {
        // محاولة ثانية بالـ id
        const { data: userData2, error: userError2 } = await supabase
          .from('users')
          .select('*')
          .eq('id', parsedUser.id)
          .single();
        
        if (userError2 || !userData2) {
          localStorage.removeItem('student_user');
          localStorage.removeItem('student_phone');
          window.location.href = '/login';
          return;
        }
        
        setUser(userData2);
        return;
      }

      setUser(userData);
    } catch (err) {
      console.error('Auth error:', err);
      window.location.href = '/login';
    }
  };

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

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('حدث خطأ في تحميل الباقات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setProcessingPlan(plan.id);
    setError('');

    try {
      // استدعاء Edge Function لإنشاء الدفع
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          planId: plan.id,
          userId: user.id,
          source: 'web', // لتمييز أن الدفع من الموقع
          callbackUrl: `${window.location.origin}/payment-success`,
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        // التوجيه لصفحة الدفع في Moyasar
        window.location.href = data.payment_url;
      } else {
        throw new Error('لم يتم إنشاء رابط الدفع');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'حدث خطأ في إنشاء عملية الدفع');
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (index: number) => {
    const icons = [Rocket, Star, Crown];
    const Icon = icons[index % icons.length];
    return <Icon className="w-8 h-8" />;
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-amber-500 to-amber-600',
    ];
    return gradients[index % gradients.length];
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    if (!user) return false;
    const tierMap: { [key: string]: string } = {
      'أساسي': 'basic',
      'مميز': 'premium',
    };
    return user.subscription_tier === tierMap[plan.name] && 
           user.subscription_status === 'active';
  };

  const calculateDaysRemaining = () => {
    if (!user?.subscription_end) return 0;
    const end = new Date(user.subscription_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleLogout = () => {
    localStorage.removeItem('student_user');
    localStorage.removeItem('student_session');
    localStorage.removeItem('student_phone');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a5f7a]/30 border-t-[#1a5f7a] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

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
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-2 text-gray-600">
                  <span>مرحباً،</span>
                  <span className="font-bold text-[#1a5f7a]">{user.name}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-500 transition-colors text-sm"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Current Subscription Banner */}
        {user && user.subscription_status === 'active' && calculateDaysRemaining() > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">اشتراكك الحالي</h3>
                    <p className="text-white/80">
                      الباقة {user.subscription_tier === 'basic' ? 'الأساسية' : 'المميزة'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{calculateDaysRemaining()}</div>
                  <div className="text-white/80 text-sm">يوم متبقي</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-[#1a5f7a] px-5 py-2 rounded-full mb-6 font-semibold text-sm">
            الاشتراكات
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            اختر الباقة المناسبة لك
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            استثمر في مستقبلك التعليمي مع باقاتنا المتنوعة
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const isCurrent = isCurrentPlan(plan);
              const isProcessing = processingPlan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 ${
                    isCurrent ? 'ring-4 ring-green-500' : ''
                  }`}
                >
                  {/* Plan Header */}
                  <div className={`bg-gradient-to-r ${getPlanGradient(index)} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        {getPlanIcon(index)}
                      </div>
                      {isCurrent && (
                        <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                          باقتك الحالية
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-white/80 text-sm">{plan.description}</p>
                  </div>

                  {/* Plan Body */}
                  <div className="p-6">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-xl text-gray-600">ريال</span>
                      </div>
                      <p className="text-gray-500 mt-1">لمدة {plan.duration_days} يوم</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Subscribe Button */}
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed"
                      >
                        ✓ باقتك الحالية
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessing}
                        className={`w-full bg-gradient-to-r ${getPlanGradient(index)} text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            جاري التحويل...
                          </span>
                        ) : user?.subscription_status === 'active' && calculateDaysRemaining() > 0 ? (
                          `ترقية + ${plan.duration_days} يوم`
                        ) : (
                          'اشترك الآن'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Shield className="w-10 h-10 text-[#1a5f7a] mx-auto mb-3" />
              <p className="font-semibold text-gray-800">دفع آمن</p>
              <p className="text-sm text-gray-500">عبر Moyasar</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Zap className="w-10 h-10 text-[#f9a825] mx-auto mb-3" />
              <p className="font-semibold text-gray-800">تفعيل فوري</p>
              <p className="text-sm text-gray-500">بعد الدفع مباشرة</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <CreditCard className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">طرق دفع متعددة</p>
              <p className="text-sm text-gray-500">مدى، فيزا، ماستركارد</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Crown className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">محتوى حصري</p>
              <p className="text-sm text-gray-500">دروس ومعلم ذكي</p>
            </div>
          </div>
        </div>

        {/* Back to App Note */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <p className="text-gray-700">
              <span className="font-bold text-[#1a5f7a]">ملاحظة:</span> بعد إتمام الدفع، ارجع للتطبيق للاستمتاع بجميع المميزات
            </p>
          </div>
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
