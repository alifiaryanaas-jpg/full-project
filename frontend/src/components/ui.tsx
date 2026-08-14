import type { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_2px_rgba(28,27,25,0.06)] p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/70 transition-shadow ${props.className ?? ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-sm font-medium text-gray-700 mb-1.5 block">{children}</label>;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      {...rest}
      className={`h-11 px-4 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: 'gray' | 'green' | 'red' | 'amber' }) {
  const styles: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[color]}`}>{children}</span>;
}
