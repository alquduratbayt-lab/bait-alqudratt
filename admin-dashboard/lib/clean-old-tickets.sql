-- حذف التذاكر القديمة التي تحتوي على URLs خاطئة

DELETE FROM tickets 
WHERE image_url LIKE 'https://%';

-- أو إذا أردت تحديث الـ image_url بدلاً من الحذف:
-- UPDATE tickets 
-- SET image_url = NULL 
-- WHERE image_url LIKE 'https://%';
