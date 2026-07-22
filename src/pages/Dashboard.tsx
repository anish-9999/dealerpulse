import { useState, useMemo } from 'react';
import { IndianRupee, Car, Users, Activity, TrendingUp, Clock, PhoneCall, Telescope, XCircle, BarChart3 } from 'lucide-react';
import {
  getBranches, getLeads, getTargets, getMonthlyTrend,
  computeBranchSummary, getConversionFunnel, getStaleLeads,
  getDashboardInsights, getDeliveryStats, getDeliveryTrend,
  monthLabel, leadsInRange, isActive,
  getSourcePerformance, getLostReasonBreakdown, getTimeToFirstContact
} from '../lib/data';
import type { BranchSummary, StaleLead, FunnelStage, SourceStats, LostReasonStats } from '../lib/types';
import KPICard from '../components/shared/KPICard';
import InsightCard from '../components/shared/InsightCard';
import HeadlineInsight from '../components/shared/HeadlineInsight';
import StatusBadge from '../components/shared/StatusBadge';
import MonthFilter from '../components/shared/MonthFilter';
import { EmptyState, ProgressBar } from '../components/shared/Misc';
import Leaderboard from '../components/shared/Leaderboard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const DELAY_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sortKey, setSortKey] = useState('wonLeads');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const branches = getBranches();
  const allLeads = useMemo(() => getLeads(), []);
  const filteredLeads = useMemo(() => leadsInRange(allLeads, selectedMonth), [allLeads, selectedMonth]);

  const branchSummaries = useMemo(
    () => branches.map(b => computeBranchSummary(b.id, selectedMonth)),
    [branches, selectedMonth]
  );

  const funnel = useMemo(() => getConversionFunnel(filteredLeads), [filteredLeads]);
  const staleLeads = useMemo(() => getStaleLeads(filteredLeads, 7), [filteredLeads]);
  const insights = useMemo(() => getDashboardInsights(selectedMonth), [selectedMonth]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(allLeads, getTargets()), [allLeads]);
  const deliveryStats = useMemo(() => getDeliveryStats(), []);
  const deliveryTrend = useMemo(() => getDeliveryTrend(), []);
  const sourcePerf = useMemo(() => getSourcePerformance(filteredLeads), [filteredLeads]);
  const lostReasons = useMemo(() => getLostReasonBreakdown(filteredLeads), [filteredLeads]);
  const contactSpeed = useMemo(() => getTimeToFirstContact(filteredLeads), [filteredLeads]);

  const totalRevenue = branchSummaries.reduce((s, b) => s + b.totalRevenue, 0);
  const totalWon = branchSummaries.reduce((s, b) => s + b.wonLeads, 0);
  const totalActive = branchSummaries.reduce((s, b) => s + b.activeLeads, 0);
  const totalLeads = branchSummaries.reduce((s, b) => s + b.totalLeads, 0);
  const totalConversion = totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0;
  const totalDelivered = filteredLeads.filter(l => l.status === 'delivered').length;
  const totalOrderPlaced = filteredLeads.filter(l => l.status === 'order_placed').length;

  const pipelineValue = filteredLeads
    .filter(l => isActive(l.status))
    .reduce((s, l) => s + l.deal_value, 0);

  const sortedBranches = useMemo(() => {
    const sorted = [...branchSummaries];
    sorted.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'name': return sortDir === 'asc' ? a.branch.name.localeCompare(b.branch.name) : b.branch.name.localeCompare(a.branch.name);
        case 'city': return sortDir === 'asc' ? a.branch.city.localeCompare(b.branch.city) : b.branch.city.localeCompare(a.branch.city);
        case 'totalLeads': aVal = a.totalLeads; bVal = b.totalLeads; break;
        case 'wonLeads': aVal = a.wonLeads; bVal = b.wonLeads; break;
        case 'totalRevenue': aVal = a.totalRevenue; bVal = b.totalRevenue; break;
        case 'targetUnits': aVal = a.targetUnits; bVal = b.targetUnits; break;
        case 'unitsProgress': aVal = a.unitsProgress; bVal = b.unitsProgress; break;
        case 'conversionRate': aVal = a.conversionRate; bVal = b.conversionRate; break;
        default: aVal = a.wonLeads; bVal = b.wonLeads;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [branchSummaries, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ column }: { column: string }) {
    if (sortKey !== column) return <span className="ml-1 text-gray-300">⇅</span>;
    return <span className="ml-1 text-brand-600">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Overview Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedMonth ? monthLabel(selectedMonth) : 'All months (Jun–Dec 2025)'} · {totalLeads} leads
          </p>
        </div>
        <MonthFilter selected={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Headline Insight */}
      <HeadlineInsight insights={insights} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <KPICard title="Revenue" value={`₹${(totalRevenue / 10000000).toFixed(1)}Cr`} icon={<IndianRupee className="w-4 h-4" />} color="green" />
        <KPICard title="Units Sold" value={totalWon} subtitle={`${totalDelivered} delivered · ${totalOrderPlaced} orders`} icon={<Car className="w-4 h-4" />} color="blue" tooltip="Won = Delivered + Order Placed (payment received, awaiting delivery)" />
        <KPICard title="Conversion" value={`${totalConversion.toFixed(1)}%`} icon={<Activity className="w-4 h-4" />} color="purple" />
        <KPICard title="Active Leads" value={totalActive} icon={<Users className="w-4 h-4" />} color="amber" />
        <KPICard title="Pipeline Value" value={`₹${(pipelineValue / 10000000).toFixed(1)}Cr`} icon={<TrendingUp className="w-4 h-4" />} color="blue" />
        <KPICard title="Avg Delivery" value={`${deliveryStats.avgDays.toFixed(1)}d`} subtitle={`${deliveryStats.total} deliveries`} icon={<Clock className="w-4 h-4" />} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue vs Target</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 10000000).toFixed(2)}Cr`} />
                <Tooltip formatter={(value: unknown) => [`₹${(Number(value) / 10000000).toFixed(2)}Cr`, '']} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="targetRevenue" name="Target" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          {funnel.length > 0 ? (
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart data={funnel} />
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="No data" />}
        </div>
      </div>

      {/* Source Performance + Lost Reason Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Source Performance</h3>
          </div>
          {sourcePerf.length > 0 ? (
            <div className="space-y-4">
              {sourcePerf.map((s: SourceStats) => {
                const barPct = sourcePerf[0]?.totalLeads > 0 ? (s.totalLeads / sourcePerf[0].totalLeads) * 100 : 0;
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 capitalize">{s.source.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500">{s.totalLeads} leads · {s.conversionRate.toFixed(2)}% conv</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(barPct, 3)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">₹{(s.avgDealValue / 100000).toFixed(2)}L</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="No source data" />}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Lost Reason Analysis</h3>
          </div>
          {lostReasons.length > 0 ? (
            <div className="space-y-3">
              {lostReasons.slice(0, 6).map((r: LostReasonStats) => (
                <div key={r.reason} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-gray-900 truncate">{r.reason}</span>
                      <span className="text-xs font-medium text-gray-500 shrink-0">{r.count} lost</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.max(r.percentOfLost, 2)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-red-600 w-16 text-right">₹{(r.totalValueLost / 10000000).toFixed(1)}Cr</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No lost lead data" />}
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Branch Performance vs Targets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 md:px-5 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('name')}>Branch<SortIcon column="name" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('city')}>City<SortIcon column="city" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('totalLeads')}>Leads<SortIcon column="totalLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('wonLeads')}>Won<SortIcon column="wonLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('totalRevenue')}>Revenue<SortIcon column="totalRevenue" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('targetUnits')}>Target Units<SortIcon column="targetUnits" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('unitsProgress')}>Progress<SortIcon column="unitsProgress" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('conversionRate')}>Conv.<SortIcon column="conversionRate" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBranches.map((s: BranchSummary) => (
                <tr key={s.branch.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.hash = `/branch/${s.branch.id}`}>
                  <td className="px-4 md:px-5 py-3 font-medium text-gray-900">{s.branch.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.branch.city}</td>
                  <td className="px-4 py-3 text-right">{s.totalLeads}</td>
                  <td className="px-4 py-3 text-right font-medium">{s.wonLeads}</td>
                  <td className="px-4 py-3 text-right">₹{(s.totalRevenue / 10000000).toFixed(1)}Cr</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.targetUnits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xs font-medium ${s.unitsProgress >= 100 ? 'text-green-600' : s.unitsProgress >= 70 ? 'text-brand-600' : 'text-red-600'}`}>
                        {Math.round(s.unitsProgress)}%
                      </span>
                      <ProgressBar value={s.unitsAchieved} max={s.targetUnits} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{s.conversionRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">All Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} type={insight.type} title={insight.text} />
            ))}
          </div>
        </div>
      )}

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time to First Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
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
          {contactSpeed.slowLeads.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-red-600 mb-2">{contactSpeed.slowLeads.length} leads waited 48h+</p>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {contactSpeed.slowLeads.slice(0, 5).map(s => (
                  <div key={s.lead.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{s.lead.customer_name}</span>
                    <span className="font-medium text-red-600">{s.hoursWaited}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stale Leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
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

        {/* Branch Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Branch Leaderboard</h3>
          <Leaderboard
            items={branchSummaries.sort((a, b) => b.wonLeads - a.wonLeads).map(s => ({
              id: s.branch.id,
              label: s.branch.name,
              subtitle: s.branch.city,
              value: s.wonLeads,
              suffix: 'won',
              href: `/branch/${s.branch.id}`,
              progress: s.unitsProgress,
            }))}
          />
        </div>
      </div>

      {/* Delivery Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Delivery Health</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-gray-900">{deliveryStats.avgDays.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Avg Days</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-amber-600">{deliveryStats.withDelay}</p>
                <p className="text-xs text-gray-500">Delayed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-gray-900">{deliveryStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-gray-900">{deliveryStats.withDelay > 0 ? Math.round((deliveryStats.withDelay / deliveryStats.total) * 100) : 0}%</p>
                <p className="text-xs text-gray-500">Delay Rate</p>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={Object.entries(deliveryStats.delayReasons).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(2)}%`}>
                    {Object.keys(deliveryStats.delayReasons).map((_, idx) => (<Cell key={idx} fill={DELAY_COLORS[idx % DELAY_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {Object.entries(deliveryStats.delayReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex justify-between text-xs items-center">
                  <span className="text-gray-600 truncate">{reason}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${(count / deliveryStats.withDelay) * 100}%` }} />
                    </div>
                    <span className="font-medium text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Monthly Delivery Trend */}
          {deliveryTrend.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Monthly Avg Days Trend</p>
              <div className="h-40">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelChart({ data }: { data: FunnelStage[] }) {
  const reversed = [...data].reverse();
  return (
    <div className="flex flex-col justify-center h-full gap-1.5">
      {reversed.map((stage) => {
        const pct = data[0]?.count > 0 ? (stage.count / data[0].count) * 100 : 0;
        return (
          <div key={stage.name} className="flex items-center gap-3">
            <span className="text-xs font-medium w-20 text-right text-gray-600 shrink-0">{stage.name.replace('_', ' ')}</span>
            <div className="flex-1 h-7 rounded bg-gray-100 overflow-hidden relative">
              <div className="h-full rounded transition-all bg-brand-500 flex items-center justify-end px-2" style={{ width: `${Math.max(pct, 5)}%` }}>
                <span className="text-xs font-semibold text-white">{stage.count}</span>
              </div>
            </div>
            {stage.lostCount > 0 && <span className="text-xs text-red-500 w-16 shrink-0">-{stage.lostCount} lost</span>}
          </div>
        );
      })}
    </div>
  );
}
