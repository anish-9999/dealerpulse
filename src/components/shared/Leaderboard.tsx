import { Link } from 'react-router-dom';
import { ProgressBar } from './Misc';


interface LeaderboardItem {
  id: string;
  label: string;
  subtitle?: string;
  value: number;
  suffix?: string;
  href?: string;
  progress?: number;
  secondaryValue?: string;
}

interface LeaderboardProps {
  items: LeaderboardItem[];
  maxItems?: number;
}

export default function Leaderboard({ items, maxItems }: LeaderboardProps) {
  const display = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="space-y-2">
      {display.map((item, i) => {
        const content = (
          <div
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
              item.href ? 'hover:bg-gray-50 cursor-pointer' : ''
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i === 0 ? 'bg-amber-100 text-amber-700' :
              i === 1 ? 'bg-gray-200 text-gray-600' :
              i === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
              {item.subtitle && <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {item.value.toLocaleString()}{item.suffix ? ` ${item.suffix}` : ''}
              </p>
              {item.secondaryValue && (
                <p className="text-xs text-gray-500">{item.secondaryValue}</p>
              )}
            </div>
          </div>
        );

        if (item.href) {
          return (
            <Link key={item.id} to={item.href} className="block">
              {content}
              {item.progress !== undefined && (
                <div className="px-11 pb-1">
                  <ProgressBar value={item.progress} max={100} size="sm" />
                </div>
              )}
            </Link>
          );
        }

        return (
          <div key={item.id}>
            {content}
            {item.progress !== undefined && (
              <div className="px-11 pb-1">
                <ProgressBar value={item.progress} max={100} size="sm" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
