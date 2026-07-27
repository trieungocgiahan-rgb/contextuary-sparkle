
-- SAT words additions
ALTER TABLE public.sat_words
  ADD COLUMN IF NOT EXISTS part_of_speech text,
  ADD COLUMN IF NOT EXISTS example_sentences text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collocations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS synonyms text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS suggested_correction text;

-- Words (user library) additions
ALTER TABLE public.words
  ADD COLUMN IF NOT EXISTS part_of_speech text;

-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_timer boolean NOT NULL DEFAULT true;

-- User roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- AI challenge cache
CREATE TABLE IF NOT EXISTS public.ai_challenge_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cache_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_challenge_cache TO authenticated;
GRANT ALL ON public.ai_challenge_cache TO service_role;
ALTER TABLE public.ai_challenge_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own cache" ON public.ai_challenge_cache FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin RPCs for seed review
CREATE OR REPLACE FUNCTION public.admin_flag_sat_word(_id uuid, _reason text, _suggestion text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.sat_words
     SET needs_review = true, review_reason = _reason, suggested_correction = _suggestion
   WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_sat_word(_id uuid, _action text, _new_word text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _action = 'delete' THEN
    DELETE FROM public.sat_words WHERE id = _id;
  ELSIF _action = 'approve' THEN
    UPDATE public.sat_words
       SET needs_review = false, review_reason = NULL, suggested_correction = NULL
     WHERE id = _id;
  ELSIF _action = 'replace' THEN
    UPDATE public.sat_words
       SET word = lower(_new_word),
           needs_review = false, review_reason = NULL, suggested_correction = NULL,
           pronunciation = NULL, vietnamese_meaning = NULL, example_sentence = NULL,
           memory_hint = NULL, part_of_speech = NULL,
           example_sentences = '{}', collocations = '{}', synonyms = '{}'
     WHERE id = _id;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_flag_sat_word(uuid, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_sat_word(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_flag_sat_word(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_resolve_sat_word(uuid, text, text) TO authenticated, service_role;

-- List needs-review words (admin-callable RPC — inside function we check role)
CREATE OR REPLACE FUNCTION public.admin_list_review_words()
RETURNS TABLE(id uuid, word text, review_reason text, suggested_correction text, frequency_rank int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT s.id, s.word, s.review_reason, s.suggested_correction, s.frequency_rank
      FROM public.sat_words s
     WHERE s.needs_review = true
     ORDER BY s.frequency_rank NULLS LAST, s.word;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_list_review_words() TO authenticated;

-- Wrap resolve with role check
CREATE OR REPLACE FUNCTION public.admin_resolve_sat_word(_id uuid, _action text, _new_word text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _action = 'delete' THEN
    DELETE FROM public.sat_words WHERE id = _id;
  ELSIF _action = 'approve' THEN
    UPDATE public.sat_words
       SET needs_review = false, review_reason = NULL, suggested_correction = NULL
     WHERE id = _id;
  ELSIF _action = 'replace' THEN
    UPDATE public.sat_words
       SET word = lower(_new_word),
           needs_review = false, review_reason = NULL, suggested_correction = NULL,
           pronunciation = NULL, vietnamese_meaning = NULL, example_sentence = NULL,
           memory_hint = NULL, part_of_speech = NULL,
           example_sentences = '{}', collocations = '{}', synonyms = '{}'
     WHERE id = _id;
  END IF;
END $$;
