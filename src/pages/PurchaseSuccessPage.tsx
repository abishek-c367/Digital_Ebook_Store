import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, ArrowRight, BookOpen } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { verifyPurchaseAndGenerateLink } from '@/lib/payment';
import { fetchBookBySlug } from '@/lib/books';
import type { Book } from '@/types';

export function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [book, setBook] = useState<Book | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error: string | null } | null>(null);

  useEffect(() => {
    // Try to fetch book info from the session
    // The session_id is the Stripe checkout session ID
    // We'll try to get book info via the edge function response
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setResult({ success: false, error: 'Missing payment session information. Please contact support.' });
      return;
    }
    setSubmitting(true);
    const res = await verifyPurchaseAndGenerateLink(sessionId, email);
    setResult(res);
    setSubmitting(false);
    if (res.success) {
      // Try to load book info
      // The edge function should return the book slug
    }
  };

  return (
    <>
      <SEO title="Purchase Complete — Folio" description="Your payment was successful. Enter your email to receive your secure reading link." />

      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Success header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 animate-scale-in">
              <CheckCircle2 className="h-8 w-8 text-accent-600" strokeWidth={1.5} />
            </div>
            <h1 className="mt-6 font-serif text-4xl font-light text-ink-900">Your book is ready.</h1>
            <p className="mt-3 font-serif text-lg text-ink-600">
              Your payment was successful. Enter your email below and we'll send you a secure reading link.
            </p>
          </div>

          {/* Form or result */}
          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-8 shadow-elegant">
            {result?.success ? (
              <div className="text-center animate-scale-in">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
                  <Mail className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 font-serif text-2xl font-light text-ink-900">Reading link sent!</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  We've sent a secure reading link to <strong>{email}</strong>. Check your inbox to start reading.
                </p>
                <div className="mt-6 rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">
                  <p>Didn't receive the email? Check your spam folder, or <Link to="/contact" className="text-ink-900 underline">contact support</Link>.</p>
                </div>
                <Link to="/books" className="btn-secondary mt-6">
                  Continue Browsing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                {result?.error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {result.error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label-field" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="The email you used at checkout"
                    />
                    <p className="mt-2 text-xs text-ink-500">
                      Use the same email address you entered during checkout.
                    </p>
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Verifying purchase...</>
                    ) : (
                      <>Get My Reading Link</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-ink-500">
              Having trouble?{' '}
              <Link to="/contact" className="text-ink-700 underline">Contact support</Link>
            </p>
          </div>

          {!sessionId && (
            <div className="mt-4 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-center text-sm text-gold-800">
              <BookOpen className="inline h-4 w-4 mr-1" />
              If you reached this page without completing checkout, your purchase may not have been processed.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
