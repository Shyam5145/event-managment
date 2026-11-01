import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  required = false,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-main tracking-tight">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-main placeholder-secondary/60 
            transition duration-150 ease-in-out outline-none
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20' 
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            disabled:bg-slate-50 disabled:text-secondary disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-secondary">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

