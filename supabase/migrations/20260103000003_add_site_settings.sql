-- إنشاء جدول الإعدادات العامة للموقع
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url TEXT,
  site_name TEXT DEFAULT 'بيت القدرات',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج سطر واحد فقط (singleton pattern)
INSERT INTO site_settings (id, site_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'بيت القدرات')
ON CONFLICT (id) DO NOTHING;

-- تفعيل RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع
CREATE POLICY "Allow public read access on site_settings" 
ON site_settings FOR SELECT 
USING (true);

-- السماح بالتعديل للجميع (سيتم تقييده بـ service role في الكود)
CREATE POLICY "Allow admin full access on site_settings" 
ON site_settings FOR ALL 
USING (true)
WITH CHECK (true);

-- إنشاء bucket للشعارات في Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- السماح بالقراءة للجميع من bucket الشعارات
CREATE POLICY "Public Access to logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- السماح بالرفع والتعديل للجميع (سيتم تقييده بـ service role)
CREATE POLICY "Allow upload to logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow update to logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos');

CREATE POLICY "Allow delete from logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos');
