import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  tooltip?: string;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const iconColorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export default function KPICard({ title, value, subtitle, icon, trend, color = 'blue', tooltip }: KPICardProps) {
  return (
    <div className={`rounded-xl border p-4 md:p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs md:text-sm font-medium opacity-80 truncate">{title}</p>
            {tooltip && (
              <span className="relative group inline-flex shrink-0">
                <Info className="w-3.5 h-3.5 opacity-50 cursor-help" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-xs font-normal text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg max-w-48 text-center">
                  {tooltip}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </span>
              </span>
            )}
          </div>
          <p className="text-xl md:text-2xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && <p className="text-xs opacity-70 whitespace-pre-line">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg shrink-0 ${iconColorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(trend.value)}% vs last month</span>
        </div>
      )}
    </div>
  );
}
