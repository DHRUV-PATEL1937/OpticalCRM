export default function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-surface-100 ${padding ? 'p-6' : ''} ${hover ? 'hover:shadow-lg hover:border-surface-200 transition-all duration-200' : 'shadow-sm'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-surface-900 ${className}`}>{children}</h3>;
}
