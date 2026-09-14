import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let currentToasts: Toast[] = [];

export function showToast(type: ToastType, message: string) {
  const id = `toast-${++toastId}`;
  currentToasts = [...currentToasts, { id, type, message }];
  listeners.forEach((l) => l(currentToasts));
  setTimeout(() => dismissToast(id), 5000);
}

function dismissToast(id: string) {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l(currentToasts));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-elegant animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-accent-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-ink-900 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => dismissToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
