-- إنشاء جدول لحظات الهدوء
CREATE TABLE IF NOT EXISTS calm_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('verse', 'dua', 'azkar', 'video')),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  video_file TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة بيانات تجريبية
INSERT INTO calm_moments (type, title, content, order_index)
VALUES 
  ('verse', 'آية اليوم', '"وَقُل رَّبِّ زِدْنِي عِلْمًا" - [طه: 114]', 1),
  ('dua', 'دعاء اليوم', 'اللهم إني أسألك فهم النبيين، وحفظ المرسلين، والملائكة المقربين. اللهم اجعل لساني عامراً بذكرك، وقلبي بخشيتك، وسري بطاعتك، إنك على كل شيء قدير.', 2),
  ('azkar', 'الأذكار المفضلة', 'أصبحنا وأصبح الملك لله، والحمد لله...

رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً.

اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور', 3),
  ('video', 'تحفيز للدراسة', NULL, 4)
ON CONFLICT DO NOTHING;

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_calm_moments_type ON calm_moments(type);
CREATE INDEX IF NOT EXISTS idx_calm_moments_is_active ON calm_moments(is_active);
CREATE INDEX IF NOT EXISTS idx_calm_moments_order ON calm_moments(order_index);
