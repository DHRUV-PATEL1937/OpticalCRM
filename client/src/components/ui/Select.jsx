import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ label, error, options = [], placeholder = 'Select...', className = '', containerClass = '', ...props }, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClass}`}>
      {label && <label className="block text-sm font-medium text-surface-700">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none rounded-xl border border-surface-200 bg-white px-4 py-2.5 pr-10 text-sm text-surface-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none disabled:bg-surface-50 ${error ? 'border-danger-500' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
