import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  getRepById, getBranchById, getLeadsByRep, computeRepSummary,
  getStaleLeads, getConversionFunnel, computeRepComparison,
  isActive, isWon, leadsInRange
} from '../lib/data';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import KPICard from '../components/shared/KPICard';
import StatusBadge from '../components/shared/StatusBadge';
import MonthFilter from '../components/shared/MonthFilter';
import { EmptyState } from '../components/shared/Misc';
import { IndianRupee, Car, TrendingUp, Activity } from 'lucide-react';

export default function RepDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedMonth, setSelectedMonth] = useState('');
  const rep = getRepById(id!);

  if (!rep) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold">Rep not found</h2>
        <Link to="/" className="text-brand-600 text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const branch = getBranchById(rep.branch_id)!;
  const allLeads = useMemo(() => getLeadsByRep(rep.id), [rep.id]);
  const filteredLeads = useMemo(() => leadsInRange(allLeads, selectedMonth), [allLeads, selectedMonth]);
  const summary = useMemo(() => computeRepSummary(rep.id, selectedMonth), [rep.id, selectedMonth]);
  const staleLeads = useMemo(() => getStaleLeads(filteredLeads, 7), [filteredLeads]);
  const funnel = useMemo(() => getConversionFunnel(filteredLeads), [filteredLeads]);
  const comparison = useMemo(() => computeRepComparison(rep.id, selectedMonth), [rep.id, selectedMonth]);

  const wonLeads = filteredLeads.filter(l => isWon(l.status));
  const activeLeads = filteredLeads.filter(l => isActive(l.status));
  const deliveredCount = wonLeads.filter(l => l.status === 'delivered').length;
  const orderPlacedCount = wonLeads.filter(l => l.status === 'order_placed').length;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: branch.name, href: `/branch/${branch.id}` },
        { label: rep.name },
      ]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{rep.name}</h1>
          <p className="text-sm text-gray-500">
            {rep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'} · {branch.name}, {branch.city} · Joined {rep.joined}
          </p>
        </div>
        <MonthFilter selected={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* KPIs with deltas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard title="Revenue" value={`₹${(summary.totalRevenue / 100000).toFixed(2)}L`} icon={<IndianRupee className="w-4 h-4" />} color="green" subtitle={comparison ? `Top ${comparison.percentileInNetwork}% in network` : undefined} />
        <KPICard title="Deals Won" value={summary.wonLeads} subtitle={`${deliveredCount} delivered · ${orderPlacedCount} orders${comparison ? `\nBranch avg ${comparison.branchAvg.unitsWon.toFixed(2)} (${summary.wonLeads >= comparison.branchAvg.unitsWon ? '+' : ''}${(summary.wonLeads - comparison.branchAvg.unitsWon).toFixed(2)}) · Network avg ${comparison.networkAvg.unitsWon.toFixed(2)} (${summary.wonLeads >= comparison.networkAvg.unitsWon ? '+' : ''}${(summary.wonLeads - comparison.networkAvg.unitsWon).toFixed(2)})` : ''}`} icon={<Car className="w-4 h-4" />} color="blue" tooltip="Won = Delivered + Order Placed (payment received, awaiting delivery)" />
        <KPICard title="Conversion" value={`${summary.conversionRate.toFixed(2)}%`} subtitle={comparison ? `Branch avg ${comparison.branchAvg.conversionRate.toFixed(2)}% (${summary.conversionRate >= comparison.branchAvg.conversionRate ? '+' : ''}${(summary.conversionRate - comparison.branchAvg.conversionRate).toFixed(2)}pts) · Network avg ${comparison.networkAvg.conversionRate.toFixed(2)}% (${summary.conversionRate >= comparison.networkAvg.conversionRate ? '+' : ''}${(summary.conversionRate - comparison.networkAvg.conversionRate).toFixed(2)}pts)` : undefined} icon={<Activity className="w-4 h-4" />} color="purple" />
        <KPICard title="Avg Deal Value" value={`₹${(summary.avgDealValue / 100000).toFixed(2)}L`} subtitle={comparison ? `Branch avg ₹${(comparison.branchAvg.avgDealValue / 100000).toFixed(2)}L (${summary.avgDealValue >= comparison.branchAvg.avgDealValue ? '+' : ''}₹${(Math.abs(summary.avgDealValue - comparison.branchAvg.avgDealValue) / 100000).toFixed(2)}L) · Network avg ₹${(comparison.networkAvg.avgDealValue / 100000).toFixed(2)}L (${summary.avgDealValue >= comparison.networkAvg.avgDealValue ? '+' : ''}₹${(Math.abs(summary.avgDealValue - comparison.networkAvg.avgDealValue) / 100000).toFixed(2)}L)` : undefined} icon={<TrendingUp className="w-4 h-4" />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-lg font-bold text-blue-700">{filteredLeads.length}</p>
              <p className="text-xs text-blue-600">Total Leads</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50">
              <p className="text-lg font-bold text-amber-700">{activeLeads.length}</p>
              <p className="text-xs text-amber-600">Active</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <p className="text-lg font-bold text-green-700">{wonLeads.length}</p>
              <p className="text-xs text-green-600">Won</p>
            </div>
          </div>
          <div className="space-y-2">
            {funnel.map((stage) => {
              const maxCount = Math.max(...funnel.map(s => s.count), 1);
              return (
                <div key={stage.name} className="flex items-center gap-2">
                  <span className="text-xs w-24 text-right text-gray-600 shrink-0">{stage.name.replace('_', ' ')}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded bg-brand-500 flex items-center justify-end px-2 transition-all"
                      style={{ width: `${Math.max((stage.count / maxCount) * 100, 3)}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{stage.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead list */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Leads</h3>
            <span className="text-xs text-gray-500">{filteredLeads.length} total</span>
          </div>
          {filteredLeads.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLeads.slice(0, 20).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.model_interested} · ₹{(lead.deal_value / 100000).toFixed(2)}L</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="No leads" description="No leads found for this period" />}
        </div>
      </div>

      {/* Stale leads */}
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
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase">Model</th>
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase">Stage</th>
                  <th className="px-3 py-2 font-medium text-gray-500 text-xs uppercase text-right">Stale (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staleLeads.map(s => (
                  <tr key={s.lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{s.lead.customer_name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.lead.model_interested}</td>
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
