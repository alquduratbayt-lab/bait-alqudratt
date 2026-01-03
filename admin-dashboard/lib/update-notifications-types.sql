-- تحديث أنواع الإشعارات لدعم الإشعارات العامة من الإدارة

-- تحديث جدول student_notifications
ALTER TABLE student_notifications 
DROP CONSTRAINT IF EXISTS student_notifications_type_check;

ALTER TABLE student_notifications 
ADD CONSTRAINT student_notifications_type_check 
CHECK (type IN ('study_reminder', 'general', 'admin_notification'));

-- تحديث جدول parent_notifications
ALTER TABLE parent_notifications 
DROP CONSTRAINT IF EXISTS parent_notifications_type_check;

ALTER TABLE parent_notifications 
ADD CONSTRAINT parent_notifications_type_check 
CHECK (type IN ('login', 'lesson_completed', 'exam_completed', 'general', 'admin_notification'));
