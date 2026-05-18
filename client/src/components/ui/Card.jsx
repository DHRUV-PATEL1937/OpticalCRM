export default function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-3xl border border-surface-200/60 ${padding ? 'p-8' : ''} ${hover ? 'hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-primary-200 transition-all duration-300' : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`flex items-center justify-between mb-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-xl font-bold text-surface-900 tracking-tight ${className}`}>{children}</h3>;
}
