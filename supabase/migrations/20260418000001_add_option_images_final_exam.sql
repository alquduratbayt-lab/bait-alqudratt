ALTER TABLE public.subject_final_exam_questions
  ADD COLUMN IF NOT EXISTS option_a_image_url TEXT,
  ADD COLUMN IF NOT EXISTS option_b_image_url TEXT,
  ADD COLUMN IF NOT EXISTS option_c_image_url TEXT,
  ADD COLUMN IF NOT EXISTS option_d_image_url TEXT;
