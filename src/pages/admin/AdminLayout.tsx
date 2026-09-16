import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ShoppingCart, Users, UserCog, KeyRound, ArrowLeft } from 'lucide-react';
import { SEO } from '@/components/SEO';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/books', label: 'Books', icon: BookOpen, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
  { to: '/admin/users', label: 'Users', icon: UserCog, end: false },
  { to: '/admin/access', label: 'Access', icon: KeyRound, end: false },
];

export function AdminLayout() {
  return (
    <>
      <SEO title="Admin — Folio" />
      <div className="min-h-screen bg-ink-50">
        <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6 lg:px-6 lg:py-6">
          {/* Sidebar */}
          <aside className="hidden w-60 flex-shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-ink-200 bg-white p-4">
              <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to site
              </Link>
              <h2 className="px-3 text-xs font-medium uppercase tracking-wide-lg text-ink-500 mb-2">Admin Panel</h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-ink-900 text-ink-50'
                          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 mb-4 overflow-x-auto border-b border-ink-200 bg-ink-50 px-4 py-2 sm:-mx-6 sm:px-6">
            <div className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive ? 'bg-ink-900 text-ink-50' : 'text-ink-600 hover:bg-ink-100'
                    }`
                  }
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0 px-4 py-6 lg:px-0 lg:py-0">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
