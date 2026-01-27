'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpen, 
  Brain, 
  BarChart3, 
  Star, 
  Users, 
  Video, 
  Phone, 
  Mail, 
  MessageCircle, 
  Instagram, 
  Twitter,
  ChevronDown,
  Sparkles,
  Award,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface AboutSection {
  title: string;
  description: string;
  image_url?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Testimonial {
  id: string;
  customer_name: string;
  customer_role?: string;
  rating: number;
  comment: string;
  avatar_url?: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

interface SiteSettings {
  logo_url?: string;
  site_name: string;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export default function LandingPage() {
  const [about, setAbout] = useState<AboutSection | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aboutRes, faqsRes, testimonialsRes, contactRes, featuresRes, settingsRes] = await Promise.all([
        supabase
          .from('about_section')
          .select('*')
          .single(),
        supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('order_index'),
        supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('order_index'),
        supabase
          .from('contact_info')
          .select('*')
          .single(),
        supabase
          .from('features')
          .select('*')
          .eq('is_active', true)
          .order('order_index'),
        supabase
          .from('site_settings')
          .select('*')
          .single()
      ]);

      if (aboutRes.data) setAbout(aboutRes.data);
      if (faqsRes.data) setFaqs(faqsRes.data);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data);
      if (contactRes.data) setContact(contactRes.data);
      if (featuresRes.data) setFeatures(featuresRes.data);
      if (settingsRes.data) setSiteSettings(settingsRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50" dir="rtl">
      {/* Header/Navbar */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              {siteSettings?.logo_url ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.site_name || 'بيت القدرات'} 
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#1a5f7a] to-[#2c5f7a] rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-12 transition-all duration-300">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              )}
              <span className="text-2xl font-bold text-gray-800">{siteSettings?.site_name || 'بيت القدرات'}</span>
            </div>
            <div className="hidden md:flex space-x-8 space-x-reverse items-center">
              <a href="#about" className="text-gray-600 hover:text-[#1a5f7a] transition-colors text-sm font-medium">من نحن</a>
              <a href="#features" className="text-gray-600 hover:text-[#1a5f7a] transition-colors text-sm font-medium">الميزات</a>
              <a href="#faq" className="text-gray-600 hover:text-[#1a5f7a] transition-colors text-sm font-medium">أسئلة شائعة</a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#1a5f7a] transition-colors text-sm font-medium">التقييمات</a>
              <a href="/login" className="bg-gradient-to-r from-[#1a5f7a] to-[#f9a825] text-white px-6 py-2.5 rounded-full hover:shadow-lg transition-all font-medium text-sm">اشترك الآن</a>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-[#1a5f7a] rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute top-40 left-20 w-24 h-24 bg-[#f9a825] rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-[#1a5f7a] rounded-full opacity-10 blur-2xl"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-[#f9a825] rounded-full opacity-15 blur-xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className="space-y-6">
              <div className="inline-block">
                <div className="bg-blue-100 text-[#1a5f7a] px-4 py-2 rounded-full text-sm font-semibold">
                  ✨ المنصة التعليمية الأولى
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                بيت القدرات
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي لتطوير قدرات الطلاب وتحقيق التميز الأكاديمي
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a
                  href="#"
                  className="bg-gradient-to-r from-[#1a5f7a] to-[#2c5f7a] text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  حمّل من App Store
                </a>
                <a
                  href="#"
                  className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Google Play
                </a>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">طالب نشط</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">درس تفاعلي</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">رضا العملاء</div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Illustration Placeholder */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-100 to-orange-100 rounded-3xl p-12 shadow-2xl">
                {/* Floating Cards */}
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1a5f7a] to-[#2c5f7a] rounded-xl flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">دروس تفاعلية</div>
                        <div className="text-sm text-gray-600">محتوى تعليمي عالي الجودة</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all mr-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#f9a825] to-[#ffa726] rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">معلم ذكي AI</div>
                        <div className="text-sm text-gray-600">مساعد ذكي متاح 24/7</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1a5f7a] to-[#f9a825] rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">تقارير تفصيلية</div>
                        <div className="text-sm text-gray-600">تتبع تقدمك بدقة</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative circles */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#f9a825] rounded-full opacity-40"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#1a5f7a] rounded-full opacity-40"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      {about && (
        <section id="about" className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#1a5f7a] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#f9a825] rounded-full opacity-15 blur-3xl"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-block bg-blue-100 text-[#1a5f7a] px-5 py-2 rounded-full mb-6 font-semibold text-sm">
                  من نحن
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{about.title}</h2>
              </div>
              <div className="bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50 p-10 md:p-16 rounded-3xl shadow-2xl">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
                  {about.description}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {features.length > 0 && (
        <section id="features" className="py-20 bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block bg-blue-100 text-[#1a5f7a] px-5 py-2 rounded-full mb-6 font-semibold text-sm">
                الميزات
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">لماذا بيت القدرات؟</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">نقدم لك أفضل الأدوات والتقنيات لتحقيق التميز الأكاديمي</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const getIcon = (iconName: string) => {
                  const iconProps = { className: "w-8 h-8" };
                  switch(iconName) {
                    case 'video': return <Video {...iconProps} />;
                    case 'quiz': return <BookOpen {...iconProps} />;
                    case 'ai': return <Brain {...iconProps} />;
                    case 'chart': return <BarChart3 {...iconProps} />;
                    case 'star': return <Star {...iconProps} />;
                    case 'parent': return <Users {...iconProps} />;
                    default: return <Sparkles {...iconProps} />;
                  }
                };
                
                const gradients = [
                  'from-[#1a5f7a] to-[#2c5f7a]',
                  'from-[#f9a825] to-[#ffa726]',
                  'from-[#1a5f7a] to-[#f9a825]',
                  'from-[#2c5f7a] to-[#1a5f7a]',
                  'from-[#ffa726] to-[#f9a825]',
                  'from-[#1a5f7a] to-[#ffa726]'
                ];
                
                return (
                  <div
                    key={feature.id}
                    className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradients[index % gradients.length]} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                      {getIcon(feature.icon || 'star')}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section id="faq" className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#1a5f7a] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-[#f9a825] rounded-full opacity-15 blur-3xl"></div>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 relative z-10">
              <div className="inline-block bg-orange-100 text-orange-600 px-5 py-2 rounded-full mb-6 font-semibold text-sm">
                الأسئلة الشائعة
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">لديك أسئلة؟</h2>
              <p className="text-xl text-gray-600">إليك الإجابات على أكثر الأسئلة شيوعاً</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4 relative z-10">
              {faqs.map((faq, index) => (
                <details
                  key={faq.id}
                  className="group bg-white p-7 rounded-2xl shadow-lg hover:shadow-2xl transition-all"
                >
                  <summary className="text-xl font-bold text-gray-900 cursor-pointer flex items-center justify-between">
                    <span>{faq.question}</span>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-open:bg-[#1a5f7a] transition-colors">
                      <ChevronDown className="w-5 h-5 text-[#1a5f7a] group-open:text-white transform group-open:rotate-180 transition-all" />
                    </div>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed pr-6">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full mb-6 font-semibold text-sm">
                التقييمات
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">ماذا يقول عملاؤنا؟</h2>
              <p className="text-xl text-gray-600">آراء حقيقية من طلاب وأولياء أمور راضين</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => {
                const avatarGradients = [
                  'from-[#1a5f7a] to-[#2c5f7a]',
                  'from-[#f9a825] to-[#ffa726]',
                  'from-[#1a5f7a] to-[#f9a825]'
                ];
                
                return (
                  <div
                    key={testimonial.id}
                    className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${avatarGradients[index % avatarGradients.length]} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {testimonial.customer_name.charAt(0)}
                      </div>
                      <div className="mr-4">
                        <h4 className="font-bold text-gray-900 text-lg">{testimonial.customer_name}</h4>
                        {testimonial.customer_role && (
                          <p className="text-sm text-gray-600">
                            {testimonial.customer_role}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex mb-4 gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed">"{testimonial.comment}"</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {contact && (
        <section id="contact" className="py-20 bg-gradient-to-br from-[#1a5f7a] via-[#2c5f7a] to-[#1a5f7a] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#f9a825] rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full mb-6 font-semibold text-sm border border-white/30">
                تواصل معنا
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">نحن هنا لمساعدتك</h2>
              <p className="text-xl text-white/90">تواصل معنا في أي وقت، نحن سعداء بخدمتك</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {contact.phone && (
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                      <Phone className="w-7 h-7 text-[#1a5f7a]" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">الهاتف</h3>
                    <p className="text-white/90 text-lg">{contact.phone}</p>
                  </div>
                )}
                {contact.email && (
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                      <Mail className="w-7 h-7 text-[#f9a825]" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">البريد الإلكتروني</h3>
                    <p className="text-white/90 text-lg break-all">{contact.email}</p>
                  </div>
                )}
                {contact.whatsapp && (
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                      <MessageCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">واتساب</h3>
                    <p className="text-white/90 text-lg">{contact.whatsapp}</p>
                  </div>
                )}
                {(contact.instagram || contact.twitter || contact.tiktok) && (
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
                      <Instagram className="w-7 h-7 text-[#1a5f7a]" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">وسائل التواصل</h3>
                    <div className="space-y-2 text-white/90">
                      {contact.instagram && (
                        <p className="flex items-center gap-2">
                          <Instagram className="w-4 h-4" />
                          {contact.instagram}
                        </p>
                      )}
                      {contact.twitter && (
                        <p className="flex items-center gap-2">
                          <Twitter className="w-4 h-4" />
                          {contact.twitter}
                        </p>
                      )}
                      {contact.tiktok && (
                        <p className="flex items-center gap-2">
                          <span className="text-sm">TikTok:</span>
                          {contact.tiktok}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-600 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center gap-3">
              {siteSettings?.logo_url ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.site_name || 'بيت القدرات'} 
                  className="w-[100px] h-[100px] object-contain"
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-gradient-to-br from-[#1a5f7a] to-[#f9a825] rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-32 h-32 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-gray-800">{siteSettings?.site_name || 'بيت القدرات'}</span>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">روابط مهمة</h3>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-600 hover:text-[#1a5f7a] transition-colors">
                  الشروط والأحكام
                </Link>
                <Link href="/privacy" className="block text-gray-600 hover:text-[#1a5f7a] transition-colors">
                  سياسة الخصوصية
                </Link>
                <Link href="/refund" className="block text-gray-600 hover:text-[#1a5f7a] transition-colors">
                  سياسة الاسترجاع
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-4">تواصل معنا</h3>
              <div className="space-y-2 text-sm">
                {contact?.email && (
                  <p className="text-gray-600">{contact.email}</p>
                )}
                {contact?.phone && (
                  <p className="text-gray-600">{contact.phone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-500">
              © 2026 {siteSettings?.site_name || 'بيت القدرات'}. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
