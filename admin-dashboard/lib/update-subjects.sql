-- إضافة حقول جديدة لجدول subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS icon_url TEXT;
