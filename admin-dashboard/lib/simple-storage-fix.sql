-- حل بسيط: تعطيل RLS على storage.objects مؤقتاً للـ rewards bucket
-- هذا سيسمح برفع الصور بدون مشاكل

-- أولاً: حذف جميع policies المتعلقة بـ rewards
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname ILIKE '%reward%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- ثانياً: إنشاء policy واحدة بسيطة تسمح بكل شيء للـ rewards bucket
CREATE POLICY "Allow all operations on rewards bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'rewards')
WITH CHECK (bucket_id = 'rewards');
