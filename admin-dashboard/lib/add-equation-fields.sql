-- إضافة حقول المعادلات لجدول questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS equation_latex TEXT,
ADD COLUMN IF NOT EXISTS equation_image_url TEXT;

-- إضافة حقول المعادلات لجدول exam_questions
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS equation_latex TEXT,
ADD COLUMN IF NOT EXISTS equation_image_url TEXT;

-- إضافة حقول المعادلات لجدول question_variants
ALTER TABLE question_variants 
ADD COLUMN IF NOT EXISTS equation_latex TEXT,
ADD COLUMN IF NOT EXISTS equation_image_url TEXT;

-- إنشاء bucket للمعادلات في Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('equations', 'equations', true)
ON CONFLICT (id) DO NOTHING;

-- السماح برفع الصور للجميع (يمكن تقييده لاحقاً)
CREATE POLICY "Allow public uploads to equations bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'equations');

-- السماح بقراءة الصور للجميع
CREATE POLICY "Allow public reads from equations bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'equations');
