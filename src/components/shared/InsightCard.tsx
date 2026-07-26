import { AlertTriangle, Info, Lightbulb, ExternalLink } from 'lucide-react';

interface InsightCardProps {
  type?: 'alert' | 'info' | 'tip';
  title: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
}

const styles = {
  alert: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    Icon: Info,
  },
  tip: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    Icon: Lightbulb,
  },
};

export default function InsightCard({ type = 'info', title, description, href, children }: InsightCardProps) {
  const style = styles[type];
  const Icon = style.Icon;

  const content = (
    <div className={`rounded-lg border p-3.5 ${style.bg} ${href ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.icon}`} />
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && <p className="text-xs text-gray-600">{description}</p>}
          {children}
        </div>
        {href && <ExternalLink className="w-3.5 h-3.5 text-gray-400 mt-1 shrink-0" />}
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }

  return content;
}
