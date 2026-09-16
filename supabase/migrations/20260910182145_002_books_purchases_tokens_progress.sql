/*
# Create books, purchases, access_tokens, reading_progress tables

## Overview
Creates the remaining core tables for the e-book platform.

## New Tables
1. `books` — book catalog with metadata, pricing, private file paths
2. `purchases` — purchase records linked to Stripe payments
3. `access_tokens` — hashed secure tokens for book reading access
4. `reading_progress` — per-user reading progress per book

## Security
- RLS enabled on ALL tables
- Public can read published books only; admins can read all
- Purchases: users see own (by user_id or email), admins see all
- Access tokens: admin read only, no client write (service role only)
- Reading progress: users manage own, admins read all
*/

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text,
  description text NOT NULL,
  long_description text,
  author text NOT NULL,
  author_bio text,
  price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  cover_url text,
  private_file_path text,
  sample_file_path text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  pages int,
  language text NOT NULL DEFAULT 'English',
  publication_date date,
  format text NOT NULL DEFAULT 'PDF',
  what_you_learn text[],
  who_for text,
  table_of_contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_published ON books(published);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_books_public" ON books;
CREATE POLICY "read_published_books_public" ON books FOR SELECT
  TO anon, authenticated USING (published = true);

DROP POLICY IF EXISTS "admin_read_all_books" ON books;
CREATE POLICY "admin_read_all_books" ON books FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_books" ON books;
CREATE POLICY "admin_insert_books" ON books FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_books" ON books;
CREATE POLICY "admin_update_books" ON books FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_books" ON books;
CREATE POLICY "admin_delete_books" ON books FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  email text NOT NULL,
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_id text,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_book ON purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_purchases" ON purchases;
CREATE POLICY "read_own_purchases" ON purchases FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_purchases" ON purchases;
CREATE POLICY "admin_insert_purchases" ON purchases FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_purchases" ON purchases;
CREATE POLICY "admin_update_purchases" ON purchases FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- ACCESS TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  email text NOT NULL,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_hash ON access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_access_tokens_book ON access_tokens(book_id);

ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_access_tokens" ON access_tokens;
CREATE POLICY "admin_read_access_tokens" ON access_tokens FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- READING PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  current_page int NOT NULL DEFAULT 1,
  progress_percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_unique
  ON reading_progress(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), book_id);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_progress" ON reading_progress;
CREATE POLICY "read_own_progress" ON reading_progress FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_progress" ON reading_progress;
CREATE POLICY "insert_own_progress" ON reading_progress FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR email = (SELECT email FROM profiles WHERE profiles.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_progress" ON reading_progress;
CREATE POLICY "update_own_progress" ON reading_progress FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM profiles WHERE profiles.id = auth.uid())
  ) WITH CHECK (
    auth.uid() = user_id
    OR email = (SELECT email FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================
-- TRIGGER: Update updated_at on books
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS books_updated_at ON books;
CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
