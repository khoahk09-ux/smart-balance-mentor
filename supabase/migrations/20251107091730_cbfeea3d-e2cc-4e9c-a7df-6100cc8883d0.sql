-- Create review schedule table for spaced repetition
CREATE TABLE IF NOT EXISTS public.mistake_review_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mistake_id UUID NOT NULL REFERENCES public.quiz_mistakes(id) ON DELETE CASCADE,
  review_round INTEGER NOT NULL CHECK (review_round BETWEEN 1 AND 4),
  scheduled_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mistake_id, review_round)
);

-- Create index for efficient queries
CREATE INDEX idx_review_schedule_user_date ON public.mistake_review_schedule(user_id, scheduled_date, completed);
CREATE INDEX idx_review_schedule_mistake ON public.mistake_review_schedule(mistake_id);

-- Enable RLS
ALTER TABLE public.mistake_review_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own review schedule"
ON public.mistake_review_schedule FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review schedule"
ON public.mistake_review_schedule FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review schedule"
ON public.mistake_review_schedule FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review schedule"
ON public.mistake_review_schedule FOR DELETE
USING (auth.uid() = user_id);

-- Create function to auto-generate review schedule when mistake is created
CREATE OR REPLACE FUNCTION public.create_review_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule 4 review rounds using spaced repetition
  INSERT INTO public.mistake_review_schedule (user_id, mistake_id, review_round, scheduled_date)
  VALUES 
    (NEW.user_id, NEW.id, 1, (NEW.created_at::date + INTERVAL '1 day')::date),
    (NEW.user_id, NEW.id, 2, (NEW.created_at::date + INTERVAL '3 days')::date),
    (NEW.user_id, NEW.id, 3, (NEW.created_at::date + INTERVAL '7 days')::date),
    (NEW.user_id, NEW.id, 4, (NEW.created_at::date + INTERVAL '14 days')::date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create review schedule
CREATE TRIGGER trigger_create_review_schedule
AFTER INSERT ON public.quiz_mistakes
FOR EACH ROW
EXECUTE FUNCTION public.create_review_schedule();

-- Add daily review stats tracking
CREATE TABLE IF NOT EXISTS public.daily_review_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  review_date DATE NOT NULL,
  mistakes_reviewed INTEGER NOT NULL DEFAULT 0,
  mistakes_fixed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_date)
);

CREATE INDEX idx_daily_review_stats_user_date ON public.daily_review_stats(user_id, review_date);

ALTER TABLE public.daily_review_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily stats"
ON public.daily_review_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats"
ON public.daily_review_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
ON public.daily_review_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating daily stats
CREATE OR REPLACE FUNCTION public.update_daily_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    INSERT INTO public.daily_review_stats (user_id, review_date, mistakes_reviewed, mistakes_fixed)
    VALUES (NEW.user_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (user_id, review_date)
    DO UPDATE SET
      mistakes_reviewed = daily_review_stats.mistakes_reviewed + 1,
      mistakes_fixed = daily_review_stats.mistakes_fixed + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_daily_review_stats
AFTER UPDATE ON public.mistake_review_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_review_stats();