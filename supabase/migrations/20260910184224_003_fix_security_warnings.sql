/*
# Fix security warnings on trigger functions

## Changes
1. Revoke EXECUTE on handle_new_user from anon and authenticated (it's a trigger, not meant to be called via RPC)
2. Set search_path on update_updated_at function
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
