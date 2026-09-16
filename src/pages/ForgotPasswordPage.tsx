import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, BookOpen, Mail, CheckCircle2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/lib/AuthContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset Password — Folio" />
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BookOpen className="h-7 w-7 text-ink-900" strokeWidth={1.5} />
              <span className="font-serif text-2xl font-medium tracking-editorial">Folio</span>
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-8 shadow-elegant">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
                  <CheckCircle2 className="h-6 w-6 text-accent-600" strokeWidth={1.5} />
                </div>
                <h1 className="mt-4 font-serif text-2xl font-light text-ink-900">Check your email.</h1>
                <p className="mt-2 text-sm text-ink-600">
                  We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <Link to="/login" className="btn-secondary mt-6">Back to Sign In</Link>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-2xl font-light text-ink-900">Reset Password</h1>
                <p className="mt-1 text-sm text-ink-600">Enter your email and we'll send you a reset link.</p>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="label-field" htmlFor="email">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.5} />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <>Send Reset Link</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-ink-600">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-ink-900 transition-colors hover:text-ink-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
