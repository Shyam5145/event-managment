import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast = ({ type = 'info', title, message, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-primary" />,
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-white shadow-elevated">
      <div className="shrink-0">{icons[type] || icons.info}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-main">{title}</h4>}
        {message && <p className="text-xs text-secondary mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-secondary hover:text-main p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export { useToast };
export default Toast;

