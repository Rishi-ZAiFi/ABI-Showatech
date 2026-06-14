/**
 * ToastContainer — Slice 10 (Polish)
 *
 * Renders the active toast stack at the bottom-right of the viewport.
 * Mount once at the app root (<App>).
 *
 * Toasts auto-dismiss via the store's setTimeout.
 * Users can also dismiss manually by clicking ×.
 */

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toast.store';
import type { ToastType } from '../../store/toast.store';

// ---------------------------------------------------------------------------
// Icon + colour helpers
// ---------------------------------------------------------------------------

function toastIcon(type: ToastType) {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    case 'error':   return <AlertCircle  className="w-4 h-4 text-destructive  flex-shrink-0" />;
    case 'info':    return <Info         className="w-4 h-4 text-sky-400      flex-shrink-0" />;
  }
}

function borderClass(type: ToastType): string {
  switch (type) {
    case 'success': return 'border-emerald-500/40';
    case 'error':   return 'border-destructive/40';
    case 'info':    return 'border-sky-500/40';
  }
}

// ---------------------------------------------------------------------------
// ToastContainer
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const toasts     = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'pointer-events-auto flex items-start gap-2 min-w-[260px] max-w-sm',
            'px-3 py-2.5 rounded-lg shadow-lg',
            'bg-card border text-sm text-foreground',
            'animate-in slide-in-from-right-4 fade-in duration-200',
            borderClass(t.type),
          ].join(' ')}
        >
          {toastIcon(t.type)}

          <span className="flex-1 leading-snug text-xs break-words">
            {t.message}
          </span>

          <button
            onClick={() => dismissToast(t.id)}
            className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
