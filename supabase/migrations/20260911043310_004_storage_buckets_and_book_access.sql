/*
# Storage buckets for book covers and content + free book access for registered users

## Changes

### 1. Storage Buckets
- `book-covers` — public bucket for book cover images (uploaded by admins)
- `book-content` — private bucket for book PDF files (uploaded by admins, readable by authenticated users)

### 2. Storage Policies
- `book-covers`: public read, admin-only write
- `book-content`: authenticated read, admin-only write

### 3. Book access change
- All registered (authenticated) users can now read books for free — no purchase required
- The existing purchases/access_tokens system remains for tracking, but is no longer the gate
- Books with a `private_file_path` will be readable by any authenticated user via a signed URL or public path

## Security Notes
- Cover images are public (anyone can view them, which is needed for book listings)
- Book content files are private — only authenticated users can read them
- Only admin users can upload/overwrite/delete files in both buckets
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('book-content', 'book-content', false)
ON CONFLICT (id) DO NOTHING;

-- === book-covers policies (public read, admin write) ===
DROP POLICY IF EXISTS "public_read_book_covers" ON storage.objects;
CREATE POLICY "public_read_book_covers"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "admin_insert_book_covers" ON storage.objects;
CREATE POLICY "admin_insert_book_covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-covers'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_book_covers" ON storage.objects;
CREATE POLICY "admin_update_book_covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  bucket_id = 'book-covers'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_book_covers" ON storage.objects;
CREATE POLICY "admin_delete_book_covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- === book-content policies (authenticated read, admin write) ===
DROP POLICY IF EXISTS "auth_read_book_content" ON storage.objects;
CREATE POLICY "auth_read_book_content"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'book-content');

DROP POLICY IF EXISTS "admin_insert_book_content" ON storage.objects;
CREATE POLICY "admin_insert_book_content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-content'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_book_content" ON storage.objects;
CREATE POLICY "admin_update_book_content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-content'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  bucket_id = 'book-content'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "admin_delete_book_content" ON storage.objects;
CREATE POLICY "admin_delete_book_content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-content'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
