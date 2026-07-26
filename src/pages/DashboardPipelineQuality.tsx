import { useMemo } from 'react';
import { XCircle, BarChart3 } from 'lucide-react';
import {
  getConversionFunnel, getSourcePerformance,
  getLostReasonBreakdown, getModelPerformance,
} from '../lib/data';
import type { LostReasonStats } from '../lib/types';
import Section from '../components/shared/Section';
import { EmptyState } from '../components/shared/Misc';

interface Props {
  filteredLeads: import('../lib/types').Lead[];
  selectedMonth: string;
}

export default function DashboardPipelineQuality({ filteredLeads, selectedMonth }: Props) {
  const funnel = useMemo(() => getConversionFunnel(filteredLeads), [filteredLeads]);
  const sourcePerf = useMemo(() => getSourcePerformance(filteredLeads), [filteredLeads]);
  const lostReasons = useMemo(() => getLostReasonBreakdown(filteredLeads), [filteredLeads]);
  const modelPerf = useMemo(() => getModelPerformance(undefined, selectedMonth), [selectedMonth]);

  return (
    <div className="space-y-2">
      {/* Funnel + Source */}
      <Section title="Conversion Funnel" description="Each bar is proportional to the widest stage. Blue shows leads that moved forward, amber shows leads idling at this stage, and red shows leads lost here. Healthy funnels taper left-to-right with small amber segments." zone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Stage-by-Stage Drop-off</h3>
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
                          <span className="text-xs font-medium w-20 text-right text-gray-600 shrink-0">{s.name.replace('_', ' ')}</span>
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
            })() : <EmptyState title="No data" />}
          </div>

          <div className="dashboard-card p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Lead Source Performance</h3>
            </div>
            {sourcePerf.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left font-medium pb-2 pr-4">Lead Source</th>
                      <th className="text-right font-medium pb-2 pr-4">Leads</th>
                      <th className="text-right font-medium pb-2 pr-4">Conv. %</th>
                      <th className="text-right font-medium pb-2">Avg Deal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sourcePerf].sort((a, b) => b.conversionRate - a.conversionRate).map((s) => {
                      const convColor = s.conversionRate >= 50 ? 'text-green-700 bg-green-50' :
                        s.conversionRate >= 25 ? 'text-amber-700 bg-amber-50' :
                        'text-red-700 bg-red-50';
                      return (
                        <tr key={s.source} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 pr-4 capitalize font-medium text-gray-900">{s.source.replace('_', ' ')}</td>
                          <td className="py-2.5 pr-4 text-right text-gray-700">{s.totalLeads}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${convColor}`}>
                              {s.conversionRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-700">₹{(s.avgDealValue / 100000).toFixed(2)}L</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="No source data" />}
          </div>
        </div>
      </Section>

      {/* Lost Reasons + Model Performance */}
      <Section title="Deal Analysis" description="Why deals are lost and which models perform best" zone="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card p-4 md:p-5">
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
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${Math.max(r.percentOfLost, 2)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-red-600 w-16 text-right">₹{(r.totalValueLost / 10000000).toFixed(1)}Cr</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="dashboard-card p-4 md:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Model Performance</h3>
            {modelPerf.length > 0 ? (
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
                            {m.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 text-right font-semibold text-gray-700">₹{(m.totalRevenue / 10000000).toFixed(1)}Cr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </Section>
    </div>
  );
}
