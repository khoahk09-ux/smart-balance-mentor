-- Add error classification and tracking fields to quiz_mistakes
ALTER TABLE public.quiz_mistakes 
ADD COLUMN IF NOT EXISTS error_type text CHECK (error_type IN ('formula', 'data', 'theory', 'calculation')),
ADD COLUMN IF NOT EXISTS chapter text,
ADD COLUMN IF NOT EXISTS times_repeated integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'medium';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_mistakes_error_type ON public.quiz_mistakes(error_type);
CREATE INDEX IF NOT EXISTS idx_quiz_mistakes_subject_chapter ON public.quiz_mistakes(subject, chapter);

-- Create a view for mistake statistics
CREATE OR REPLACE VIEW public.mistake_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_mistakes,
  COUNT(CASE WHEN is_reviewed = false THEN 1 END) as unreviewed_count,
  COUNT(CASE WHEN times_repeated > 1 THEN 1 END) as repeated_mistakes,
  ROUND(COUNT(CASE WHEN times_repeated > 1 THEN 1 END)::numeric / NULLIF(COUNT(*)::numeric, 0) * 100, 0) as repeat_rate,
  subject,
  COUNT(CASE WHEN error_type = 'formula' THEN 1 END) as formula_errors,
  COUNT(CASE WHEN error_type = 'data' THEN 1 END) as data_errors,
  COUNT(CASE WHEN error_type = 'theory' THEN 1 END) as theory_errors,
  COUNT(CASE WHEN error_type = 'calculation' THEN 1 END) as calculation_errors
FROM public.quiz_mistakes
GROUP BY user_id, subject;

-- Grant access to the view
GRANT SELECT ON public.mistake_statistics TO authenticated;