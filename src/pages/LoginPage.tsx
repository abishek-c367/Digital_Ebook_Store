import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, BookOpen } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/lib/AuthContext';
import { showToast } from '@/components/Toast';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/library';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      showToast('success', 'Welcome back.');
      navigate(from);
    }
  };

  return (
    <>
      <SEO title="Sign In — Folio" />
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BookOpen className="h-7 w-7 text-ink-900" strokeWidth={1.5} />
              <span className="font-serif text-2xl font-medium tracking-editorial">Folio</span>
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-8 shadow-elegant">
            <h1 className="font-serif text-2xl font-light text-ink-900">Sign In</h1>
            <p className="mt-1 text-sm text-ink-600">Access your library and reading links.</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label-field" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link to="/forgot-password" className="text-ink-500 transition-colors hover:text-ink-900">
                Forgot your password?
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-ink-900 transition-colors hover:text-ink-700">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
