-- إضافة حقل صورة السؤال في جدول questions
ALTER TABLE questions 
ADD COLUMN question_image_url TEXT;

-- إضافة حقل صورة السؤال في جدول exam_questions (إذا كان موجود)
ALTER TABLE exam_questions 
ADD COLUMN question_image_url TEXT;

-- إضافة حقل صورة في جدول question_variants
ALTER TABLE question_variants 
ADD COLUMN question_image_url TEXT;
