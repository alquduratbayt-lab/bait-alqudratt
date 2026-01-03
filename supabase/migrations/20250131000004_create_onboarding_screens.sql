-- Create onboarding_screens table
-- This table stores the onboarding screens data (images, titles, descriptions)

CREATE TABLE IF NOT EXISTS public.onboarding_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.onboarding_screens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to onboarding screens" ON public.onboarding_screens;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.onboarding_screens;

-- Policy: Allow public read access (for app)
CREATE POLICY "Allow public read access to onboarding screens"
  ON public.onboarding_screens
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Allow all for authenticated users (for admin dashboard)
CREATE POLICY "Allow all for authenticated users"
  ON public.onboarding_screens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default onboarding screens
INSERT INTO public.onboarding_screens (order_index, title, description, image_url, is_active)
VALUES
  (1, 'مرحباً بك في بيت القدرات', 'منصة تعليمية متكاملة لتطوير قدراتك وتحقيق أهدافك', null, true),
  (2, 'تعلم بطريقة تفاعلية', 'دروس تفاعلية مع أسئلة واختبارات لتعزيز فهمك', null, true),
  (3, 'تابع تقدمك', 'احصل على نقاط ومكافآت وتابع إنجازاتك', null, true)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_screens_order ON public.onboarding_screens(order_index);
CREATE INDEX IF NOT EXISTS idx_onboarding_screens_active ON public.onboarding_screens(is_active);
