import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Menu, X, Library, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm tracking-editorial transition-colors duration-200 ${
      isActive ? 'text-ink-900 font-medium' : 'text-ink-600 hover:text-ink-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/60 bg-ink-50/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <BookOpen className="h-6 w-6 text-ink-900" strokeWidth={1.5} />
          <span className="font-serif text-xl font-medium tracking-editorial text-ink-900">Folio</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 lg:flex">
          <NavLink to="/books" className={navLinkClass}>Books</NavLink>
          <NavLink to="/books" end={false} className={navLinkClass}>Categories</NavLink>
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/library"
                className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-600 transition-colors hover:text-ink-900"
              >
                <Library className="h-4 w-4" strokeWidth={1.5} />
                Library
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-600 transition-colors hover:text-ink-900"
                >
                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                  Admin
                </Link>
              )}
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-600 transition-colors hover:text-ink-900">
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  {profile?.name || 'Account'}
                </button>
                <div className="invisible absolute right-0 top-full mt-2 w-48 origin-top-right rounded-lg border border-ink-200 bg-white p-2 opacity-0 shadow-elegant transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <Link to="/account" className="block rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">Account Settings</Link>
                  <Link to="/library" className="block rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">My Library</Link>
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/login" className="text-sm tracking-editorial text-ink-600 transition-colors hover:text-ink-900">Sign In</Link>
              <Link to="/signup" className="btn-primary !px-4 !py-2">Get Started</Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Search bar overlay */}
      {searchOpen && (
        <div className="border-t border-ink-200/60 bg-ink-50 px-4 py-3 animate-fade-in-down sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or topic..."
              autoFocus
              className="input-field"
            />
            <button type="submit" className="btn-primary !px-4">Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-ink-200/60 bg-ink-50 lg:hidden animate-fade-in-down">
          <div className="space-y-1 px-4 py-4">
            <NavLink to="/books" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">Books</NavLink>
            <NavLink to="/about" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">About</NavLink>
            <NavLink to="/contact" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">Contact</NavLink>
            {user ? (
              <>
                <NavLink to="/library" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">My Library</NavLink>
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">Admin</NavLink>
                )}
                <NavLink to="/account" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">Account</NavLink>
                <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100">Sign In</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary mt-2 w-full">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
