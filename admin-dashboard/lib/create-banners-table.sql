-- جدول البانرات الإعلانية
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  event_start_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء index للبانرات النشطة
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, order_number);

-- إضافة RLS policies
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة البانرات النشطة
CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (is_active = true);

-- السماح للمستخدمين المسجلين بإدارة البانرات
CREATE POLICY "Authenticated users can manage banners"
  ON banners FOR ALL
  USING (auth.uid() IS NOT NULL);

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_updated_at();
