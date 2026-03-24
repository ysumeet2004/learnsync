import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{icon}</div>}
          <input
            ref={ref}
            className={clsx(
              'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
              icon && 'pl-10',
              error && 'border-danger focus:ring-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-text-tertiary">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
