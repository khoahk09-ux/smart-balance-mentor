-- Create diemso table
CREATE TABLE IF NOT EXISTS public.diemso (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  mon_hoc TEXT NOT NULL,
  diem FLOAT NOT NULL,
  ngay_cap_nhat DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lichhoc table
CREATE TABLE IF NOT EXISTS public.lichhoc (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  mon_hoc TEXT NOT NULL,
  ngay DATE NOT NULL,
  thoiluong FLOAT NOT NULL,
  trangthai TEXT NOT NULL DEFAULT 'chưa hoàn thành',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thanhtich table
CREATE TABLE IF NOT EXISTS public.thanhtich (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  ten_thanhtich TEXT NOT NULL,
  ngay DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkin table
CREATE TABLE IF NOT EXISTS public.checkin (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  ngay DATE NOT NULL DEFAULT CURRENT_DATE,
  trangthai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.diemso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lichhoc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanhtich ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diemso
CREATE POLICY "Users can view their own diemso"
  ON public.diemso FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diemso"
  ON public.diemso FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diemso"
  ON public.diemso FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diemso"
  ON public.diemso FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for lichhoc
CREATE POLICY "Users can view their own lichhoc"
  ON public.lichhoc FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lichhoc"
  ON public.lichhoc FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lichhoc"
  ON public.lichhoc FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lichhoc"
  ON public.lichhoc FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for thanhtich
CREATE POLICY "Users can view their own thanhtich"
  ON public.thanhtich FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thanhtich"
  ON public.thanhtich FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thanhtich"
  ON public.thanhtich FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thanhtich"
  ON public.thanhtich FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for checkin
CREATE POLICY "Users can view their own checkin"
  ON public.checkin FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkin"
  ON public.checkin FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkin"
  ON public.checkin FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkin"
  ON public.checkin FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.diemso;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lichhoc;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thanhtich;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin;