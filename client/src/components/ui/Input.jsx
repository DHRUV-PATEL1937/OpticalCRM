import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, helper, icon: Icon, className = '', containerClass = '', ...props }, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClass}`}>
      {label && (
        <label className="block text-sm font-bold text-surface-700 tracking-wide">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-2xl border-2 border-surface-200 bg-white px-4 py-3 text-base font-medium text-surface-900 placeholder:text-surface-400 placeholder:font-normal transition-all duration-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 focus:outline-none hover:border-surface-300 disabled:bg-surface-50 disabled:text-surface-400 ${Icon ? 'pl-11' : ''} ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-semibold text-danger-500">{error}</p>}
      {helper && !error && <p className="text-xs font-medium text-surface-400">{helper}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
