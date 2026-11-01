import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-dark shadow-sm focus-visible:ring-primary/40',
  secondary: 'bg-slate-100 text-main hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-300',
  outline: 'border border-border bg-white text-main hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-300',
  ghost: 'bg-transparent text-secondary hover:text-main hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-200',
  danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700 shadow-sm focus-visible:ring-error/40',
  success: 'bg-success text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm focus-visible:ring-success/40',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-in-out outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

