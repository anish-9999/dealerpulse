import { useMemo, useState } from 'react';
import {
  getBranches, getLeads, getTargets, getMonthlyTrend,
  computeBranchSummary,
} from '../lib/data';
import type { BranchSummary } from '../lib/types';
import Section from '../components/shared/Section';
import InsightCard from '../components/shared/InsightCard';
import { ProgressBar } from '../components/shared/Misc';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Line,
} from 'recharts';

const BRANCH_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
const BRANCH_COLORS_MAP: Record<string, string> = {};

interface Props {
  selectedMonth: string;
  totalLeads: number;
  totalRevenue: number;
  totalWon: number;
  totalActive: number;
  pipelineValue: number;
  totalDelivered: number;
  totalConversion: number;
  deliveryStats: { avgDays: number; total: number };
  insights: { type: 'alert' | 'tip' | 'info'; text: string; tab?: string }[];
}

export default function DashboardBusinessHealth({ selectedMonth, totalLeads, totalRevenue, totalWon, totalActive, pipelineValue, totalDelivered, totalConversion, deliveryStats, insights }: Props) {
  const [sortKey, setSortKey] = useState('wonLeads');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const branches = getBranches();
  const allLeads = useMemo(() => getLeads(), []);
  const monthlyTrend = useMemo(() => getMonthlyTrend(allLeads, getTargets()), [allLeads]);

  branches.forEach((b, i) => { BRANCH_COLORS_MAP[b.id] = BRANCH_COLORS[i % BRANCH_COLORS.length]; });

  const branchSummaries = useMemo(
    () => branches.map(b => computeBranchSummary(b.id, selectedMonth)),
    [branches, selectedMonth]
  );

  const revenueStacked = useMemo(() => {
    return monthlyTrend.map(m => {
      const entry: Record<string, number | string> = { month: m.label };
      let totalTarget = 0;
      for (const b of branches) {
        const bSummary = computeBranchSummary(b.id, m.month);
        entry[b.id] = bSummary.totalRevenue;
        totalTarget += bSummary.targetRevenue;
      }
      entry.target = totalTarget;
      return entry;
    });
  }, [monthlyTrend, branches]);

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
        case 'avgDealValue': aVal = a.wonLeads > 0 ? a.totalRevenue / a.wonLeads : 0; bVal = b.wonLeads > 0 ? b.totalRevenue / b.wonLeads : 0; break;
        case 'targetUnits': aVal = a.targetUnits; bVal = b.targetUnits; break;
        case 'unitsProgress': aVal = a.unitsProgress; bVal = b.unitsProgress; break;
        case 'targetRevenue': aVal = a.targetRevenue; bVal = b.targetRevenue; break;
        case 'revenueProgress': aVal = a.revenueProgress; bVal = b.revenueProgress; break;
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
    <div className="space-y-2">
      {/* Hero row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
          <p className="text-xs text-gray-400 mt-1">{totalWon} units</p>
        </div>
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalWon}</p>
          <p className="text-xs text-gray-400 mt-1">{totalDelivered} delivered</p>
        </div>
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">{totalConversion.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{totalWon} won / {totalLeads} leads</p>
        </div>
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Leads</p>
          <p className="text-xl md:text-2xl font-bold text-brand-600 mt-1">{totalActive}</p>
          <p className="text-xs text-gray-400 mt-1">in pipeline</p>
        </div>
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pipeline Value</p>
          <p className="text-xl md:text-2xl font-bold text-brand-600 mt-1">₹{(pipelineValue / 10000000).toFixed(1)}Cr</p>
          <p className="text-xs text-gray-400 mt-1">{totalActive} active leads</p>
        </div>
        <div className="dashboard-card p-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Delivery</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{deliveryStats.avgDays.toFixed(1)}d</p>
          <p className="text-xs text-gray-400 mt-1">{deliveryStats.total} deliveries</p>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <Section title="Key Insights" zone="white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <InsightCard
                key={i}
                type={insight.type}
                title={insight.text}
                href={insight.tab ? `#/?tab=${insight.tab}` : undefined}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Revenue Stacked Chart */}
      <Section title="Revenue Overview" description="Branch-wise revenue contribution with network target" zone="white">
        <div className="dashboard-card p-4 md:p-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueStacked}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 10000000).toFixed(2)}Cr`} />
                <Tooltip formatter={(value: unknown) => [`₹${(Number(value) / 10000000).toFixed(2)}Cr`, '']} />
                <Legend />
                {branches.map((b, i) => (
                  <Bar key={b.id} dataKey={b.id} name={b.name} stackId="rev" fill={BRANCH_COLORS[i]} />
                ))}
                <Line type="monotone" dataKey="target" name="Target" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Branch Table */}
      <Section title="Branch Performance" description="Sortable view of all branches vs targets" zone="white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 md:px-5 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('name')}>Branch<SortIcon column="name" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('city')}>City<SortIcon column="city" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('totalLeads')}>Leads<SortIcon column="totalLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('wonLeads')}>Won<SortIcon column="wonLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('totalRevenue')}>Revenue<SortIcon column="totalRevenue" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('avgDealValue')}>Avg Deal<SortIcon column="avgDealValue" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('targetUnits')}>Target Units<SortIcon column="targetUnits" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('unitsProgress')}>Progress<SortIcon column="unitsProgress" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('targetRevenue')}>Target Rev<SortIcon column="targetRevenue" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('revenueProgress')}>Rev %<SortIcon column="revenueProgress" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700 transition-colors" onClick={() => toggleSort('conversionRate')}>Conv.<SortIcon column="conversionRate" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBranches.map((s: BranchSummary) => (
                <tr key={s.branch.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { window.location.hash = `/branch/${s.branch.id}${selectedMonth ? `?month=${selectedMonth}` : ''}`; window.scrollTo(0, 0); }}>
                  <td className="px-4 md:px-5 py-3 font-medium text-gray-900">{s.branch.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.branch.city}</td>
                  <td className="px-4 py-3 text-right">{s.totalLeads}</td>
                  <td className="px-4 py-3 text-right font-medium">{s.wonLeads}</td>
                  <td className="px-4 py-3 text-right">₹{(s.totalRevenue / 10000000).toFixed(1)}Cr</td>
                  <td className="px-4 py-3 text-right font-medium">{s.wonLeads > 0 ? `₹${(s.totalRevenue / s.wonLeads / 100000).toFixed(2)}L` : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.targetUnits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xs font-medium ${s.unitsProgress >= 100 ? 'text-green-600' : s.unitsProgress >= 70 ? 'text-brand-600' : 'text-red-600'}`}>
                        {Math.round(s.unitsProgress)}%
                      </span>
                      <ProgressBar value={s.unitsAchieved} max={s.targetUnits} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">₹{(s.targetRevenue / 10000000).toFixed(1)}Cr</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xs font-medium ${s.revenueProgress >= 100 ? 'text-green-600' : s.revenueProgress >= 70 ? 'text-brand-600' : 'text-red-600'}`}>
                        {Math.round(s.revenueProgress)}%
                      </span>
                      <ProgressBar value={s.revenueAchieved} max={s.targetRevenue} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{s.conversionRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
