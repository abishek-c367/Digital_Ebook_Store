import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, X, Settings, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Loader2, ShieldAlert, BookOpen, Type, CreditCard, Lock,
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { PdfViewer } from '@/components/PdfViewer';
import { verifyAccessToken, buildRazorpayCheckoutUrl } from '@/lib/payment';
import { fetchBookById, isFreeBook, formatPrice } from '@/lib/books';
import { upsertReadingProgress, checkUserOwnsBook } from '@/lib/userLibrary';
import { supabase } from '@/lib/supabase';
import type { Book } from '@/types';

type AccessState = 'loading' | 'authorized' | 'denied' | 'expired' | 'invalid' | 'purchase_required';

export function ReaderPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [accessState, setAccessState] = useState<AccessState>('loading');
  const [book, setBook] = useState<Book | null>(null);
  const [readerEmail, setReaderEmail] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const readerRef = useRef<HTMLDivElement>(null);

  const buildPdfUrl = useCallback(async (bookId: string): Promise<{ url: string; token: string } | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return null;

    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-book`;
    return { url: `${baseUrl}?bookId=${encodeURIComponent(bookId)}`, token: accessToken };
  }, []);

  // Verify access token on mount
  useEffect(() => {
    let active = true;

    const authorizeReader = async () => {
      if (!token) {
        setAccessState('invalid');
        return;
      }

      try {
        if (token.startsWith('session:')) {
          const bookId = token.slice('session:'.length);
          const { data: sessionData } = await supabase.auth.getSession();
          const currentSession = sessionData.session;

          if (!currentSession || !bookId) {
            if (active) setAccessState('denied');
            return;
          }

          const sessionBook = await fetchBookById(bookId);
          if (!sessionBook) {
            if (active) setAccessState('invalid');
            return;
          }

          // Free books are open to any registered account. Paid books
          // still require a completed purchase — the edge functions
          // enforce this too, but checking here gives a proper "buy this
          // book" screen instead of a generic load failure.
          if (!isFreeBook(sessionBook)) {
            const owned = await checkUserOwnsBook(bookId);
            if (!owned) {
              if (active) {
                setBook(sessionBook);
                setAccessState('purchase_required');
              }
              return;
            }
          }

          if (active) {
            setBook(sessionBook);
            setReaderEmail(currentSession.user.email ?? null);
            setAccessState('authorized');
          }
          return;
        }

        const result = await verifyAccessToken(token);
        if (!active) return;

        if (result.authorized && result.bookId) {
          const linkedBook = await fetchBookById(result.bookId);
          if (linkedBook) {
            setBook(linkedBook);
            setReaderEmail(result.email);
            setAccessState('authorized');
          } else {
            setAccessState('invalid');
          }
        } else if (result.error?.includes('expired') || result.error?.includes('revoked')) {
          setAccessState('expired');
        } else {
          setAccessState('denied');
        }
      } catch {
        if (active) setAccessState('denied');
      }
    };

    authorizeReader();
    return () => {
      active = false;
    };
  }, [token]);

  // Load PDF via secure edge function when book is authorized
  useEffect(() => {
    if (accessState !== 'authorized' || !book?.private_file_path) return;

    setLoadingPdf(true);
    buildPdfUrl(book.id).then((result) => {
      if (result) {
        setPdfUrl(result.url);
        setAuthToken(result.token);
      }
      setLoadingPdf(false);
    });
  }, [accessState, book, buildPdfUrl]);

  // Anti-download measures
  useEffect(() => {
    if (accessState !== 'authorized') return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventDrag = (e: DragEvent) => e.preventDefault();
    const preventPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
    };
    const preventSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('keydown', preventPrint);
    document.addEventListener('keydown', preventSave);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('keydown', preventPrint);
      document.removeEventListener('keydown', preventSave);
    };
  }, [accessState]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Save reading progress
  useEffect(() => {
    if (accessState === 'authorized' && book && token) {
      const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
      upsertReadingProgress(book.id, currentPage, progress);
    }
  }, [currentPage, totalPages, book, accessState, token]);

  // Keep the page-jump input in sync with the current page
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const jumpToPage = useCallback((raw: string) => {
    const target = Math.round(Number(raw));
    if (!Number.isFinite(target)) {
      setPageInput(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(target, 1), Math.max(totalPages, 1));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  }, [currentPage, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    if (accessState !== 'authorized') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage((p) => p - 1);
      if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage((p) => p + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [accessState, currentPage, totalPages]);

  if (accessState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-ink-400" />
          <p className="mt-4 text-sm tracking-editorial text-ink-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (accessState === 'invalid' || accessState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <SEO title="Access Denied — Folio" />
        <div className="max-w-md text-center animate-fade-in-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-8 w-8 text-red-600" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">Access Denied</h1>
          <p className="mt-3 text-ink-600">
            You need to be logged in to read this book. Sign in or create a free account to get started.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/signup" className="btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (accessState === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <SEO title="Link Expired — Folio" />
        <div className="max-w-md text-center animate-fade-in-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50">
            <ShieldAlert className="h-8 w-8 text-gold-600" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">Link Expired</h1>
          <p className="mt-3 text-ink-600">
            This reading link has expired or been revoked. Please sign in to access your library.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/library" className="btn-primary">Go to Library</Link>
            <Link to="/contact" className="btn-secondary">Contact Support</Link>
          </div>
        </div>
      </div>
    );
  }

  if (accessState === 'purchase_required') {
    const checkoutUrl = book ? buildRazorpayCheckoutUrl(book, readerEmail) : null;
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <SEO title="Purchase Required — Folio" />
        <div className="max-w-md text-center animate-fade-in-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50">
            <Lock className="h-8 w-8 text-gold-600" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-light text-ink-900">Purchase Required</h1>
          <p className="mt-3 text-ink-600">
            {book ? `"${book.title}" is a paid book. Buy it to unlock the full reading experience.` : 'This is a paid book.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {book?.razorpay_payment_link ? (
              <a href={checkoutUrl ?? '#'} className="btn-primary">
                <CreditCard className="h-4 w-4" />
                Buy Book{book ? ` — ${formatPrice(book.price_cents, book.currency)}` : ''}
              </a>
            ) : (
              <Link to="/contact" className="btn-primary">Contact Support</Link>
            )}
            <Link to="/library" className="btn-secondary">Go to Library</Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div ref={readerRef} className="flex min-h-screen flex-col bg-ink-950 select-none">
      <SEO title={`Reading: ${book?.title || 'Book'} — Folio`} />

      {/* Reader header */}
      <header className="flex items-center justify-between border-b border-ink-800 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-400 transition-colors hover:text-ink-100"
          >
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-sm text-ink-100 sm:text-base">{book?.title}</h1>
            <p className="truncate text-xs text-ink-500">{book?.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gold-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-ink-400">{Math.round(progress)}%</span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" strokeWidth={1.5} /> : <Maximize2 className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute right-4 top-16 z-20 w-64 rounded-lg border border-ink-700 bg-ink-900 p-4 shadow-xl animate-fade-in-down">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide-lg text-ink-400">Reader Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs text-ink-400">
                <span className="flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Font Size</span>
                <span className="tabular-nums">{fontSize}px</span>
              </label>
              <input
                type="range"
                min="14"
                max="28"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs text-ink-400">
                <span><ZoomIn className="inline h-3.5 w-3.5 mr-1" /> Zoom</span>
                <span className="tabular-nums">{zoom}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-xs text-ink-400">
                <span>Watermark</span>
                <button
                  onClick={() => setShowWatermark(!showWatermark)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${showWatermark ? 'bg-gold-500' : 'bg-ink-700'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showWatermark ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reading area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        {loadingPdf ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-ink-400" />
            <p className="mt-4 text-sm text-ink-400">Loading book...</p>
          </div>
        ) : pdfUrl ? (
          <div className="relative flex h-full w-full max-w-4xl flex-col items-center justify-center">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden w-full">
              <PdfViewer
                pdfUrl={pdfUrl}
                authToken={authToken}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onTotalPages={setTotalPages}
                zoom={zoom}
              />

              {/* Watermark overlay */}
              {showWatermark && readerEmail && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                  <div
                    className="rotate-[-30deg] text-center opacity-[0.06]"
                    style={{ fontSize: '24px' }}
                  >
                    <p className="font-sans font-medium tracking-editorial text-ink-900">
                      Licensed to: {readerEmail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Fallback: text-based reader when no PDF uploaded */
          <div
            className="relative max-w-2xl rounded-lg bg-ink-50 px-6 py-10 shadow-2xl sm:px-12 sm:py-16"
            style={{
              transform: `scale(${zoom / 100})`,
              transition: 'transform 0.3s ease',
            }}
          >
            <div
              className="font-serif leading-relaxed text-ink-800"
              style={{ fontSize: `${fontSize}px` }}
            >
              <div className="mb-6 text-center">
                <p className="text-xs uppercase tracking-wide-lg text-gold-600">Chapter {Math.ceil(currentPage / 5)}</p>
                <h2 className="mt-2 font-serif text-2xl text-ink-900">
                  {book?.table_of_contents?.[Math.ceil(currentPage / 5) - 1]?.title || book?.title}
                </h2>
              </div>
              <div className="space-y-4">
                <p>
                  {book?.long_description || book?.description}
                </p>
                <p>
                  This is page {currentPage} of {totalPages}. No book file has been uploaded yet,
                  so this is a preview of the book's description. Once a PDF is uploaded through
                  the admin panel, the full book content will display here.
                </p>
                <p className="text-ink-600 italic">
                  Continue reading to explore the full content of this chapter...
                </p>
              </div>
            </div>

            {/* Watermark */}
            {showWatermark && readerEmail && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="rotate-[-30deg] text-center opacity-[0.06]"
                  style={{ fontSize: '24px' }}
                >
                  <p className="font-sans font-medium tracking-editorial text-ink-900">
                    Licensed to: {readerEmail}
                  </p>
                </div>
              </div>
            )}

            {/* Page number */}
            <div className="mt-8 border-t border-ink-200 pt-4 text-center">
              <span className="text-xs tabular-nums text-ink-500">{currentPage} / {totalPages}</span>
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        <button
          onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
          disabled={currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-ink-400 transition-all hover:bg-ink-800 hover:text-ink-100 disabled:opacity-20 disabled:cursor-not-allowed sm:left-4"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
          disabled={currentPage >= totalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-ink-400 transition-all hover:bg-ink-800 hover:text-ink-100 disabled:opacity-20 disabled:cursor-not-allowed sm:right-4"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom bar */}
      <footer className="border-t border-ink-800 px-4 py-3 sm:px-6">
        {totalPages > 1 && (
          <div className="mb-3 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="w-full accent-gold-500"
              aria-label="Slide to a page"
            />
            <form
              onSubmit={(e) => { e.preventDefault(); jumpToPage(pageInput); }}
              className="flex flex-shrink-0 items-center gap-1.5"
            >
              <label htmlFor="page-jump" className="sr-only">Jump to page</label>
              <input
                id="page-jump"
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => jumpToPage(pageInput)}
                className="w-16 rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-center text-xs tabular-nums text-ink-100 focus:border-gold-500 focus:outline-none"
              />
              <span className="text-xs text-ink-500">/ {totalPages}</span>
            </form>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-400 transition-colors hover:text-ink-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span className="text-xs tabular-nums text-ink-500">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          <button
            onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1.5 text-sm tracking-editorial text-ink-400 transition-colors hover:text-ink-100 disabled:opacity-30"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
