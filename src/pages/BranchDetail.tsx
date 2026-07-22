import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  getBranchById, getLeadsByBranch, computeBranchSummary,
  getRepsByBranch, computeRepSummary, getStaleLeads,
  getConversionFunnel, getTargetsForBranch,
  getMonthlyTrend, leadsInRange, isWon,
  computeBranchComparison, getTeamRoster,
  getLostReasonBreakdown
} from '../lib/data';

import InsightCard from '../components/shared/InsightCard';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import KPICard from '../components/shared/KPICard';
import StatusBadge from '../components/shared/StatusBadge';
import MonthFilter from '../components/shared/MonthFilter';
import { EmptyState, ProgressBar } from '../components/shared/Misc';
import Leaderboard from '../components/shared/Leaderboard';
import RosterCard from '../components/shared/RosterCard';
import { IndianRupee, Car, Users, Target, Clock, Activity, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedMonth, setSelectedMonth] = useState('');
  const branch = getBranchById(id!);

  if (!branch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold">Branch not found</h2>
        <Link to="/" className="text-brand-600 text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const allLeads = useMemo(() => getLeadsByBranch(branch.id), [branch.id]);
  const filteredLeads = useMemo(() => leadsInRange(allLeads, selectedMonth), [allLeads, selectedMonth]);
  const summary = useMemo(() => computeBranchSummary(branch.id, selectedMonth), [branch.id, selectedMonth]);
  const reps = useMemo(() => getRepsByBranch(branch.id), [branch.id]);
  const repSummaries = useMemo(() => reps.map(r => computeRepSummary(r.id, selectedMonth)), [reps, selectedMonth]);
  const staleLeads = useMemo(() => getStaleLeads(filteredLeads, 7), [filteredLeads]);
  const funnel = useMemo(() => getConversionFunnel(filteredLeads), [filteredLeads]);
  const wonInBranch = filteredLeads.filter(l => isWon(l.status));
  const branchDelivered = wonInBranch.filter(l => l.status === 'delivered').length;
  const branchOrderPlaced = wonInBranch.filter(l => l.status === 'order_placed').length;
  const allTargets = useMemo(() => getTargetsForBranch(branch.id), [branch.id]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(allLeads, allTargets), [allLeads, allTargets]);
  const comparison = useMemo(() => computeBranchComparison(branch.id, selectedMonth), [branch.id, selectedMonth]);
  const roster = useMemo(() => getTeamRoster(branch.id), [branch.id]);
  const lostReasons = useMemo(() => getLostReasonBreakdown(filteredLeads, branch.id), [filteredLeads, branch.id]);

  const officerMetrics: Record<string, { conversionRate: number; wonLeads: number }> = {};
  for (const officer of roster.officers) {
    const s = computeRepSummary(officer.id, selectedMonth);
    officerMetrics[officer.id] = { conversionRate: s.conversionRate, wonLeads: s.wonLeads };
  }
  const managerMetrics = (() => {
    const s = computeRepSummary(roster.manager.id, selectedMonth);
    return { conversionRate: s.conversionRate, wonLeads: s.wonLeads };
  })();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: branch.name },
      ]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{branch.name}</h1>
          <p className="text-sm text-gray-500">{branch.city} · {reps.length} reps · {allLeads.length} total leads</p>
        </div>
        <MonthFilter selected={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <KPICard title="Revenue" value={`₹${(summary.totalRevenue / 10000000).toFixed(2)}Cr`} icon={<IndianRupee className="w-4 h-4" />} color="green" />
        <KPICard title="Units Won" value={summary.wonLeads} subtitle={`${branchDelivered} delivered · ${branchOrderPlaced} orders`} icon={<Car className="w-4 h-4" />} color="blue" tooltip="Won = Delivered + Order Placed (payment received, awaiting delivery)" />
        <KPICard title="Active Leads" value={summary.activeLeads} icon={<Users className="w-4 h-4" />} color="amber" />
        <KPICard title="Conversion" value={`${summary.conversionRate.toFixed(2)}%`} icon={<Activity className="w-4 h-4" />} color="purple" />
        <KPICard title="Target Units" value={summary.targetUnits} subtitle={`${summary.unitsAchieved} achieved`} icon={<Target className="w-4 h-4" />} color="red" />
        <KPICard title="Target Progress" value={`${Math.round(summary.unitsProgress)}%`} icon={<Clock className="w-4 h-4" />} color={summary.unitsProgress >= 70 ? 'green' : 'red'} />
      </div>

      {/* Progress bar */}
      {summary.targetUnits > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Unit Target Progress</h3>
            <span className="text-sm font-bold text-gray-900">{summary.unitsAchieved} / {summary.targetUnits}</span>
          </div>
          <ProgressBar value={summary.unitsAchieved} max={summary.targetUnits} size="md" />
          <p className="text-xs text-gray-500 mt-1.5">
            {summary.unitsProgress >= 100 ? 'Target achieved! 🎉' :
             summary.unitsProgress >= 70 ? 'On track to meet target' :
             `Behind target — ${Math.round(summary.targetUnits - summary.unitsAchieved)} more units needed`}
          </p>
        </div>
      )}

      {/* Branch vs Network Average */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <ComparisonCard
            label="Conversion Rate"
            branchValue={`${comparison.branch.conversionRate.toFixed(2)}%`}
            networkValue={`${comparison.networkAvg.conversionRate.toFixed(2)}%`}
            isAbove={comparison.branch.conversionRate > comparison.networkAvg.conversionRate}
            diff={Math.abs(comparison.branch.conversionRate - comparison.networkAvg.conversionRate).toFixed(2)}
            unit="pts"
          />
          <ComparisonCard
            label="Avg Deal Value"
            branchValue={`₹${(comparison.branch.totalRevenue / Math.max(comparison.branch.wonLeads, 1) / 100000).toFixed(2)}L`}
            networkValue={`₹${(comparison.networkAvg.avgDealValue / 100000).toFixed(2)}L`}
            isAbove={comparison.branch.wonLeads > 0 && (comparison.branch.totalRevenue / comparison.branch.wonLeads) > comparison.networkAvg.avgDealValue}
            diff={`₹${Math.abs((comparison.branch.totalRevenue / Math.max(comparison.branch.wonLeads, 1) - comparison.networkAvg.avgDealValue) / 100000).toFixed(2)}L`}
            unit=""
          />
          <ComparisonCard
            label="Units Won"
            branchValue={comparison.branch.wonLeads}
            networkValue={comparison.networkAvg.unitsWon.toFixed(2)}
            isAbove={comparison.branch.wonLeads > comparison.networkAvg.unitsWon}
            diff={(Math.abs(comparison.branch.wonLeads - comparison.networkAvg.unitsWon)).toFixed(2)}
            unit="units"
          />
        </div>
      )}

      {/* Insights for this branch */}
      {staleLeads.length > 0 && (
        <InsightCard type="alert" title={`${staleLeads.length} stale lead${staleLeads.length > 1 ? 's' : ''} need attention`} />
      )}
      {summary.conversionRate < 20 && summary.totalLeads > 5 && (
        <InsightCard type="alert" title={`Low conversion rate (${summary.conversionRate.toFixed(2)}%) — review lead quality`} />
      )}

      {/* Monthly trend chart */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="won" name="Won" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team Roster */}
      <RosterCard manager={roster.manager} officers={roster.officers} managerMetrics={managerMetrics} officerMetrics={officerMetrics} />

      {/* Rep Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Rep Performance</h3>
        {repSummaries.length > 0 ? (
          <Leaderboard
            items={repSummaries
              .sort((a, b) => b.wonLeads - a.wonLeads)
              .map(r => ({
                id: r.rep.id,
                label: r.rep.name,
                subtitle: r.rep.role === 'branch_manager' ? 'Manager' : 'Sales Officer',
                value: r.wonLeads,
                suffix: 'won',
                href: `/rep/${r.rep.id}`,
                secondaryValue: `₹${(r.totalRevenue / 100000).toFixed(0)}L · ${r.conversionRate.toFixed(0)}% conv`,
              }))}
          />
        ) : <EmptyState title="No rep data" />}
      </div>

      {/* Lead status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Status Breakdown</h3>
          <div className="space-y-3">
            {['new', 'contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered', 'lost'].map(status => {
              const count = filteredLeads.filter(l => l.status === status).length;
              const pct = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded bg-brand-500" style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales funnel for this branch */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          {funnel.length > 0 ? (
            <div className="space-y-2">
              {funnel.map((stage) => (
                <div key={stage.name} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-24 text-right text-gray-600">{stage.name.replace('_', ' ')}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded bg-brand-500 flex items-center justify-end px-2"
                      style={{ width: `${Math.max((stage.count / Math.max(funnel[0].count, 1)) * 100, 3)}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{stage.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No pipeline data" />}
        </div>
      </div>

      {/* Lost Reason Analysis */}
      {lostReasons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Lost Reason Analysis</h3>
          </div>
          <div className="space-y-3">
            {lostReasons.slice(0, 6).map(r => (
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
                <span className="text-xs font-semibold text-red-600 w-16 text-right">₹{(r.totalValueLost / 10000000).toFixed(2)}Cr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale leads for this branch */}
      {staleLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Leads Needing Follow-up</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">{staleLeads.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase">Customer</th>
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase">Rep</th>
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase">Stage</th>
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase text-right">Stale (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staleLeads.map(s => (
                  <tr key={s.lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{s.lead.customer_name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.rep.name}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={s.lead.status} /></td>
                    <td className="px-3 py-2.5 text-right text-red-600 font-medium">{s.daysSinceLastActivity}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ label, branchValue, networkValue, isAbove, diff, unit }: {
  label: string;
  branchValue: string | number;
  networkValue: string;
  isAbove: boolean;
  diff: string;
  unit: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This branch</span>
          <span className="text-lg font-bold text-gray-900">{branchValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Network avg</span>
          <span className="text-sm font-medium text-gray-500">{networkValue}</span>
        </div>
        <div className={`flex items-center justify-between pt-1 border-t border-gray-100 text-xs font-medium ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
          <span>{isAbove ? 'Above avg' : 'Below avg'}</span>
          <span>{isAbove ? '+' : '-'}{diff}{unit && ` ${unit}`}</span>
        </div>
      </div>
    </div>
  );
}
