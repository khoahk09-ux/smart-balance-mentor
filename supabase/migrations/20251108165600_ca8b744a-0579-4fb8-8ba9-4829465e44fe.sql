-- Create schedule table
CREATE TABLE public.schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  subject text NOT NULL,
  task text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedule
CREATE POLICY "Users can view their own schedule"
  ON public.schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule"
  ON public.schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule"
  ON public.schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule"
  ON public.schedule FOR DELETE
  USING (auth.uid() = user_id);

-- Create grades table
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  score numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- RLS policies for grades
CREATE POLICY "Users can view their own grades"
  ON public.grades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grades"
  ON public.grades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades"
  ON public.grades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades"
  ON public.grades FOR DELETE
  USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  time timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.achievements FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_schedule_user_date ON public.schedule(user_id, date);
CREATE INDEX idx_grades_user_score ON public.grades(user_id, score);
CREATE INDEX idx_achievements_user_time ON public.achievements(user_id, time);