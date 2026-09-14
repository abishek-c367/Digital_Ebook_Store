import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  pdfUrl: string;
  authToken: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPages: (total: number) => void;
  zoom: number;
}

export function PdfViewer({ pdfUrl, authToken, currentPage, onPageChange, onTotalPages, zoom }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const renderTaskRef = useRef<{ promise: Promise<void>; cancel: () => void } | null>(null);

  useEffect(() => {
    let active = true;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(false);

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          cMapPacked: true,
          httpHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });

        const pdf = await loadingTask.promise;
        if (!active) return;

        pdfDocRef.current = pdf;
        onTotalPages(pdf.numPages);

        const page = await pdf.getPage(Math.min(currentPage, pdf.numPages));
        if (!active) return;
        await renderPage(page);
        setLoading(false);
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl]);

  const renderPage = useCallback(async (page: import('pdfjs-dist').PDFPageProxy) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const containerWidth = container?.clientWidth || 800;
    const containerHeight = container?.clientHeight || 600;

    const baseScale = Math.min(
      containerWidth / page.getViewport({ scale: 1 }).width,
      containerHeight / page.getViewport({ scale: 1 }).height,
    );

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const scale = Math.max(0.1, baseScale * (zoom / 100));
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const renderTask = page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: scale * dpr }),
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch (err) {
      if (!(err instanceof Error) || err.name !== 'RenderingCancelledException') {
        throw err;
      }
    }
  }, [zoom]);

  useEffect(() => {
    const renderCurrentPage = async () => {
      const pdf = pdfDocRef.current;
      if (!pdf || loading) return;

      try {
        const page = await pdf.getPage(Math.min(currentPage, pdf.numPages));
        await renderPage(page);
      } catch {
        // ignore render errors on rapid page changes
      }
    };

    renderCurrentPage();
  }, [currentPage, renderPage, loading]);

  useEffect(() => {
    const renderOnZoom = async () => {
      const pdf = pdfDocRef.current;
      if (!pdf || loading) return;

      try {
        const page = await pdf.getPage(Math.min(currentPage, pdf.numPages));
        await renderPage(page);
      } catch {
        // ignore
      }
    };

    renderOnZoom();
  }, [zoom, currentPage, renderPage, loading]);

  const goToPage = (page: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf) return;
    if (page >= 1 && page <= pdf.numPages) {
      onPageChange(page);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="text-sm text-ink-400">Unable to load this book.</p>
        <p className="mt-1 text-xs text-ink-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-ink-400" />
          <p className="mt-4 text-sm text-ink-400">Loading book...</p>
        </div>
      )}
      <div
        className={`relative flex items-center justify-center overflow-auto ${loading ? 'hidden' : ''}`}
        style={{ maxHeight: '100%' }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-white shadow-2xl"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>

      {/* Page navigation overlay */}
      {!loading && (
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="text-xs tabular-nums text-ink-500">
            {currentPage} / {pdfDocRef.current?.numPages ?? '?'}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={pdfDocRef.current ? currentPage >= pdfDocRef.current.numPages : true}
            className="rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
