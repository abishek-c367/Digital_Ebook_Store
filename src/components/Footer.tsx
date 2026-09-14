import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-ink-200/60 bg-ink-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-ink-900" strokeWidth={1.5} />
              <span className="font-serif text-xl font-medium tracking-editorial text-ink-900">Folio</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              A premium digital publishing house for carefully crafted e-books on the ideas shaping our world.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide-lg text-ink-500">Explore</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/books" className="text-sm text-ink-600 transition-colors hover:text-ink-900">All Books</Link></li>
              <li><Link to="/books?category=artificial-intelligence" className="text-sm text-ink-600 transition-colors hover:text-ink-900">AI & ML</Link></li>
              <li><Link to="/books?category=programming" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Programming</Link></li>
              <li><Link to="/books?category=philosophy" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Philosophy</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide-lg text-ink-500">Company</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/about" className="text-sm text-ink-600 transition-colors hover:text-ink-900">About</Link></li>
              <li><Link to="/contact" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Contact</Link></li>
              <li><Link to="/privacy" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Terms of Service</Link></li>
              <li><Link to="/refund" className="text-sm text-ink-600 transition-colors hover:text-ink-900">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide-lg text-ink-500">Connect</h4>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-md p-2 text-ink-500 transition-colors hover:bg-ink-200 hover:text-ink-900" aria-label="Twitter">
                <Twitter className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="#" className="rounded-md p-2 text-ink-500 transition-colors hover:bg-ink-200 hover:text-ink-900" aria-label="GitHub">
                <Github className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="#" className="rounded-md p-2 text-ink-500 transition-colors hover:bg-ink-200 hover:text-ink-900" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-200 pt-6">
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} Folio. All rights reserved. Books are protected under digital rights management.
          </p>
        </div>
      </div>
    </footer>
  );
}
