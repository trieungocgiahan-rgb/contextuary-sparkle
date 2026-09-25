
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.word_status AS ENUM ('new', 'learning', 'reviewing', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  daily_goal integer NOT NULL DEFAULT 10,
  theme text NOT NULL DEFAULT 'light',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own tags" ON public.tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Words
CREATE TABLE IF NOT EXISTS public.words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  ipa text,
  vietnamese_meaning text,
  nuance_note text,
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  collocations text[] NOT NULL DEFAULT '{}',
  synonyms text[] NOT NULL DEFAULT '{}',
  antonyms text[] NOT NULL DEFAULT '{}',
  memory_hint text,
  status public.word_status NOT NULL DEFAULT 'new',
  tag_id uuid REFERENCES public.tags(id) ON DELETE SET NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS words_user_created_idx ON public.words (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS words_user_status_idx ON public.words (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.words TO authenticated;
GRANT ALL ON public.words TO service_role;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own words" ON public.words FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'mixed',
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quizzes_user_created_idx ON public.quizzes (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Quiz words
CREATE TABLE IF NOT EXISTS public.quiz_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'mc',
  correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_words_user_created_idx ON public.quiz_words (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_words_word_idx ON public.quiz_words (word_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_words TO authenticated;
GRANT ALL ON public.quiz_words TO service_role;
ALTER TABLE public.quiz_words ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own quiz words" ON public.quiz_words FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_words_updated_at BEFORE UPDATE ON public.words
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Signup trigger: create profile + seed default tags
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.tags (user_id, name, color) VALUES
    (NEW.id, 'Society', 'society'),
    (NEW.id, 'Environment', 'environment'),
    (NEW.id, 'Psychology', 'psychology'),
    (NEW.id, 'Justice', 'justice'),
    (NEW.id, 'Science', 'science'),
    (NEW.id, 'Abstract', 'abstract'),
    (NEW.id, 'Emotion', 'emotion'),
    (NEW.id, 'Academic', 'academic'),
    (NEW.id, 'General', 'general'),
    (NEW.id, 'Nature', 'nature');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
