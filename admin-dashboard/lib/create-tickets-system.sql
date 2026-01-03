-- جدول التذاكر
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  problem_type VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'جديدة',
  priority VARCHAR(50) DEFAULT 'عادية',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies للجدول
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- المستخدمون يمكنهم رؤية تذاكرهم فقط
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء تذاكر
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- الأدمن يمكنه رؤية وتعديل جميع التذاكر
CREATE POLICY "Service role full access on tickets" ON tickets
  FOR ALL USING (true);

-- Storage Policies
CREATE POLICY "Anyone can view ticket images" ON storage.objects
  FOR SELECT USING (bucket_id = 'tickets');

CREATE POLICY "Authenticated users can upload ticket images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tickets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own ticket images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tickets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own ticket images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tickets' AND
    auth.role() = 'authenticated'
  );

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'محلولة' AND OLD.status != 'محلولة' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
