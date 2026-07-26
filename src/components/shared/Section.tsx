import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  zone?: 'gray' | 'white' | 'transparent';
}

const zoneStyles = {
  gray: 'bg-gray-50',
  white: 'bg-white shadow-sm border border-gray-200',
  transparent: '',
};

export default function Section({ title, description, children, collapsible, defaultOpen = true, className = '', zone = 'gray' }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`section-zone ${zoneStyles[zone]} ${className} animate-fade-in`}>
      <div
        className={`flex items-start justify-between gap-3 mb-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => { if (collapsible) setOpen(o => !o); }}
      >
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {collapsible && (
          <div className="p-1 rounded-md hover:bg-gray-200/50 transition-colors shrink-0 mt-0.5">
            {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      {(!collapsible || open) && children}
    </div>
  );
}
