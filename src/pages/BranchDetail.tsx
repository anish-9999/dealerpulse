import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import {
  getBranchById, getLeadsByBranch, computeBranchSummary,
  getRepsByBranch, computeRepSummary, getStaleLeads,
  getConversionFunnel, getTargetsForBranch,
  getMonthlyTrend, leadsInRange, isWon,
  computeBranchComparison, getTeamRoster,
  getLostReasonBreakdown, getModelPerformance
} from '../lib/data';
import InsightCard from '../components/shared/InsightCard';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import KPICard from '../components/shared/KPICard';
import StatusBadge from '../components/shared/StatusBadge';
import MonthFilter from '../components/shared/MonthFilter';
import Section from '../components/shared/Section';
import { EmptyState, ProgressBar } from '../components/shared/Misc';
import { IndianRupee, Car, Users, Target, Clock, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonth = searchParams.get('month') || '';
  const [selectedMonth, setSelectedMonth] = useState(urlMonth);
  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    if (m) setSearchParams({ month: m });
    else setSearchParams({});
  };
  useEffect(() => { window.scrollTo(0, 0); }, []);
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
  const modelPerf = useMemo(() => getModelPerformance(branch.id, selectedMonth), [branch.id, selectedMonth]);

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
    <div className="space-y-2">
      <Breadcrumbs homeHref={`/${selectedMonth ? `?month=${selectedMonth}` : ''}`} items={[
        { label: 'Dashboard', href: `/${selectedMonth ? `?month=${selectedMonth}` : ''}` },
        { label: branch.name },
      ]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{branch.name}</h1>
          <p className="text-sm text-gray-500">{branch.city} · {reps.length} reps · {allLeads.length} total leads</p>
        </div>
        <MonthFilter selected={selectedMonth} onChange={handleMonthChange} />
      </div>

      {/* KPIs */}
      <Section title="Key Metrics" description={`${branch.name} monthly performance`} zone="white">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <KPICard title="Revenue" value={`₹${(summary.totalRevenue / 10000000).toFixed(2)}Cr`} icon={<IndianRupee className="w-4 h-4" />} color="green" />
          <KPICard title="Units Won" value={summary.wonLeads} subtitle={`${branchDelivered} delivered · ${branchOrderPlaced} orders`} icon={<Car className="w-4 h-4" />} color="blue" tooltip="Won = Delivered + Order Placed (payment received, awaiting delivery)" />
          <KPICard title="Active Leads" value={summary.activeLeads} icon={<Users className="w-4 h-4" />} color="amber" />
          <KPICard title="Lead Conv. Rate" value={`${summary.conversionRate.toFixed(2)}%`} subtitle={`${summary.totalLeads} leads`} icon={<Activity className="w-4 h-4" />} color="purple" tooltip="Percentage of leads created this month that have since closed as a win (not necessarily in the same month)." />
          <KPICard title="Target Units" value={summary.targetUnits} subtitle={`${summary.unitsAchieved} achieved`} icon={<Target className="w-4 h-4" />} color="red" />
          <KPICard title="Target Progress" value={`${Math.round(summary.unitsProgress)}%`} icon={<Clock className="w-4 h-4" />} color={summary.unitsProgress >= 70 ? 'green' : 'red'} />
        </div>
      </Section>

      {/* Progress bar */}
      {summary.targetUnits > 0 && (
        <div className="dashboard-card p-4 md:p-5">
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
        <Section title="vs Network Average" description={`How ${branch.name} compares to the network benchmark`} zone="white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ComparisonCard
              label="Lead Conv. Rate"
              branchValue={`${comparison.branch.conversionRate.toFixed(2)}%`}
              subtitle={`${comparison.branch.totalLeads} leads`}
              tooltip="Percentage of leads created this month that have since closed as a win (not necessarily in the same month)."
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
        </Section>
      )}

      {/* Insights */}
      {staleLeads.length > 0 && (
        <InsightCard type="alert" title={`${staleLeads.length} stale lead${staleLeads.length > 1 ? 's' : ''} need attention`} />
      )}
      {summary.conversionRate < 20 && summary.totalLeads > 5 && (
        <InsightCard type="alert" title={`Low conversion rate (${summary.conversionRate.toFixed(2)}%) — review lead quality`} />
      )}

      {/* Monthly trend + Team Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monthlyTrend.length > 0 && (
          <div className="dashboard-card p-4 md:p-5">
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

        <div className="dashboard-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Team</h3>

          {/* Manager row */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100 mb-5">
            <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-700">M</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{roster.manager.name}</p>
              <p className="text-xs text-gray-500">Manager · Joined {roster.manager.joined}</p>
            </div>
            <div className="text-right text-xs shrink-0">
              <p className="font-semibold text-gray-900">{managerMetrics?.wonLeads ?? 0} won</p>
              <p className="text-gray-500">{managerMetrics ? `₹${(managerMetrics.wonLeads > 0 ? computeRepSummary(roster.manager.id, selectedMonth).totalRevenue / 100000 : 0).toFixed(0)}L` : '—'} · {managerMetrics?.conversionRate.toFixed(1) ?? '—'}%</p>
            </div>
          </div>

          {/* Officers table */}
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">
            Sales Officers ({roster.officers.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left font-medium pb-2 pr-2 w-8">#</th>
                  <th className="text-left font-medium pb-2 pr-3">Name</th>
                  <th className="text-right font-medium pb-2 pr-3">Won</th>
                  <th className="text-right font-medium pb-2 pr-3">Revenue</th>
                  <th className="text-right font-medium pb-2">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {[...roster.officers]
                  .sort((a, b) => {
                    const aWon = officerMetrics[a.id]?.wonLeads ?? 0;
                    const bWon = officerMetrics[b.id]?.wonLeads ?? 0;
                    return bWon - aWon;
                  })
                  .map((officer, i) => {
                    const metrics = officerMetrics[officer.id];
                    const repSummary = repSummaries.find(r => r.rep.id === officer.id);
                    return (
                      <tr key={officer.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { window.location.hash = `/rep/${officer.id}${selectedMonth ? `?month=${selectedMonth}` : ''}`; window.scrollTo(0, 0); }}>
                        <td className="py-2.5 pr-2 text-gray-400 text-xs w-8">{i + 1}</td>
                        <td className="py-2.5 pr-3">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{officer.name}</p>
                            <p className="text-xs text-gray-500">Joined {officer.joined}</p>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-medium">{metrics?.wonLeads ?? 0}</td>
                        <td className="py-2.5 pr-3 text-right font-medium">₹{(repSummary?.totalRevenue ?? 0) > 0 ? `${((repSummary?.totalRevenue ?? 0) / 100000).toFixed(0)}L` : '—'}</td>
                        <td className="py-2.5 text-right font-medium">{metrics?.conversionRate.toFixed(1) ?? '—'}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pipeline + Lost Reasons */}
      <Section title="Pipeline" description="Stage progression and why deals are lost" zone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
            {funnel.length > 0 ? (() => {
              const stages = [...funnel].reverse().map(stage => {
                const flowedCount = stage.count - stage.stuckCount - stage.lostCount;
                const isWon = stage.name === 'order_placed' || stage.name === 'delivered';
                const isTerminal = stage.name === 'delivered';
                const idleCount = stage.stuckCount;
                const lostCount = isWon ? 0 : stage.lostCount;
                const total = isTerminal ? stage.count : flowedCount + idleCount + lostCount;
                return { ...stage, flowedCount, idleCount, lostCount, total, isTerminal, isWon };
              });
              const maxCount = Math.max(...stages.map(s => s.total));

              return (
                <>
                  <div className="flex gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--funnel-progressed)' }} /> Progressed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--funnel-idle)' }} /> Idle</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--funnel-lost)' }} /> Lost</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--funnel-delivered)' }} /> Delivered</span>
                  </div>
                  <div className="space-y-3">
                    {stages.map(s => {
                      const barWidth = `${(s.total / maxCount) * 100}%`;
                      const showNum = (val: number, total: number) => (val / total) * 100 > 8;
                      return (
                        <div key={s.name} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-24 text-right text-gray-600 shrink-0">{s.name.replace('_', ' ')}</span>
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <div className="h-7 bg-gray-100 rounded-full overflow-hidden flex shrink-0" style={{ width: barWidth }}>
                              {s.isTerminal ? (
                                <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--funnel-delivered)' }}>
                                  <span className="text-xs font-semibold text-white">{s.count}</span>
                                </div>
                              ) : (
                                <>
                                  {s.flowedCount > 0 && (
                                    <div className="h-full flex items-center justify-center transition-all shrink-0" style={{ width: `${(s.flowedCount / s.total) * 100}%`, backgroundColor: 'var(--funnel-progressed)' }}>
                                      {showNum(s.flowedCount, s.total) && <span className="text-xs font-semibold text-white">{s.flowedCount}</span>}
                                    </div>
                                  )}
                                  {s.idleCount > 0 && (
                                    <div className="h-full flex items-center justify-center transition-all shrink-0" style={{ width: `${(s.idleCount / s.total) * 100}%`, backgroundColor: 'var(--funnel-idle)' }}>
                                      {showNum(s.idleCount, s.total) && <span className="text-xs font-semibold text-amber-900">{s.idleCount}</span>}
                                    </div>
                                  )}
                                  {s.lostCount > 0 && (
                                    <div className="h-full flex items-center justify-center transition-all shrink-0" style={{ width: `${(s.lostCount / s.total) * 100}%`, backgroundColor: 'var(--funnel-lost)' }}>
                                      {showNum(s.lostCount, s.total) && <span className="text-xs font-semibold text-white">{s.lostCount}</span>}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            {!s.isTerminal && s.flowedCount > 0 && !showNum(s.flowedCount, s.total) && <span className="text-xs text-gray-500 shrink-0">{s.flowedCount}</span>}
                            {!s.isTerminal && s.idleCount > 0 && !showNum(s.idleCount, s.total) && <span className="text-xs text-amber-700 shrink-0">{s.idleCount}</span>}
                            {!s.isTerminal && s.lostCount > 0 && !showNum(s.lostCount, s.total) && <span className="text-xs text-red-500 shrink-0">{s.lostCount}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })() : <EmptyState title="No pipeline data" />}
          </div>

          {lostReasons.length > 0 && (
            <div className="dashboard-card p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Lost Reason Analysis</h3>
              <div className="space-y-3">
                {lostReasons.slice(0, 6).map(r => (
                  <div key={r.reason} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-900 truncate">{r.reason}</span>
                        <span className="text-xs font-medium text-gray-500 shrink-0">{r.count} lost</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${Math.max(r.percentOfLost, 2)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-red-600 w-16 text-right">₹{(r.totalValueLost / 10000000).toFixed(2)}Cr</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Model Performance */}
      {modelPerf.length > 0 && (
        <Section title="Model Performance" description="Conversion by vehicle model at this branch" zone="white">
          <div className="dashboard-card-static p-4 md:p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="text-left font-medium pb-2 pr-3">Model</th>
                    <th className="text-right font-medium pb-2 pr-3">Leads</th>
                    <th className="text-right font-medium pb-2 pr-3">Won</th>
                    <th className="text-right font-medium pb-2 pr-3">Conv. %</th>
                    <th className="text-right font-medium pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...modelPerf].sort((a, b) => b.conversionRate - a.conversionRate).map((m) => (
                    <tr key={m.model} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-900">{m.model}</td>
                      <td className="py-2 pr-3 text-right text-gray-700">{m.totalLeads}</td>
                      <td className="py-2 pr-3 text-right font-medium">{m.won}</td>
                      <td className="py-2 pr-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.conversionRate >= 50 ? 'text-green-700 bg-green-50' :
                          m.conversionRate >= 25 ? 'text-amber-700 bg-amber-50' :
                          'text-red-700 bg-red-50'
                        }`}>
                          {m.conversionRate.toFixed(1)}% ({m.totalLeads} lead{m.totalLeads !== 1 ? 's' : ''})
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-700">₹{(m.totalRevenue / 10000000).toFixed(1)}Cr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {/* Stale leads */}
      {staleLeads.length > 0 && (
        <Section title="Leads Needing Follow-up" description="Inactive for 7+ days" zone="white">
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
                  <tr key={s.lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{s.lead.customer_name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.rep.name}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={s.lead.status} /></td>
                    <td className="px-3 py-2.5 text-right text-red-600 font-medium">{s.daysSinceLastActivity}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function ComparisonCard({ label, branchValue, subtitle, tooltip, networkValue, isAbove, diff, unit }: {
  label: string;
  branchValue: string | number;
  subtitle?: string;
  tooltip?: string;
  networkValue: string;
  isAbove: boolean;
  diff: string;
  unit: string;
}) {
  return (
    <div className="dashboard-card p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {label}
        {tooltip && (
          <span className="ml-1 inline-flex items-center cursor-help group relative">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">{tooltip}</span>
          </span>
        )}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This branch</span>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900">{branchValue}</span>
            {subtitle && <span className="text-xs text-gray-400 ml-1.5">{subtitle}</span>}
          </div>
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
