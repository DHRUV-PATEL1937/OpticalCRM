export default function Skeleton({ width = '100%', height = '20px', className = '', rounded = 'rounded' }) {
  return (
    <div className={`skeleton ${rounded} ${className}`} style={{ width, height }} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="16px" className="flex-1" rounded="rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-3">
      <Skeleton width="40%" height="14px" />
      <Skeleton width="60%" height="28px" />
      <Skeleton width="30%" height="12px" />
    </div>
  );
}
