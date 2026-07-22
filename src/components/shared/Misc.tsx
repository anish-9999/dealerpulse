export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-2xl">📋</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ProgressBar({ value, max, size = 'md' }: { value: number; max: number; size?: 'sm' | 'md' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className={`w-full bg-gray-200 rounded-full ${height}`}>
      <div className={`${height} rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
