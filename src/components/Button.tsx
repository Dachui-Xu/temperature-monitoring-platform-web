import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)] border border-transparent",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-sm border border-transparent",
    outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    link: "bg-transparent text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline p-0 h-auto shadow-none",
  };

  const sizes = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2.5 px-5 text-sm",
    lg: "py-3 px-6 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const sizeClass = variant === 'link' ? '' : sizes[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${widthClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};