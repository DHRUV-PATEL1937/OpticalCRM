import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 hover:shadow-[0_8px_20px_rgb(37,99,235,0.25)] border border-primary-600/50',
  secondary: 'bg-white text-surface-700 hover:bg-surface-50 border-2 border-surface-200 hover:border-surface-300 hover:shadow-sm',
  danger: 'bg-gradient-to-r from-danger-500 to-danger-400 text-white hover:from-danger-600 hover:to-danger-500 hover:shadow-[0_8px_20px_rgb(244,63,94,0.25)] border border-danger-500/50',
  success: 'bg-gradient-to-r from-success-500 to-success-400 text-white hover:from-success-600 hover:to-success-500 hover:shadow-[0_8px_20px_rgb(34,197,94,0.25)] border border-success-500/50',
  ghost: 'text-surface-600 hover:bg-surface-100/80 hover:text-surface-900',
  outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:shadow-sm',
};

const sizes = {
  sm: 'px-4 py-2 text-xs font-bold tracking-wide uppercase',
  md: 'px-6 py-2.5 text-sm font-bold tracking-wide',
  lg: 'px-8 py-3.5 text-base font-bold tracking-wide',
  xl: 'px-10 py-4 text-lg font-black tracking-wide',
};

const Button = forwardRef(({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', icon: Icon, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : Icon ? <Icon className="w-5 h-5" /> : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
