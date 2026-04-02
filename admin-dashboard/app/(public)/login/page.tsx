'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  Lock, 
  ArrowLeft,
  Sparkles,
  Shield,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface SiteSettings {
  logo_url?: string;
  site_name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettings();
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 10);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.length !== 10 || !phone.startsWith('05')) {
      setError('الرجاء إدخال رقم جوال صحيح يبدأ بـ 05');
      return;
    }

    if (!password || password.length < 6) {
      setError('الرجاء إدخال كلمة المرور (6 أحرف على الأقل)');
      return;
    }

    setLoading(true);

    try {
      // تحويل رقم الهاتف للصيغة المستخدمة في التطبيق
      let formattedPhone = phone.trim().replace(/\s/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      formattedPhone = `+966${formattedPhone}`;
      
      // تحويل لـ email (نفس طريقة التطبيق)
      const email = `${formattedPhone.replace(/\+/g, '')}@bait-alqudratt.temp`;
      
      console.log('🔐 محاولة تسجيل الدخول:');
      console.log('رقم الهاتف المدخل:', phone);
      console.log('رقم الهاتف المنسق:', formattedPhone);
      console.log('Email المستخدم:', email);

      // تسجيل الدخول عبر Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error('Login error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          setError('رقم الجوال أو كلمة المرور غير صحيحة');
        } else {
          setError('حدث خطأ في تسجيل الدخول. الرجاء المحاولة لاحقاً.');
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        console.log('✅ تسجيل الدخول ناجح:', authData.user.id);
        
        // جلب بيانات المستخدم من جدول users بالـ phone
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone', formattedPhone)
          .single();

        console.log('📦 بيانات المستخدم:', userData);
        console.log('❌ خطأ جلب البيانات:', userError);

        if (userError || !userData) {
          // محاولة ثانية بالـ id
          const { data: userData2, error: userError2 } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (userError2 || !userData2) {
            setError('لم يتم العثور على بيانات المستخدم');
            setLoading(false);
            return;
          }
          
          // حفظ معلومات المستخدم
          localStorage.setItem('student_user', JSON.stringify(userData2));
          localStorage.setItem('student_phone', phone);
          console.log('🚀 التوجيه لصفحة الاشتراكات...');
          window.location.href = '/subscribe';
          return;
        }

        // حفظ معلومات المستخدم
        localStorage.setItem('student_user', JSON.stringify(userData));
        localStorage.setItem('student_phone', phone);
        
        console.log('🚀 التوجيه لصفحة الاشتراكات...');
        
        // التوجيه لصفحة الاشتراكات
        window.location.href = '/subscribe';
      } else {
        console.log('⚠️ لا يوجد user في authData');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
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
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1a5f7a] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#f9a825] rounded-full opacity-10 blur-2xl"></div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1a5f7a] to-[#2c5f7a] rounded-3xl flex items-center justify-center shadow-xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-gray-600 text-center mb-8">
              أدخل رقم جوالك وكلمة المرور المسجلة في التطبيق
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-center text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  رقم الجوال
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="05xxxxxxxx"
                    className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl text-lg focus:border-[#1a5f7a] focus:outline-none transition-colors text-left placeholder:text-gray-400"
                    dir="ltr"
                    disabled={loading}
                  />
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a5f7a]" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ادخل كلمة المرور"
                    className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl text-lg focus:border-[#1a5f7a] focus:outline-none transition-colors text-left placeholder:text-gray-400"
                    dir="ltr"
                    disabled={loading}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a5f7a]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a5f7a] hover:text-[#134a5e]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || password.length < 6}
                className="w-full bg-gradient-to-r from-[#1a5f7a] to-[#2c5f7a] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>

          {/* Security Note */}
          <div className="mt-8 flex items-center justify-center gap-3 text-gray-500 text-sm">
            <Shield className="w-5 h-5" />
            <span>بياناتك محمية ومشفرة بالكامل</span>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-700 font-medium">دفع آمن</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-700 font-medium">تفعيل فوري</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
