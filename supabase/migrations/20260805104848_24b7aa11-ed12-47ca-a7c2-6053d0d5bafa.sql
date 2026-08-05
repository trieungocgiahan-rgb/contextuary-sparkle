CREATE OR REPLACE FUNCTION public.admin_list_review_words()
 RETURNS TABLE(id uuid, word text, review_reason text, suggested_correction text, frequency_rank integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.word, s.review_reason, s.suggested_correction, s.frequency_rank
    FROM public.sat_words s
   WHERE s.needs_review = true
   ORDER BY s.frequency_rank NULLS LAST, s.word;
$function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_sat_word(_id uuid, _action text, _new_word text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$;

REVOKE ALL ON FUNCTION public.admin_list_review_words() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_resolve_sat_word(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_flag_sat_word(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_enrich_sat_word(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_upsert_sat_word(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_review_words() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_resolve_sat_word(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_flag_sat_word(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_enrich_sat_word(uuid, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_sat_word(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;