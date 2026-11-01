import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface rounded-2xl border border-border shadow-subtle transition-all duration-200
        ${hoverEffect ? 'hover:shadow-premium hover:-translate-y-0.5 hover:border-slate-300 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-border/60 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-base sm:text-lg font-semibold text-main tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`mt-1 text-xs sm:text-sm text-secondary leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-t border-border/60 bg-slate-50/50 rounded-b-2xl ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;

