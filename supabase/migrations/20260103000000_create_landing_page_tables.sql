-- جدول معلومات "من نحن"
CREATE TABLE IF NOT EXISTS about_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأسئلة الشائعة
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تقييمات العملاء
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_role TEXT, -- مثل: طالب، ولي أمر
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول معلومات التواصل
CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  address TEXT,
  instagram TEXT,
  twitter TEXT,
  tiktok TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الميزات
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- اسم الأيقونة
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج بيانات افتراضية

-- معلومات "من نحن"
INSERT INTO about_section (title, description) VALUES
('من نحن', 'بيت القدرات هي منصة تعليمية متكاملة تهدف إلى تطوير قدرات الطلاب وتحسين مستواهم الأكاديمي من خلال دروس تفاعلية، اختبارات ذكية، ومعلم ذكي يعمل بتقنية الذكاء الاصطناعي.');

-- أسئلة شائعة
INSERT INTO faqs (question, answer, order_index) VALUES
('ما هو بيت القدرات؟', 'بيت القدرات هي منصة تعليمية شاملة تقدم دروس تفاعلية واختبارات ذكية لتطوير قدرات الطلاب.', 1),
('كيف أسجل في التطبيق؟', 'يمكنك التسجيل من خلال تحميل التطبيق من App Store أو Google Play وإنشاء حساب جديد.', 2),
('هل التطبيق مجاني؟', 'نعم، يوجد باقة مجانية تحتوي على محتوى محدود. كما نوفر باقات مدفوعة بميزات إضافية.', 3),
('كيف أتواصل مع الدعم الفني؟', 'يمكنك التواصل معنا عبر الواتساب أو البريد الإلكتروني الموجود في قسم "تواصل معنا".', 4);

-- تقييمات العملاء
INSERT INTO testimonials (customer_name, customer_role, rating, comment, order_index) VALUES
('أحمد محمد', 'طالب', 5, 'تطبيق رائع ساعدني كثيراً في تحسين مستواي الدراسي. الدروس واضحة والاختبارات مفيدة جداً.', 1),
('فاطمة علي', 'ولي أمر', 5, 'أنصح به بشدة! أبنائي استفادوا كثيراً من المحتوى التعليمي والمعلم الذكي.', 2),
('خالد سعيد', 'طالب', 4, 'تطبيق ممتاز ومنظم. أتمنى إضافة المزيد من المواد الدراسية.', 3);

-- معلومات التواصل
INSERT INTO contact_info (phone, email, whatsapp) VALUES
('+966500000000', 'info@baitalqudrat.com', '+966500000000');

-- الميزات
INSERT INTO features (title, description, icon, order_index) VALUES
('دروس تفاعلية', 'دروس بالفيديو عالية الجودة مع شرح مفصل وواضح', 'video', 1),
('اختبارات ذكية', 'اختبارات تفاعلية لقياس مستوى الفهم والتقدم', 'quiz', 2),
('معلم ذكي AI', 'مساعد ذكي يعمل بالذكاء الاصطناعي للإجابة على أسئلتك', 'ai', 3),
('تقارير تفصيلية', 'تقارير شاملة عن تقدم الطالب وأدائه', 'chart', 4),
('نظام النقاط', 'نظام مكافآت ونقاط لتحفيز الطلاب', 'star', 5),
('متابعة ولي الأمر', 'يمكن لولي الأمر متابعة تقدم أبنائه', 'parent', 6);

-- RLS Policies (للقراءة العامة)
ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع
CREATE POLICY "Allow public read access on about_section" ON about_section FOR SELECT USING (true);
CREATE POLICY "Allow public read access on faqs" ON faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access on testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access on contact_info" ON contact_info FOR SELECT USING (true);
CREATE POLICY "Allow public read access on features" ON features FOR SELECT USING (is_active = true);

-- السماح بالتعديل للـ admins فقط
CREATE POLICY "Allow admin full access on about_section" ON about_section FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.id::text = auth.uid()::text AND admins.is_active = true
  )
);

CREATE POLICY "Allow admin full access on faqs" ON faqs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.id::text = auth.uid()::text AND admins.is_active = true
  )
);

CREATE POLICY "Allow admin full access on testimonials" ON testimonials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.id::text = auth.uid()::text AND admins.is_active = true
  )
);

CREATE POLICY "Allow admin full access on contact_info" ON contact_info FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.id::text = auth.uid()::text AND admins.is_active = true
  )
);

CREATE POLICY "Allow admin full access on features" ON features FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.id::text = auth.uid()::text AND admins.is_active = true
  )
);
