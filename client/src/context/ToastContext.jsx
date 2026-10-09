import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bgColor = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
          let icon = <Info className="w-5 h-5 text-indigo-400 dark:text-indigo-600 flex-shrink-0" />;

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-900/95 text-emerald-100 border border-emerald-700/50 dark:bg-emerald-950 dark:text-emerald-200';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-900/95 text-rose-100 border border-rose-700/50 dark:bg-rose-950 dark:text-rose-200';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
          } else if (toast.type === 'info') {
            bgColor = 'bg-indigo-900/95 text-indigo-100 border border-indigo-700/50 dark:bg-indigo-950 dark:text-indigo-200';
            icon = <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-xl backdrop-blur-md text-sm transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${bgColor}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-1 rounded-lg transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
