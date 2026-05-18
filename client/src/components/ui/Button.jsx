import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm shadow-danger-200',
  success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm shadow-success-200',
  ghost: 'text-surface-600 hover:bg-surface-100',
  outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const Button = forwardRef(({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', icon: Icon, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
