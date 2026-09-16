# Folio — Digital Ebook Store

A Kindle-style ebook store: browse a catalogue of free and paid books, read them in an
in-browser reader (zoom, page slider, jump-to-page, full screen, no direct download),
buy paid books via Razorpay, and manage everything from an admin console.

Built with React + Vite + TypeScript + Tailwind CSS on the frontend, and Supabase
(Postgres, Auth, Storage, Edge Functions) on the backend.

## What's included

- **Free vs. paid books** — set from the admin book editor, one toggle. Free books are
  open to any signed-in account; paid books require a completed purchase.
- **In-browser reader** — canvas-rendered PDF (not a direct downloadable link), zoom
  in/out, a page slider, a "jump to page" box, full-screen mode, keyboard arrow-key
  navigation, and responsive layout for phone/tablet/desktop.
- **Sign-in required to read** — every reading route checks an authenticated session
  (or a purchase-linked access token) before the reader loads, and the book file is
  streamed through a server function that re-checks ownership on every request —
  never a public/static file URL.
- **Razorpay payments** — admin pastes a Razorpay Payment Link into a book; the "Buy
  Book" button opens it (pre-filled with the buyer's email); after payment the buyer
  lands on a thank-you page and their account is granted access automatically.
- **Admin console** — manage books (with free/paid + Razorpay link), see all orders,
  see paying customers, and a separate **Users** page listing every registered
  account with the ability to add, remove, or promote/demote admin accounts.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run every file in `supabase/migrations/` **in filename order**
   (they're numbered). This creates all tables, row-level security policies, and
   storage buckets.
3. Copy your project URL and anon key into `.env` (copy `.env.example` first):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxx
   ```

## 2. Deploy the edge functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the
project root:

```bash
supabase link --project-ref your-project-ref
supabase functions deploy verify-razorpay-payment
supabase functions deploy razorpay-webhook
supabase functions deploy verify-access
supabase functions deploy request-access-link
supabase functions deploy serve-book
supabase functions deploy admin-users
```

Then set the function secrets (these are **server-side only** — never put them in
`.env`/the client bundle):

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxx
supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxxx
supabase secrets set SITE_URL=https://your-deployed-site.example.com
supabase secrets set RESEND_API_KEY=re_xxxx   # optional, for confirmation emails
```

## 3. Set up Razorpay

1. Create a [Razorpay](https://razorpay.com) account and grab your Key ID / Key
   Secret from **Settings → API Keys**.
2. For **each paid book**, create a Payment Link in **Payment Pages → Payment
   Links** for that book's exact price.
   - In the link's advanced options, set **Redirect URL** to:
     `https://your-deployed-site.example.com/purchase-success`
     This is what sends the buyer back to your site with a signed confirmation —
     without it, buyers land on Razorpay's generic success page instead of your
     thank-you page, and their account won't get access automatically.
   - Copy the link's short URL (e.g. `https://rzp.io/l/xxxxxxxx`) into the book's
     **Razorpay Payment Link** field in the admin book editor.
3. Add a webhook in **Settings → Webhooks**:
   - URL: `https://<your-project-ref>.supabase.co/functions/v1/razorpay-webhook`
   - Events: `payment_link.paid` (and optionally `refund.created`)
   - Copy the **Webhook Secret** shown there into `RAZORPAY_WEBHOOK_SECRET` above.
   - This webhook is the reliable path — it records the purchase server-to-server
     even if a buyer closes their browser right after paying, before the redirect
     back to your site finishes.

## 4. Create the first admin account

1. Sign up for a normal account through the app.
2. In the Supabase SQL editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
   ```
3. Log out and back in. You'll now see **Admin** in the nav. From here on, use
   **Admin → Users** in the app to add or remove other accounts instead of SQL.

## 5. Run it locally

```bash
npm install
npm run dev
```

## How access control works (so you can trust it)

- Free books (price = 0): any signed-in account can open them.
- Paid books: the reader checks (client-side, for a fast "buy this book" screen)
  *and* the `serve-book` function checks again (server-side, the real gate) that a
  `purchases` row exists for that book and email with `status = 'completed'` before
  it will stream a single byte of the file. The `book-content` storage bucket itself
  is locked to admin-only access — the app never hands out a direct file URL.
- A purchase is recorded from two independent paths (the post-payment redirect and
  the webhook), matched on Razorpay's `payment_id`, so a purchase is never recorded
  twice even if both fire.

## Project structure

```
src/
  pages/            Storefront + reader pages
  pages/admin/       Admin console (books, orders, customers, users, access)
  lib/               Supabase client, data fetching, payment helpers
  components/        Shared UI (PdfViewer, BookCard, Navbar, ...)
supabase/
  migrations/         Database schema, in order
  functions/          Edge functions (Razorpay verification/webhook, access
                      control, book streaming, admin user management)
```
