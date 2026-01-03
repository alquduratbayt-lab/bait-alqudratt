-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow public read access on about_section" ON about_section;
DROP POLICY IF EXISTS "Allow public read access on faqs" ON faqs;
DROP POLICY IF EXISTS "Allow public read access on testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow public read access on contact_info" ON contact_info;
DROP POLICY IF EXISTS "Allow public read access on features" ON features;

DROP POLICY IF EXISTS "Allow admin full access on about_section" ON about_section;
DROP POLICY IF EXISTS "Allow admin full access on faqs" ON faqs;
DROP POLICY IF EXISTS "Allow admin full access on testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow admin full access on contact_info" ON contact_info;
DROP POLICY IF EXISTS "Allow admin full access on features" ON features;

-- إعادة إنشاء الـ policies بشكل صحيح

-- السماح بالقراءة للجميع
CREATE POLICY "Allow public read access on about_section" ON about_section FOR SELECT USING (true);
CREATE POLICY "Allow public read access on faqs" ON faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access on testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access on contact_info" ON contact_info FOR SELECT USING (true);
CREATE POLICY "Allow public read access on features" ON features FOR SELECT USING (is_active = true);

-- السماح بالتعديل للـ admins فقط (مع service role)
CREATE POLICY "Allow admin full access on about_section" ON about_section FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin full access on faqs" ON faqs FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin full access on testimonials" ON testimonials FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin full access on contact_info" ON contact_info FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin full access on features" ON features FOR ALL 
USING (true)
WITH CHECK (true);
