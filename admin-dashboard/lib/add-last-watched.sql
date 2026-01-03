-- إضافة حقل لحفظ آخر وقت مشاهدة
ALTER TABLE student_progress 
ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP DEFAULT NOW();

-- إضافة حقل لحفظ موضع الفيديو (بالثواني)
ALTER TABLE student_progress 
ADD COLUMN IF NOT EXISTS video_position INTEGER DEFAULT 0;

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_student_progress_last_watched 
ON student_progress(user_id, last_watched_at DESC);
