CREATE OR REPLACE FUNCTION public.admin_upsert_sat_word(_word text, _rank integer)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.sat_words (word, frequency_rank)
  VALUES (lower(_word), _rank)
  ON CONFLICT (word) DO UPDATE SET frequency_rank = EXCLUDED.frequency_rank
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION public.admin_enrich_sat_word(
  _id uuid,
  _pronunciation text,
  _vietnamese_meaning text,
  _example_sentence text,
  _memory_hint text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.sat_words
  SET pronunciation = _pronunciation,
      vietnamese_meaning = _vietnamese_meaning,
      example_sentence = _example_sentence,
      memory_hint = _memory_hint
  WHERE id = _id;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_sat_word(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_enrich_sat_word(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_sat_word(text, integer) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.admin_enrich_sat_word(uuid, text, text, text, text) TO postgres, service_role;