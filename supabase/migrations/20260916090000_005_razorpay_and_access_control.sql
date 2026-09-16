/*
# Razorpay payments + real free/paid access control

## Overview
Switches the payment provider from Stripe to Razorpay Payment Links and
closes a gap from migration 004: that migration made every published book
readable by any signed-in user, including paid ones. This migration
restores real gating — free books (price_cents = 0) stay open to any
registered user, paid books require a completed purchase.

## Changes
1. `books.razorpay_payment_link` — the Razorpay Payment Link URL an admin
   pastes in for a paid book. The "Buy Book" button on the storefront opens
   this link directly.
2. `purchases.payment_provider` now defaults to 'razorpay'.
3. `storage.objects` policy on the private `book-content` bucket is
   tightened to admin-only. The `serve-book` edge function streams file
   bytes using the service role key (which bypasses RLS), so client-side
   access to that bucket was never needed for reading — only for admin
   uploads.
*/

ALTER TABLE books ADD COLUMN IF NOT EXISTS razorpay_payment_link text;

ALTER TABLE purchases ALTER COLUMN payment_provider SET DEFAULT 'razorpay';

DROP POLICY IF EXISTS "auth_read_book_content" ON storage.objects;
CREATE POLICY "admin_read_book_content" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'book-content' AND public.is_admin());
