import { useMemo } from 'react';
import { getDeliveryTrend } from '../lib/data';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const DELAY_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

interface DeliveryStats {
  total: number;
  withDelay: number;
  avgDays: number;
  delayReasons: Record<string, number>;
}

interface Props {
  deliveryStats: DeliveryStats;
}

export default function DashboardDelivery({ deliveryStats }: Props) {
  const deliveryTrend = useMemo(() => getDeliveryTrend(), []);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dashboard-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{deliveryStats.avgDays.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg Days</p>
        </div>
        <div className="dashboard-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{deliveryStats.withDelay}</p>
          <p className="text-xs text-gray-500">Delayed</p>
        </div>
        <div className="dashboard-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{deliveryStats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="dashboard-card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{deliveryStats.withDelay > 0 ? Math.round((deliveryStats.withDelay / deliveryStats.total) * 100) : 0}%</p>
          <p className="text-xs text-gray-500">Delay Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Delay Reasons</h3>
          <div className="flex items-center justify-center h-44">
            {Object.keys(deliveryStats.delayReasons).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(deliveryStats.delayReasons).map(([name, value]) => ({ name, value }))}
                    cx="50%" cy="50%" outerRadius={70} dataKey="value"
                    label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {Object.keys(deliveryStats.delayReasons).map((_, idx) => (
                      <Cell key={idx} fill={DELAY_COLORS[idx % DELAY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400">No delays recorded</p>
            )}
          </div>
          <div className="space-y-2 mt-2">
            {Object.entries(deliveryStats.delayReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <div key={reason} className="flex justify-between text-xs items-center">
                <span className="text-gray-600 truncate">{reason}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(count / deliveryStats.withDelay) * 100}%` }} />
                  </div>
                  <span className="font-medium text-gray-900 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          {deliveryTrend.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip formatter={(value: unknown) => [`${value}d`, 'Avg Days']} />
                  <Line type="monotone" dataKey="avgDays" name="Avg Days" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
