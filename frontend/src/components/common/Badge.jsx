import React from 'react';

const badgeVariants = {
  primary: 'bg-primary-light text-primary border-primary/20',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  outline: 'bg-transparent text-secondary border-border',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-3 py-1 text-sm font-medium',
};

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  dotColor,
  icon: Icon,
  className = '',
  ...props
}) => {
  const variantClass = badgeVariants[variant] || badgeVariants.primary;
  const sizeClass = badgeSizes[size] || badgeSizes.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColor || 'bg-current'
          }`}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

