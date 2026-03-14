'use client';
import { create } from 'zustand';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 4000);
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg, opts) => useToastStore.getState().add({ type: 'success', message: msg, ...opts }),
  error: (msg, opts) => useToastStore.getState().add({ type: 'error', message: msg, ...opts }),
  info: (msg, opts) => useToastStore.getState().add({ type: 'info', message: msg, ...opts }),
  warning: (msg, opts) => useToastStore.getState().add({ type: 'warning', message: msg, ...opts }),
};

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error:   <AlertCircle className="w-5 h-5 text-red-500" />,
  info:    <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const styles = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200 bg-red-50',
  info:    'border-blue-200 bg-blue-50',
  warning: 'border-amber-200 bg-amber-50',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-2xl border shadow-lg pointer-events-auto',
            'animate-slide-in-right bg-white',
            styles[t.type]
          )}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold text-slate-900">{t.title}</p>}
            <p className="text-sm text-slate-700">{t.message}</p>
          </div>
          <button onClick={() => remove(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
