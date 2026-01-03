-- جعل الحقول التي تتعلق بالامتحان تقبل null في جدول student_progress
-- لأن الطالب قد يكون في منتصف الدرس ولم يكمل الامتحان بعد

ALTER TABLE student_progress 
ALTER COLUMN exam_score DROP NOT NULL;

ALTER TABLE student_progress 
ALTER COLUMN total_questions DROP NOT NULL;
