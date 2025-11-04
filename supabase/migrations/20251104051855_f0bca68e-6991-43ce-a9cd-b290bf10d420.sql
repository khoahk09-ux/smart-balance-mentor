-- Create user_scores table for storing student scores
CREATE TABLE public.user_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grade TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{"tx1": null, "tx2": null, "tx3": null, "tx4": null, "tx5": null, "gk": null, "ck": null}'::jsonb,
  target_score DECIMAL(3,1) DEFAULT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, grade, semester, subject)
);

-- Enable RLS
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scores"
  ON public.user_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON public.user_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON public.user_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores"
  ON public.user_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_scores_user_id ON public.user_scores(user_id);
CREATE INDEX idx_user_scores_lookup ON public.user_scores(user_id, grade, semester, subject);

-- Add trigger for updated_at
CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON public.user_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();