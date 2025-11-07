-- Create table to store wrong answers for review
CREATE TABLE IF NOT EXISTS public.quiz_mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_result_id uuid REFERENCES public.quiz_results(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL,
  user_answer text,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  subject text NOT NULL,
  grade text NOT NULL,
  is_reviewed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.quiz_mistakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mistakes"
  ON public.quiz_mistakes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mistakes"
  ON public.quiz_mistakes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mistakes"
  ON public.quiz_mistakes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mistakes"
  ON public.quiz_mistakes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_quiz_mistakes_user_id ON public.quiz_mistakes(user_id);
CREATE INDEX idx_quiz_mistakes_subject ON public.quiz_mistakes(subject);
CREATE INDEX idx_quiz_mistakes_reviewed ON public.quiz_mistakes(is_reviewed);