import { useEffect, useState } from 'react';
import { AlertTriangle, Lightbulb, Info } from 'lucide-react';

interface HeadlineInsightProps {
  insights: { type: 'alert' | 'tip' | 'info'; text: string; tab?: string }[];
}

const typeConfig = {
  alert: {
    bg: 'bg-red-50 border-red-300',
    dot: 'bg-red-500',
    Icon: AlertTriangle,
    label: 'ACTION NEEDED',
    labelClass: 'text-red-700',
  },
  tip: {
    bg: 'bg-emerald-50 border-emerald-300',
    dot: 'bg-emerald-500',
    Icon: Lightbulb,
    label: 'HIGHLIGHT',
    labelClass: 'text-emerald-700',
  },
  info: {
    bg: 'bg-blue-50 border-blue-300',
    dot: 'bg-blue-500',
    Icon: Info,
    label: 'NOTE',
    labelClass: 'text-blue-700',
  },
};

export default function HeadlineInsight({ insights }: HeadlineInsightProps) {
  const [index, setIndex] = useState(0);

  const alerts = insights.filter(i => i.type === 'alert');
  const others = insights.filter(i => i.type !== 'alert');
  const ordered = [...alerts, ...others];
  const top3 = ordered.slice(0, 3);

  useEffect(() => {
    if (top3.length < 2) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % top3.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [top3.length]);

  if (top3.length === 0) return null;

  const current = top3[index];
  const config = typeConfig[current.type];
  const Icon = config.Icon;

  return (
    <div className={`rounded-xl border p-4 ${config.bg} transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg bg-white/80 ${config.labelClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold tracking-wider ${config.labelClass}`}>{config.label}</span>
            {top3.length > 1 && (
              <span className="text-xs text-gray-400">
                {index + 1} / {top3.length}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{current.text}</p>
        </div>
        {top3.length > 1 && (
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">
            {index + 1} / {top3.length}
          </span>
        )}
      </div>
    </div>
  );
}
