import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getBranches, getLeads, getDashboardInsights, getDeliveryStats,
  isActive, leadsInRange, monthLabel, computeBranchSummary
} from '../lib/data';
import HeadlineInsight from '../components/shared/HeadlineInsight';
import MonthFilter from '../components/shared/MonthFilter';
import Tabs from '../components/shared/Tabs';
import DashboardBusinessHealth from './DashboardBusinessHealth';
import DashboardPipelineQuality from './DashboardPipelineQuality';
import DashboardOperations from './DashboardOperations';

const TABS = [
  { id: 'health', label: 'Business Health', description: 'Revenue, branches, and targets' },
  { id: 'pipeline', label: 'Pipeline & Quality', description: 'Funnel, sources, and lost reasons' },
  { id: 'operations', label: 'Speed & Fulfillment', description: 'Response speed, stale leads, and fulfillment' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab') || 'health');
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem('activeTab', tab);
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth = searchParams.get('month') || '';
  const setSelectedMonth = (m: string) => {
    if (m) setSearchParams({ month: m });
    else setSearchParams({});
  };
  const allLeads = useMemo(() => getLeads(), []);
  const filteredLeads = useMemo(() => leadsInRange(allLeads, selectedMonth), [allLeads, selectedMonth]);
  const insights = useMemo(() => getDashboardInsights(selectedMonth), [selectedMonth]);
  const deliveryStats = useMemo(() => getDeliveryStats(selectedMonth), [selectedMonth]);

  const branches = getBranches();
  const branchSummaries = useMemo(
    () => branches.map(b => computeBranchSummary(b.id, selectedMonth)),
    [branches, selectedMonth]
  );

  const totalRevenue = branchSummaries.reduce((s, b) => s + b.totalRevenue, 0);
  const totalWon = branchSummaries.reduce((s, b) => s + b.wonLeads, 0);
  const totalActive = branchSummaries.reduce((s, b) => s + b.activeLeads, 0);
  const totalLeads = branchSummaries.reduce((s, b) => s + b.totalLeads, 0);
  const totalConversion = totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0;
  const totalDelivered = filteredLeads.filter(l => l.status === 'delivered').length;
  const pipelineValue = filteredLeads.filter(l => isActive(l.status)).reduce((s, l) => s + l.deal_value, 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Overview Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedMonth ? monthLabel(selectedMonth) : 'All months (Jun–Dec 2025)'} · {totalLeads} leads tracked
          </p>
        </div>
        <MonthFilter selected={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <HeadlineInsight insights={insights} />

      <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

      {activeTab === 'health' && (
        <DashboardBusinessHealth
          selectedMonth={selectedMonth}
          totalLeads={totalLeads}
          totalRevenue={totalRevenue}
          totalWon={totalWon}
          totalActive={totalActive}
          pipelineValue={pipelineValue}
          totalDelivered={totalDelivered}
          totalConversion={totalConversion}
          deliveryStats={{ avgDays: deliveryStats.avgDays, total: deliveryStats.total }}
          insights={insights}
        />
      )}
      {activeTab === 'pipeline' && (
        <DashboardPipelineQuality filteredLeads={filteredLeads} selectedMonth={selectedMonth} />
      )}
      {activeTab === 'operations' && (
        <DashboardOperations filteredLeads={filteredLeads} deliveryStats={deliveryStats} />
      )}
    </div>
  );
}
