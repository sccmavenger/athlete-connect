REVOKE ALL ON FUNCTION public.notify_coaches_of_interest(uuid, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_on_college_interest() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_coaches_on_publish() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_athlete_on_save() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_on_message() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enforce_college_interest_limit() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enforce_guardian_consent() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;