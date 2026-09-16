-- Ensure administrators can change book pricing and access settings.
-- The SECURITY DEFINER helper avoids recursive profile RLS checks.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "admin_update_books" ON public.books;
CREATE POLICY "admin_update_books" ON public.books
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
