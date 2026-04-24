'use client';
import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; }
interface ToastContextType { addToast: (type: Toast['type'], message: string) => void; }

const ToastContext = createContext<ToastContextType | null>(null);
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const icons = { success: <CheckCircle size={16} className="text-emerald-400" />, error: <XCircle size={16} className="text-red-400" />, info: <Info size={16} className="text-blue-400" /> };
  const borders = { success: 'border-emerald-500/30', error: 'border-red-500/30', info: 'border-blue-500/30' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn('pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-900/95 backdrop-blur-sm border shadow-xl animate-slide-in', borders[toast.type])}>
            {icons[toast.type]}
            <span className="text-sm text-zinc-200">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={12} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
