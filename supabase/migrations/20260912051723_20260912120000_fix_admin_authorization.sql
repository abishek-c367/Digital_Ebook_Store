/*
# Fix admin authorization checks for book management

1. Overview
- Adds one protected helper that checks whether the signed-in user is an administrator.
- Replaces recursive profile-table checks in catalog, purchase, token, progress, category, and storage policies.
- Keeps profile data private to the signed-in user while preserving administrator access to admin operations.

2. New Database Function
- `public.is_admin()` returns true only when the current authenticated user has `role = 'admin'` in `profiles`.
- The function runs with controlled privileges and a fixed search path so policy checks do not recurse through the profiles table.

3. Security Changes
- Admin-only table policies now use `public.is_admin()`.
- Admin-only storage policies now use `public.is_admin()`.
- Anonymous users cannot execute the helper.
- The existing admin role and all book data are preserved.
*/

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

DROP POLICY IF EXISTS "read_own_profile" ON public.profiles;
CREATE POLICY "read_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_insert_profiles" ON public.profiles;
CREATE POLICY "admin_insert_profiles" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_books" ON public.books;
CREATE POLICY "admin_delete_books" ON public.books FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_books" ON public.books;
CREATE POLICY "admin_insert_books" ON public.books FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_read_all_books" ON public.books;
CREATE POLICY "admin_read_all_books" ON public.books FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_books" ON public.books;
CREATE POLICY "admin_update_books" ON public.books FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_categories" ON public.categories;
CREATE POLICY "admin_delete_categories" ON public.categories FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_categories" ON public.categories;
CREATE POLICY "admin_insert_categories" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_categories" ON public.categories;
CREATE POLICY "admin_update_categories" ON public.categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_purchases" ON public.purchases;
CREATE POLICY "admin_insert_purchases" ON public.purchases FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_purchases" ON public.purchases;
CREATE POLICY "admin_update_purchases" ON public.purchases FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "read_own_purchases" ON public.purchases;
CREATE POLICY "read_own_purchases" ON public.purchases FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "admin_read_access_tokens" ON public.access_tokens;
CREATE POLICY "admin_read_access_tokens" ON public.access_tokens FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "read_own_progress" ON public.reading_progress;
CREATE POLICY "read_own_progress" ON public.reading_progress FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_progress" ON public.reading_progress;
CREATE POLICY "insert_own_progress" ON public.reading_progress FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_progress" ON public.reading_progress;
CREATE POLICY "update_own_progress" ON public.reading_progress FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  ) WITH CHECK (
    auth.uid() = user_id
    OR email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_insert_book_covers" ON storage.objects;
CREATE POLICY "admin_insert_book_covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_book_covers" ON storage.objects;
CREATE POLICY "admin_update_book_covers" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'book-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_book_covers" ON storage.objects;
CREATE POLICY "admin_delete_book_covers" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-covers' AND public.is_admin());

DROP POLICY IF EXISTS "admin_insert_book_content" ON storage.objects;
CREATE POLICY "admin_insert_book_content" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-content' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_book_content" ON storage.objects;
CREATE POLICY "admin_update_book_content" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'book-content' AND public.is_admin())
  WITH CHECK (bucket_id = 'book-content' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_book_content" ON storage.objects;
CREATE POLICY "admin_delete_book_content" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-content' AND public.is_admin());