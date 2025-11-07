-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.mistake_statistics;

CREATE OR REPLACE VIEW public.mistake_statistics 
WITH (security_invoker = true)
AS
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