import { clsx } from 'clsx';
import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-surface border border-border rounded-xl p-4',
        hover && 'hover:border-border-strong hover:bg-bg-elevated',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardLg({ children, className, hover, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-surface border border-border rounded-xl p-6',
        hover && 'hover:border-border-strong hover:bg-bg-elevated',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-bg-elevated border border-border text-text-secondary',
    success: 'bg-success/10 border border-success text-success',
    warning: 'bg-warning/10 border border-warning text-warning',
    danger: 'bg-danger/10 border border-danger text-danger',
    error: 'bg-danger/10 border border-danger text-danger',
    info: 'bg-info/10 border border-info text-info',
    brand: 'bg-brand/10 border border-brand text-brand',
  };

  return (
    <span className={clsx('inline-block px-2 py-1 rounded text-xs font-medium', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
