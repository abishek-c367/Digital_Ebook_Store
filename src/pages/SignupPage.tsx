import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/lib/AuthContext';
import { showToast } from '@/components/Toast';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password, name);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      showToast('success', 'Account created. Welcome to Folio.');
      navigate('/library');
    }
  };

  return (
    <>
      <SEO title="Create Account — Folio" />
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BookOpen className="h-7 w-7 text-ink-900" strokeWidth={1.5} />
              <span className="font-serif text-2xl font-medium tracking-editorial">Folio</span>
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-8 shadow-elegant">
            <h1 className="font-serif text-2xl font-light text-ink-900">Create Account</h1>
            <p className="mt-1 text-sm text-ink-600">Start your reading journey with Folio.</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label-field" htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
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
                  placeholder="At least 6 characters"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account</>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-ink-900 transition-colors hover:text-ink-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
