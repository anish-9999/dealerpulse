interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'bg-gray-100', text: 'text-gray-700' },
  contacted: { label: 'Contacted', bg: 'bg-blue-100', text: 'text-blue-700' },
  test_drive: { label: 'Test Drive', bg: 'bg-purple-100', text: 'text-purple-700' },
  negotiation: { label: 'Negotiation', bg: 'bg-amber-100', text: 'text-amber-700' },
  order_placed: { label: 'Order Placed', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  delivered: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700' },
  lost: { label: 'Lost', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
