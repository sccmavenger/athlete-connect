REVOKE ALL ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_guardian_consent() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_athlete_manager(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_athlete_manager(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.notify_athlete_on_save() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;