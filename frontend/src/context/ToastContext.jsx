import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 3500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    show: addToast,
    success: (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Error') => addToast({ title, message, type: 'error' }),
    info: (message, title = 'Info') => addToast({ title, message, type: 'info' }),
    warning: (message, title = 'Warning') => addToast({ title, message, type: 'warning' }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-200',
    bg: 'bg-emerald-50/90',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-rose-500',
    borderColor: 'border-rose-200',
    bg: 'bg-rose-50/90',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-200',
    bg: 'bg-amber-50/90',
  },
  info: {
    icon: Info,
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
    bg: 'bg-primary-light/90',
  },
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((item) => {
        const config = toastConfig[item.type] || toastConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-elevated
              transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in
            `}
          >
            <div className={`p-1 rounded-lg ${config.bg} shrink-0`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              {item.title && (
                <h4 className="text-sm font-semibold text-main">{item.title}</h4>
              )}
              {item.message && (
                <p className="text-xs text-secondary mt-0.5 leading-relaxed">{item.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-secondary hover:text-main p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

