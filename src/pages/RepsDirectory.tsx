import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllRepsWithStats, getBranches } from '../lib/data';
import type { RepSummary } from '../lib/types';
import Section from '../components/shared/Section';

export default function RepsDirectory() {
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('wonLeads');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const branches = getBranches();
  const allReps = useMemo(() => getAllRepsWithStats(), []);

  const filtered = useMemo(() => {
    let list = [...allReps];
    if (branchFilter) list = list.filter(r => r.rep.branch_id === branchFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.rep.name.toLowerCase().includes(q) || r.branch.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'name': return sortDir === 'asc' ? a.rep.name.localeCompare(b.rep.name) : b.rep.name.localeCompare(a.rep.name);
        case 'branch': return sortDir === 'asc' ? a.branch.name.localeCompare(b.branch.name) : b.branch.name.localeCompare(a.branch.name);
        case 'totalLeads': aVal = a.totalLeads; bVal = b.totalLeads; break;
        case 'wonLeads': aVal = a.wonLeads; bVal = b.wonLeads; break;
        case 'conversionRate': aVal = a.conversionRate; bVal = b.conversionRate; break;
        case 'totalRevenue': aVal = a.totalRevenue; bVal = b.totalRevenue; break;
        case 'avgDealValue': aVal = a.avgDealValue; bVal = b.avgDealValue; break;
        default: aVal = a.wonLeads; bVal = b.wonLeads;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [allReps, branchFilter, searchQuery, sortKey, sortDir]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sales Reps</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allReps.length} reps across {branches.length} branches</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search reps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
          />
          <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
          </div>
        </div>

      <Section title="Rep Directory" description="All sales representatives and their performance" zone="white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('name')}>Name<SortIcon column="name" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('branch')}>Branch<SortIcon column="branch" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('totalLeads')}>Leads<SortIcon column="totalLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('wonLeads')}>Won<SortIcon column="wonLeads" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('conversionRate')}>Conv.<SortIcon column="conversionRate" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('totalRevenue')}>Revenue<SortIcon column="totalRevenue" /></th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('avgDealValue')}>Avg Deal<SortIcon column="avgDealValue" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.rep.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.hash = `/rep/${r.rep.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{r.rep.name}</span>
                      {r.rep.role === 'branch_manager' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">Mgr</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.branch.name}</td>
                  <td className="px-4 py-3">{r.totalLeads}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.wonLeads}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.conversionRate.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">₹{(r.totalRevenue / 100000).toFixed(1)}L</td>
                  <td className="px-4 py-3 text-right">₹{(r.avgDealValue / 100000).toFixed(2)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
