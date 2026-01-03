'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/adminAuth';
import DashboardLayout from '@/components/DashboardLayout';

interface AboutSection {
  id?: string;
  title: string;
  description: string;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
}

interface Testimonial {
  id?: string;
  customer_name: string;
  customer_role: string;
  rating: number;
  comment: string;
  is_active: boolean;
  order_index: number;
}

interface ContactInfo {
  id?: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

interface Feature {
  id?: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  is_active: boolean;
}

interface SiteSettings {
  id?: string;
  logo_url?: string;
  site_name: string;
}

interface LegalPage {
  id?: string;
  page_type: string;
  title: string;
  content: string;
}

export default function LandingPageManagement() {
  const [activeTab, setActiveTab] = useState<'settings' | 'about' | 'features' | 'faqs' | 'testimonials' | 'contact' | 'legal'>('settings');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // About Section
  const [about, setAbout] = useState<AboutSection>({ title: '', description: '' });

  // Features
  const [features, setFeatures] = useState<Feature[]>([]);
  const [newFeature, setNewFeature] = useState<Feature>({
    title: '',
    description: '',
    icon: 'video',
    order_index: 0,
    is_active: true
  });

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newFaq, setNewFaq] = useState<FAQ>({
    question: '',
    answer: '',
    order_index: 0,
    is_active: true
  });

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({
    customer_name: '',
    customer_role: '',
    rating: 5,
    comment: '',
    is_active: true,
    order_index: 0
  });

