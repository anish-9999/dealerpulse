import { useMemo } from 'react';
import { PhoneCall, Telescope } from 'lucide-react';
import {
  getTimeToFirstContact, getStaleLeads, getDeliveryTrend,
} from '../lib/data';
import type { StaleLead } from '../lib/types';
import Section from '../components/shared/Section';
import StatusBadge from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/Misc';
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
  filteredLeads: import('../lib/types').Lead[];
  deliveryStats: DeliveryStats;
}

export default function DashboardOperations({ filteredLeads, deliveryStats }: Props) {
  const contactSpeed = useMemo(() => getTimeToFirstContact(filteredLeads), [filteredLeads]);
  const staleLeads = useMemo(() => getStaleLeads(filteredLeads, 7), [filteredLeads]);
  const deliveryTrend = useMemo(() => getDeliveryTrend(), []);

  const contactBuckets = useMemo(() => {
    const buckets = { under24: 0, under48: 0, over48: 0 };
    for (const lead of filteredLeads) {
      const contactedEntry = lead.status_history.find(h => h.status === 'contacted');
      if (!contactedEntry) continue;
      const created = new Date(lead.created_at).getTime();
      const contacted = new Date(contactedEntry.timestamp).getTime();
      const hours = (contacted - created) / (1000 * 60 * 60);
      if (hours <= 24) buckets.under24++;
      else if (hours <= 48) buckets.under48++;
      else buckets.over48++;
    }
    return buckets;
  }, [filteredLeads]);

  const topSlowLeads = useMemo(() => {
    return [...contactSpeed.slowLeads]
      .sort((a, b) => b.hoursWaited - a.hoursWaited)
      .slice(0, 10);
  }, [contactSpeed.slowLeads]);

  const totalContacted = contactBuckets.under24 + contactBuckets.under48 + contactBuckets.over48;

  return (
    <div className="space-y-2">
      {/* Section A — Response Speed */}
      <Section title="Response Speed" description="How quickly leads are contacted after sign-up" zone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <PhoneCall className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Time to First Contact</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-gray-900">{contactSpeed.avgHours}h</p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-gray-900">{contactSpeed.medianHours}h</p>
                <p className="text-xs text-gray-500">Median</p>
              </div>
            </div>

            {totalContacted > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Distribution</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">&lt; 24h</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(contactBuckets.under24 / totalContacted) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-medium text-gray-700 w-8 text-right">{contactBuckets.under24}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">24–48h</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(contactBuckets.under48 / totalContacted) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-medium text-gray-700 w-8 text-right">{contactBuckets.under48}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">48h+</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(contactBuckets.over48 / totalContacted) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-medium text-gray-700 w-8 text-right">{contactBuckets.over48}</span>
                  </div>
                </div>
              </div>
            )}

            {contactSpeed.byBranch.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">By Branch</p>
                {contactSpeed.byBranch.map(b => (
                  <div key={b.branchId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate">{b.branchName}</span>
                    <span className={`font-medium ${b.avgHours > contactSpeed.avgHours ? 'text-red-600' : 'text-green-600'}`}>
                      {b.avgHours}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <PhoneCall className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Longest Waiting (48h+)</h3>
            </div>
            {topSlowLeads.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{contactSpeed.slowLeads.length} leads waited 48h+ · showing top {topSlowLeads.length}</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {topSlowLeads.map(s => (
                    <div key={s.lead.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.lead.customer_name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.lead.model_interested} · {s.lead.source.replace('_', ' ')}</p>
                        <StatusBadge status={s.lead.status} />
                      </div>
                      <span className="text-xs font-medium text-red-600 whitespace-nowrap">{s.hoursWaited}h</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-xs text-gray-400">No leads waited 48h+</p>}
          </div>
        </div>
      </Section>

      {/* Section B — Stale Leads */}
      <Section title="Stale Leads" description="Active leads needing follow-up (7+ days idle)" zone="white">
        <div className="dashboard-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Telescope className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Stale Leads (7+ days)</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">{staleLeads.length}</span>
          </div>
          {staleLeads.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {staleLeads.slice(0, 10).map((s: StaleLead) => (
                <div key={s.lead.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.lead.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{s.branch.name} · {s.rep.name}</p>
                    <StatusBadge status={s.lead.status} />
                  </div>
                  <span className="text-xs font-medium text-red-600 whitespace-nowrap">{s.daysSinceLastActivity}d</span>
                </div>
              ))}
              {staleLeads.length > 10 && (
                <p className="text-xs text-center text-gray-400">+{staleLeads.length - 10} more</p>
              )}
            </div>
          ) : <EmptyState title="No stale leads" description="All active leads contacted recently" />}
        </div>
      </Section>

      {/* Section C — Fulfillment */}
      <Section title="Fulfillment" description="Delivery times, delays, and monthly trends" zone="white">
        {deliveryStats.total > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            {Object.keys(deliveryStats.delayReasons).length > 0 && (
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
            )}
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
        </>
        ) : (
          <div className="dashboard-card p-6 text-center">
            <p className="text-sm text-gray-500">No deliveries completed in this period</p>
            <p className="text-xs text-gray-400 mt-1">June is the first month in the dataset — deliveries typically take 18+ days, so none appear here. Try selecting a later month or "All months" to see fulfillment data.</p>
          </div>
        )}
      </Section>
    </div>
  );
}
