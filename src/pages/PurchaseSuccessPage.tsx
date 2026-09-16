import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight, XCircle, BookOpen } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { verifyRazorpayPayment } from '@/lib/payment';

type VerifyState = 'verifying' | 'success' | 'error' | 'missing';

export function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [bookSlug, setBookSlug] = useState<string | null>(null);
  const [readLink, setReadLink] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const paymentId = searchParams.get('razorpay_payment_id');
    const paymentLinkId = searchParams.get('razorpay_payment_link_id');
    const referenceId = searchParams.get('razorpay_payment_link_reference_id') || undefined;
    const linkStatus = searchParams.get('razorpay_payment_link_status');
    const signature = searchParams.get('razorpay_signature');

    if (!paymentId || !paymentLinkId || !linkStatus || !signature) {
      setState('missing');
      return;
    }

    verifyRazorpayPayment({
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: paymentLinkId,
      razorpay_payment_link_reference_id: referenceId,
      razorpay_payment_link_status: linkStatus,
      razorpay_signature: signature,
    }).then((res) => {
      if (res.success) {
        setBookTitle(res.bookTitle);
        setBookSlug(res.bookSlug);
        setReadLink(res.readLink);
        setState('success');
      } else {
        setError(res.error);
        setState('error');
      }
    });
  }, [searchParams]);

  return (
    <>
      <SEO title="Purchase Complete — Folio" description="Thank you for your purchase." />

      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg animate-fade-in-up text-center">
          {state === 'verifying' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
                <Loader2 className="h-8 w-8 animate-spin text-ink-500" strokeWidth={1.5} />
              </div>
              <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">Confirming your payment...</h1>
              <p className="mt-3 text-ink-600">This only takes a moment.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 animate-scale-in">
                <CheckCircle2 className="h-8 w-8 text-accent-600" strokeWidth={1.5} />
              </div>
              <h1 className="mt-6 font-serif text-4xl font-light text-ink-900">Thank you — you're all set!</h1>
              <p className="mt-3 font-serif text-lg text-ink-600">
                Your payment for {bookTitle ? <strong>{bookTitle}</strong> : 'your book'} was successful. It's now in your library, ready to read.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {readLink && (
                  <Link to={readLink} className="btn-primary">
                    <BookOpen className="h-4 w-4" />
                    Start Reading
                  </Link>
                )}
                <Link to="/library" className="btn-secondary">
                  Go to My Library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {bookSlug && (
                <p className="mt-6 text-sm text-ink-500">
                  <Link to={`/books/${bookSlug}`} className="underline hover:text-ink-900">View book details</Link>
                </p>
              )}
            </>
          )}

          {state === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-600" strokeWidth={1.5} />
              </div>
              <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">We couldn't confirm that payment</h1>
              <p className="mt-3 text-ink-600">{error || 'Something went wrong verifying your purchase.'}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/library" className="btn-primary">Go to My Library</Link>
                <Link to="/contact" className="btn-secondary">Contact Support</Link>
              </div>
              <p className="mt-4 text-xs text-ink-500">
                If money was deducted, it's usually already on its way to your library — check there first, or reach out and we'll sort it out.
              </p>
            </>
          )}

          {state === 'missing' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50">
                <BookOpen className="h-8 w-8 text-gold-600" strokeWidth={1.5} />
              </div>
              <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">No payment details found</h1>
              <p className="mt-3 text-ink-600">
                If you just completed a purchase, check your library — it may already be there. Otherwise, this page is only meant to be reached from a Razorpay payment redirect.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/library" className="btn-primary">Go to My Library</Link>
                <Link to="/books" className="btn-secondary">Browse Books</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
