import { getAllMonths, monthLabel } from '../../lib/data';

interface MonthFilterProps {
  selected: string;
  onChange: (month: string) => void;
}

export default function MonthFilter({ selected, onChange }: MonthFilterProps) {
  const months = getAllMonths();
  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        <option value="">All Months</option>
        {months.map(m => (
          <option key={m} value={m}>{monthLabel(m)}</option>
        ))}
      </select>
    </div>
  );
}
