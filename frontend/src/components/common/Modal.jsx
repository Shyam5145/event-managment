import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showClose = true,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = modalSizes[size] || modalSizes.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${sizeClass} bg-surface rounded-2xl border border-border shadow-elevated z-10 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-border/70">
            <div>
              {title && <h2 className="text-lg font-semibold text-main tracking-tight">{title}</h2>}
              {description && <p className="mt-1 text-xs sm:text-sm text-secondary">{description}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-secondary hover:text-main p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border/70 bg-slate-50/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

