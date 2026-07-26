
-- 1) sat_words: shared bank
CREATE TABLE public.sat_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  pronunciation text,
  vietnamese_meaning text,
  example_sentence text,
  memory_hint text,
  frequency_rank integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sat_words TO anon, authenticated;
GRANT ALL ON public.sat_words TO service_role;
ALTER TABLE public.sat_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sat_words readable by all" ON public.sat_words FOR SELECT USING (true);
CREATE INDEX sat_words_rank_idx ON public.sat_words (frequency_rank);
CREATE TRIGGER sat_words_updated_at BEFORE UPDATE ON public.sat_words
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) daily_progress: per-user, per-local-date counter
CREATE TABLE public.daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  words_added integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_progress TO authenticated;
GRANT ALL ON public.daily_progress TO service_role;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily progress" ON public.daily_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER daily_progress_updated_at BEFORE UPDATE ON public.daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Helper: list next daily-pick words for the caller
CREATE OR REPLACE FUNCTION public.list_daily_picks(_offset int, _limit int)
RETURNS TABLE (
  id uuid,
  word text,
  pronunciation text,
  vietnamese_meaning text,
  example_sentence text,
  memory_hint text,
  frequency_rank int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.word, s.pronunciation, s.vietnamese_meaning,
         s.example_sentence, s.memory_hint, s.frequency_rank
  FROM public.sat_words s
  WHERE s.vietnamese_meaning IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.words w
      WHERE w.user_id = auth.uid()
        AND lower(w.word) = s.word
    )
  ORDER BY s.frequency_rank ASC
  OFFSET GREATEST(_offset, 0)
  LIMIT LEAST(GREATEST(_limit, 1), 100)
$$;
REVOKE ALL ON FUNCTION public.list_daily_picks(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_daily_picks(int, int) TO authenticated;

-- 4) Helper: count remaining picks
CREATE OR REPLACE FUNCTION public.count_daily_picks()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.sat_words s
  WHERE s.vietnamese_meaning IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.words w
      WHERE w.user_id = auth.uid()
        AND lower(w.word) = s.word
    )
$$;
REVOKE ALL ON FUNCTION public.count_daily_picks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_daily_picks() TO authenticated;