  // Contact Info
  const [contact, setContact] = useState<ContactInfo>({
    phone: '',
    email: '',
    whatsapp: '',
    instagram: '',
    twitter: '',
    tiktok: ''
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logo_url: '',
    site_name: 'بيت القدرات'
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Legal Pages
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [selectedLegalPage, setSelectedLegalPage] = useState<string>('terms');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'settings') {
        const { data } = await supabaseAdmin.from('site_settings').select('*').single();
        if (data) {
          setSiteSettings(data);
          if (data.logo_url) setLogoPreview(data.logo_url);
        }
      } else if (activeTab === 'about') {
        const { data } = await supabaseAdmin.from('about_section').select('*').single();
        if (data) setAbout(data);
      } else if (activeTab === 'features') {
        const { data } = await supabaseAdmin.from('features').select('*').order('order_index');
        if (data) setFeatures(data);
      } else if (activeTab === 'faqs') {
        const { data } = await supabaseAdmin.from('faqs').select('*').order('order_index');
        if (data) setFaqs(data);
      } else if (activeTab === 'testimonials') {
        const { data } = await supabaseAdmin.from('testimonials').select('*').order('order_index');
        if (data) setTestimonials(data);
      } else if (activeTab === 'contact') {
        const { data } = await supabaseAdmin.from('contact_info').select('*').single();
        if (data) setContact(data);
      } else if (activeTab === 'legal') {
        const { data } = await supabaseAdmin.from('legal_pages').select('*');
        if (data) setLegalPages(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // About Section Handlers
  const handleSaveAbout = async () => {
    setLoading(true);
    try {
      if (about.id) {
        await supabaseAdmin.from('about_section').update(about).eq('id', about.id);
      } else {
        await supabaseAdmin.from('about_section').insert([about]);
      }
      showMessage('success', 'تم حفظ معلومات "من نحن" بنجاح');
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  // Features Handlers
  const handleAddFeature = async () => {
    if (!newFeature.title || !newFeature.description) {
      showMessage('error', 'الرجاء ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await supabaseAdmin.from('features').insert([newFeature]);
      showMessage('success', 'تمت إضافة الميزة بنجاح');
      setNewFeature({ title: '', description: '', icon: 'video', order_index: 0, is_active: true });
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الإضافة');
    }
    setLoading(false);
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الميزة؟')) return;
    setLoading(true);
    try {
      await supabaseAdmin.from('features').delete().eq('id', id);
      showMessage('success', 'تم حذف الميزة بنجاح');
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحذف');
    }
    setLoading(false);
  };

  const handleToggleFeature = async (id: string, is_active: boolean) => {
    setLoading(true);
    try {
      await supabaseAdmin.from('features').update({ is_active: !is_active }).eq('id', id);
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء التحديث');
    }
    setLoading(false);
  };

  // FAQs Handlers
  const handleAddFaq = async () => {
    if (!newFaq.question || !newFaq.answer) {
      showMessage('error', 'الرجاء ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await supabaseAdmin.from('faqs').insert([newFaq]);
      showMessage('success', 'تمت إضافة السؤال بنجاح');
      setNewFaq({ question: '', answer: '', order_index: 0, is_active: true });
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الإضافة');
    }
    setLoading(false);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    setLoading(true);
    try {
      await supabaseAdmin.from('faqs').delete().eq('id', id);
      showMessage('success', 'تم حذف السؤال بنجاح');
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحذف');
    }
    setLoading(false);
  };

  const handleToggleFaq = async (id: string, is_active: boolean) => {
    setLoading(true);
    try {
      await supabaseAdmin.from('faqs').update({ is_active: !is_active }).eq('id', id);
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء التحديث');
    }
    setLoading(false);
  };

  // Testimonials Handlers
  const handleAddTestimonial = async () => {
    if (!newTestimonial.customer_name || !newTestimonial.comment) {
      showMessage('error', 'الرجاء ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await supabaseAdmin.from('testimonials').insert([newTestimonial]);
      showMessage('success', 'تمت إضافة التقييم بنجاح');
      setNewTestimonial({ customer_name: '', customer_role: '', rating: 5, comment: '', is_active: true, order_index: 0 });
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الإضافة');
    }
    setLoading(false);
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    setLoading(true);
    try {
      await supabaseAdmin.from('testimonials').delete().eq('id', id);
      showMessage('success', 'تم حذف التقييم بنجاح');
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحذف');
    }
    setLoading(false);
  };

  const handleToggleTestimonial = async (id: string, is_active: boolean) => {
    setLoading(true);
    try {
      await supabaseAdmin.from('testimonials').update({ is_active: !is_active }).eq('id', id);
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء التحديث');
    }
    setLoading(false);
  };

  // Site Settings Handlers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      let logoUrl = siteSettings.logo_url;

      // رفع اللوقو إذا تم اختيار ملف جديد
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // حفظ الإعدادات
      const settingsData = {
        ...siteSettings,
        logo_url: logoUrl,
        id: '00000000-0000-0000-0000-000000000001'
      };

      await supabaseAdmin.from('site_settings').upsert(settingsData);
      showMessage('success', 'تم حفظ الإعدادات بنجاح');
      setLogoFile(null);
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  // Legal Pages Handlers
  const handleSaveLegalPage = async () => {
    setLoading(true);
    try {
      const page = legalPages.find(p => p.page_type === selectedLegalPage);
      if (page && page.id) {
        await supabaseAdmin.from('legal_pages').update(page).eq('id', page.id);
        showMessage('success', 'تم حفظ الصفحة بنجاح');
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  const updateLegalPageContent = (pageType: string, field: 'title' | 'content', value: string) => {
    setLegalPages(prev => prev.map(page => 
      page.page_type === pageType ? { ...page, [field]: value } : page
    ));
  };

  // Contact Info Handlers
  const handleSaveContact = async () =>{
    setLoading(true);
    try {
      if (contact.id) {
        await supabaseAdmin.from('contact_info').update(contact).eq('id', contact.id);
      } else {
        await supabaseAdmin.from('contact_info').insert([contact]);
      }
      showMessage('success', 'تم حفظ معلومات التواصل بنجاح');
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء الحفظ');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout title="إدارة محتوى الصفحة الرئيسية">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">إدارة محتوى الصفحة الرئيسية</h1>
          <p className="text-gray-600 mt-2">تحكم في محتوى الصفحة الرئيسية للموقع</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4 space-x-reverse">
            {[
              { key: 'settings', label: 'الإعدادات العامة' },
              { key: 'about', label: 'من نحن' },
              { key: 'features', label: 'الميزات' },
              { key: 'faqs', label: 'الأسئلة الشائعة' },
              { key: 'testimonials', label: 'التقييمات' },
              { key: 'contact', label: 'معلومات التواصل' },
              { key: 'legal', label: 'الصفحات القانونية' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading && <div className="text-center py-8">جاري التحميل...</div>}

          {/* Site Settings */}
          {activeTab === 'settings' && !loading && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموقع</label>
                <input
                  type="text"
                  value={siteSettings.site_name}
                  onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="بيت القدرات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شعار الموقع (Logo)</label>
                <div className="space-y-4">
                  {logoPreview && (
                    <div className="flex items-center gap-4">
                      <img src={logoPreview} alt="Logo Preview" className="w-32 h-32 object-contain border border-gray-200 rounded-lg p-2" />
                      <button
                        onClick={() => {
                          setLogoPreview('');
                          setLogoFile(null);
                          setSiteSettings({ ...siteSettings, logo_url: '' });
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        حذف الشعار
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">يفضل استخدام صورة بخلفية شفافة (PNG) بحجم 512x512 بكسل</p>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                حفظ الإعدادات
              </button>
            </div>
          )}

          {/* About Section */}
          {activeTab === 'about' && !loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={about.title}
                  onChange={(e) => setAbout({ ...about, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="من نحن"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={about.description}
                  onChange={(e) => setAbout({ ...about, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب وصف مفصل عن المنصة..."
                />
              </div>
              <button
                onClick={handleSaveAbout}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                حفظ التغييرات
              </button>
            </div>
          )}

          {/* Features Section */}
          {activeTab === 'features' && !loading && (
            <div className="space-y-6">
              {/* Add New Feature */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-lg">إضافة ميزة جديدة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <input
                      type="text"
                      value={newFeature.title}
                      onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="دروس تفاعلية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الأيقونة</label>
                    <select
                      value={newFeature.icon}
                      onChange={(e) => setNewFeature({ ...newFeature, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="video">🎥 دروس (video)</option>
                      <option value="quiz">📚 اختبارات (quiz)</option>
                      <option value="ai">🤖 ذكاء اصطناعي (ai)</option>
                      <option value="chart">📊 تقارير (chart)</option>
                      <option value="star">⭐ نقاط (star)</option>
                      <option value="parent">👥 ولي أمر (parent)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={newFeature.description}
                    onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="وصف الميزة..."
                  />
                </div>
                <button
                  onClick={handleAddFeature}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  إضافة ميزة
                </button>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">الميزات الحالية</h3>
                {features.map((feature) => (
                  <div key={feature.id} className="border border-gray-200 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      <span className="text-xs text-gray-500">الأيقونة: {feature.icon}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeature(feature.id!, feature.is_active)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          feature.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {feature.is_active ? 'نشط' : 'غير نشط'}
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature.id!)}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {activeTab === 'faqs' && !loading && (
            <div className="space-y-6">
              {/* Add New FAQ */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-lg">إضافة سؤال جديد</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السؤال</label>
                  <input
                    type="text"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="ما هو بيت القدرات؟"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الإجابة</label>
                  <textarea
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="الإجابة على السؤال..."
                  />
                </div>
                <button
                  onClick={handleAddFaq}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  إضافة سؤال
                </button>
              </div>

              {/* FAQs List */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">الأسئلة الحالية</h3>
                {faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold flex-1">{faq.question}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFaq(faq.id!, faq.is_active)}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {faq.is_active ? 'نشط' : 'غير نشط'}
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id!)}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials Section */}
          {activeTab === 'testimonials' && !loading && (
            <div className="space-y-6">
              {/* Add New Testimonial */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-lg">إضافة تقييم جديد</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
                    <input
                      type="text"
                      value={newTestimonial.customer_name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, customer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="أحمد محمد"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                    <input
                      type="text"
                      value={newTestimonial.customer_role}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, customer_role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="طالب / ولي أمر"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التقييم (1-5)</label>
                  <select
                    value={newTestimonial.rating}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التعليق</label>
                  <textarea
                    value={newTestimonial.comment}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="تطبيق رائع ساعدني كثيراً..."
                  />
                </div>
                <button
                  onClick={handleAddTestimonial}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  إضافة تقييم
                </button>
              </div>

              {/* Testimonials List */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">التقييمات الحالية</h3>
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold">{testimonial.customer_name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.customer_role}</p>
                        <div className="flex items-center gap-1 my-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <span key={i} className="text-yellow-400">⭐</span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{testimonial.comment}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTestimonial(testimonial.id!, testimonial.is_active)}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            testimonial.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {testimonial.is_active ? 'نشط' : 'غير نشط'}
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id!)}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Pages Section */}
          {activeTab === 'legal' && !loading && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setSelectedLegalPage('terms')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLegalPage === 'terms'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  الشروط والأحكام
                </button>
                <button
                  onClick={() => setSelectedLegalPage('privacy')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLegalPage === 'privacy'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  سياسة الخصوصية
                </button>
                <button
                  onClick={() => setSelectedLegalPage('refund')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLegalPage === 'refund'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  سياسة الاسترجاع
                </button>
              </div>

              {legalPages.find(p => p.page_type === selectedLegalPage) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <input
                      type="text"
                      value={legalPages.find(p => p.page_type === selectedLegalPage)?.title || ''}
                      onChange={(e) => updateLegalPageContent(selectedLegalPage, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المحتوى (يدعم Markdown)</label>
                    <textarea
                      value={legalPages.find(p => p.page_type === selectedLegalPage)?.content || ''}
                      onChange={(e) => updateLegalPageContent(selectedLegalPage, 'content', e.target.value)}
                      rows={20}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="اكتب المحتوى هنا..."
                    />
                    <p className="text-sm text-gray-500 mt-2">يمكنك استخدام Markdown للتنسيق (# للعناوين، ** للنص الغامق، إلخ)</p>
                  </div>
                  <button
                    onClick={handleSaveLegalPage}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Info Section */}
          {activeTab === 'contact' && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="+966500000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="info@baitalqudrat.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">واتساب</label>
                  <input
                    type="text"
                    value={contact.whatsapp}
                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="+966500000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={contact.instagram || ''}
                    onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="@baitalqudrat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="text"
                    value={contact.twitter || ''}
                    onChange={(e) => setContact({ ...contact, twitter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="@baitalqudrat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                  <input
                    type="text"
                    value={contact.tiktok || ''}
                    onChange={(e) => setContact({ ...contact, tiktok: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="@baitalqudrat"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                حفظ التغييرات
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
