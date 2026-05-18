import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, helper, icon: Icon, className = '', containerClass = '', ...props }, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClass}`}>
      {label && (
        <label className="block text-sm font-medium text-surface-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none disabled:bg-surface-50 disabled:text-surface-400 ${Icon ? 'pl-10' : ''} ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
      {helper && !error && <p className="text-xs text-surface-400">{helper}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
