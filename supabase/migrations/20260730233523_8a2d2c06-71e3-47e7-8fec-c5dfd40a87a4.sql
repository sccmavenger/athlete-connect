CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  role_intent TEXT;
  display_name_val TEXT;
BEGIN
  role_intent := COALESCE(NEW.raw_user_meta_data->>'role_intent', 'athlete');
  display_name_val := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, display_name_val, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF role_intent = 'coach' THEN
    INSERT INTO public.coach_requests (user_id, full_name, email, college, title, message)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', display_name_val),
      NEW.email,
      NEW.raw_user_meta_data->>'college',
      NEW.raw_user_meta_data->>'title',
      NEW.raw_user_meta_data->>'message'
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF role_intent = 'parent' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'athlete')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;