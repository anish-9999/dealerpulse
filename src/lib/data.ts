import rawData from '../data/dealership_data.json';
import type {
  DealershipData, Branch, SalesRep, Lead, MonthlyTarget, DeliveryRecord,
  BranchSummary, RepSummary, FunnelStage, StaleLead, LeadStatus,
  TeamRoster, RepAverages, RepComparison, BranchComparison,
  SourceStats, LostReasonStats, ContactSpeedStats
} from './types';

const data = rawData as unknown as DealershipData;

export function getBranches(): Branch[] {
  return data.branches;
}

export function getBranchById(id: string): Branch | undefined {
  return data.branches.find(b => b.id === id);
}

export function getReps(): SalesRep[] {
  return data.sales_reps;
}

export function getRepById(id: string): SalesRep | undefined {
  return data.sales_reps.find(r => r.id === id);
}

export function getRepsByBranch(branchId: string): SalesRep[] {
  return data.sales_reps.filter(r => r.branch_id === branchId);
}

export function getLeads(): Lead[] {
  return data.leads;
}

export function getLeadsByBranch(branchId: string): Lead[] {
  return data.leads.filter(l => l.branch_id === branchId);
}

export function getLeadsByRep(repId: string): Lead[] {
  return data.leads.filter(l => l.assigned_to === repId);
}

export function getTargets(): MonthlyTarget[] {
  return data.targets;
}

export function getTargetsForBranch(branchId: string, month?: string): MonthlyTarget[] {
  let targets = data.targets.filter(t => t.branch_id === branchId);
  if (month) targets = targets.filter(t => t.month === month);
  return targets;
}

export function getDeliveries(): DeliveryRecord[] {
  return data.deliveries;
}

export function getDeliveriesByLeadId(leadId: string): DeliveryRecord | undefined {
  return data.deliveries.find(d => d.lead_id === leadId);
}

export function getAllMonths(): string[] {
  return [...new Set(data.targets.map(t => t.month))].sort();
}

const MONTH_LABELS: Record<string, string> = {
  '2025-06': 'Jun', '2025-07': 'Jul', '2025-08': 'Aug', '2025-09': 'Sep',
  '2025-10': 'Oct', '2025-11': 'Nov', '2025-12': 'Dec',
};

export function monthLabel(month: string): string {
  return MONTH_LABELS[month] || month;
}

export function leadsInRange(leads: Lead[], month?: string): Lead[] {
  if (!month) return leads;
  return leads.filter(l => l.created_at.startsWith(month));
}

export function getLeadsInMonth(leads: Lead[], month: string): Lead[] {
  return leads.filter(l => {
    const leadMonth = l.created_at.slice(0, 7);
    return leadMonth === month;
  });
}

export function wonStatuses(): LeadStatus[] {
  return ['delivered', 'order_placed'];
}

export function isWon(status: string): boolean {
  return status === 'delivered' || status === 'order_placed';
}

export function isActive(status: string): boolean {
  return ['new', 'contacted', 'test_drive', 'negotiation'].includes(status);
}

export function computeBranchSummary(branchId: string, month?: string): BranchSummary {
  const branch = getBranchById(branchId)!;
  const allLeads = leadsInRange(getLeadsByBranch(branchId), month);
  const won = allLeads.filter(l => isWon(l.status));
  const lost = allLeads.filter(l => l.status === 'lost');
  const active = allLeads.filter(l => isActive(l.status));
  const totalRevenue = won.reduce((sum, l) => sum + l.deal_value, 0);

  const branchTargets = getTargetsForBranch(branchId, month);
  const targetUnits = branchTargets.reduce((s, t) => s + t.target_units, 0);
  const targetRevenue = branchTargets.reduce((s, t) => s + t.target_revenue, 0);
  const unitsAchieved = won.length;
  const revenueAchieved = totalRevenue;

  return {
    branch,
    totalLeads: allLeads.length,
    activeLeads: active.length,
    wonLeads: won.length,
    lostLeads: lost.length,
    totalRevenue,
    conversionRate: allLeads.length > 0 ? (won.length / allLeads.length) * 100 : 0,
    targetUnits,
    targetRevenue,
    unitsAchieved,
    revenueAchieved,
    unitsProgress: targetUnits > 0 ? (unitsAchieved / targetUnits) * 100 : 0,
    revenueProgress: targetRevenue > 0 ? (revenueAchieved / targetRevenue) * 100 : 0,
  };
}

export function computeRepSummary(repId: string, month?: string): RepSummary {
  const rep = getRepById(repId)!;
  const branch = getBranchById(rep.branch_id)!;
  const allLeads = leadsInRange(getLeadsByRep(repId), month);
  const won = allLeads.filter(l => isWon(l.status));
  const lost = allLeads.filter(l => l.status === 'lost');
  const totalRevenue = won.reduce((sum, l) => sum + l.deal_value, 0);

  return {
    rep,
    branch,
    totalLeads: allLeads.length,
    wonLeads: won.length,
    lostLeads: lost.length,
    totalRevenue,
    conversionRate: allLeads.length > 0 ? (won.length / allLeads.length) * 100 : 0,
    avgDealValue: won.length > 0 ? totalRevenue / won.length : 0,
  };
}

export function getConversionFunnel(leads: Lead[]): FunnelStage[] {
  const stages: LeadStatus[] = ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'];
  const statusOrder: Record<string, number> = { new: 0, contacted: 1, test_drive: 2, negotiation: 3, order_placed: 4, delivered: 5, lost: 6 };

  const funnel: FunnelStage[] = stages.map(name => ({
    name,
    count: 0,
    lostCount: 0,
    lostReasons: {},
  }));

  for (const lead of leads) {
    if (lead.status === 'lost') {
      const lastActive = lead.status_history
        .filter(h => h.status !== 'lost')
        .pop();
      const idx = lastActive ? stages.indexOf(lastActive.status as LeadStatus) : 0;
      if (idx >= 0 && idx < funnel.length) {
        funnel[idx].lostCount++;
        if (lead.lost_reason) {
          funnel[idx].lostReasons[lead.lost_reason] = (funnel[idx].lostReasons[lead.lost_reason] || 0) + 1;
        }
      }
      continue;
    }

    const maxIdx = Math.max(...lead.status_history.map(h => statusOrder[h.status] ?? -1));
    const maxStageIdx = stages.findIndex((_, i) => i === maxIdx);
    if (maxStageIdx >= 0) {
      funnel[maxStageIdx].count++;
    }
  }

  const nonLostCount = leads.length - leads.filter(l => l.status === 'lost').length;
  let cumulative = nonLostCount;
  return funnel.map(s => {
    const stage = { ...s, count: cumulative };
    cumulative -= s.count;
    return stage;
  });
}

export function getStaleLeads(allLeads: Lead[], thresholdDays = 7): StaleLead[] {
  const now = new Date('2025-12-31T23:59:59Z');
  const stale: StaleLead[] = [];

  for (const lead of allLeads) {
    if (!isActive(lead.status)) continue;
    const lastActivity = new Date(lead.last_activity_at);
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastActivity >= thresholdDays) {
      const rep = getRepById(lead.assigned_to)!;
      const branch = getBranchById(lead.branch_id)!;
      stale.push({ lead, rep, branch, daysSinceLastActivity, currentStage: lead.status });
    }
  }

  return stale.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
}

export function getMonthlyTrend(leads: Lead[], targets: MonthlyTarget[]) {
  const months = getAllMonths();
  return months.map(month => {
    const monthLeads = getLeadsInMonth(leads, month);
    const won = monthLeads.filter(l => isWon(l.status));
    const revenue = won.reduce((s, l) => s + l.deal_value, 0);
    const monthTargets = targets.filter(t => t.month === month);
    const targetRev = monthTargets.reduce((s, t) => s + t.target_revenue, 0);
    const targetUnits = monthTargets.reduce((s, t) => s + t.target_units, 0);
    return {
      month,
      label: monthLabel(month),
      leads: monthLeads.length,
      won: won.length,
      revenue,
      targetRevenue: targetRev,
      targetUnits,
    };
  });
}

export function getDeliveryStats() {
  const deliveries = getDeliveries();
  const withDelay = deliveries.filter(d => d.delay_reason);
  const reasons: Record<string, number> = {};
  for (const d of withDelay) {
    const r = d.delay_reason!;
    reasons[r] = (reasons[r] || 0) + 1;
  }
  const avgDays = deliveries.length > 0
    ? deliveries.reduce((s, d) => s + d.days_to_deliver, 0) / deliveries.length
    : 0;

  return { total: deliveries.length, withDelay: withDelay.length, avgDays, delayReasons: reasons };
}

export function getDeliveryTrend() {
  const months = getAllMonths();
  return months.map(month => {
    const monthDeliveries = getDeliveries().filter(d => d.delivery_date.startsWith(month));
    const avg = monthDeliveries.length > 0
      ? monthDeliveries.reduce((s, d) => s + d.days_to_deliver, 0) / monthDeliveries.length
      : 0;
    return { month, label: monthLabel(month), avgDays: Math.round(avg * 10) / 10, count: monthDeliveries.length };
  });
}

export function getLeadSourceBreakdown(leads: Lead[]): Record<string, number> {
  const sources: Record<string, number> = {};
  for (const l of leads) {
    sources[l.source] = (sources[l.source] || 0) + 1;
  }
  return sources;
}

export function getModelBreakdown(leads: Lead[]): Record<string, number> {
  const models: Record<string, number> = {};
  for (const l of leads) {
    models[l.model_interested] = (models[l.model_interested] || 0) + 1;
  }
  return models;
}

export function getDashboardInsights(month?: string): { type: 'alert' | 'tip' | 'info'; text: string }[] {
  const insights: { type: 'alert' | 'tip' | 'info'; text: string }[] = [];
  const branches = getBranches();
  const allLeads = leadsInRange(getLeads(), month);
  const staleLeads = getStaleLeads(allLeads, 7);

  if (staleLeads.length > 0) {
    insights.push({ type: 'alert', text: `${staleLeads.length} lead${staleLeads.length > 1 ? 's' : ''} in pipeline haven't been contacted in 7+ days. Check the Stale Leads panel.` });
  }

  for (const branch of branches) {
    const summary = computeBranchSummary(branch.id, month);
    if (summary.unitsProgress < 70 && summary.targetUnits > 0) {
      insights.push({ type: 'alert', text: `${branch.name} is ${Math.round(100 - summary.unitsProgress)}% behind unit target (${summary.unitsAchieved}/${summary.targetUnits}).` });
    }
    if (summary.conversionRate < 20 && summary.totalLeads > 5) {
      insights.push({ type: 'alert', text: `${branch.name} has a low conversion rate of ${Math.round(summary.conversionRate)}%. Review lead quality or rep performance.` });
    }
  }

  const repWon = getReps().map(r => ({ rep: r, won: getLeadsByRep(r.id).filter(l => isWon(l.status)).length }));
  const topRep = repWon.sort((a, b) => b.won - a.won)[0];
  if (topRep) insights.push({ type: 'tip', text: `Top performer: ${topRep.rep.name} with ${topRep.won} deals closed.` });
  const bottomRep = repWon.filter(r => r.rep.role === 'sales_officer').sort((a, b) => a.won - b.won)[0];
  if (bottomRep && bottomRep.rep.role === 'sales_officer') {
    insights.push({ type: 'tip', text: `${bottomRep.rep.name} has only ${bottomRep.won} deals. May need coaching or lead reassignment.` });
  }

  const contactStats = getTimeToFirstContact(allLeads);
  const slowestBranch = contactStats.byBranch[0];
  if (slowestBranch && slowestBranch.avgHours > 24) {
    insights.push({ type: 'alert', text: `${slowestBranch.branchName} takes ${slowestBranch.avgHours}h avg to first contact — slowest in network.` });
  }

  const lostBreakdown = getLostReasonBreakdown(allLeads);
  const topLossReason = lostBreakdown[0];
  if (topLossReason && topLossReason.percentOfLost > 20) {
    insights.push({ type: 'info', text: `"${topLossReason.reason}" is the #1 lost reason (${Math.round(topLossReason.percentOfLost)}% of losses, ₹${(topLossReason.totalValueLost / 10000000).toFixed(1)}Cr lost).` });
  }

  return insights;
}

export function getCityForBranch(branchId: string): string {
  const branch = getBranchById(branchId);
  return branch ? branch.city : '';
}

export function groupBranchesByCity(): Record<string, Branch[]> {
  const groups: Record<string, Branch[]> = {};
  for (const branch of data.branches) {
    if (!groups[branch.city]) groups[branch.city] = [];
    groups[branch.city].push(branch);
  }
  return groups;
}

export function getTeamRoster(branchId: string): TeamRoster {
  const reps = getRepsByBranch(branchId);
  const manager = reps.find(r => r.role === 'branch_manager')!;
  const officers = reps.filter(r => r.role === 'sales_officer');
  return { manager, officers };
}

export function computeRepAverages(reps: SalesRep[], month?: string): RepAverages {
  let totalWon = 0;
  let totalRevenue = 0;
  let totalLeads = 0;

  for (const rep of reps) {
    const leads = leadsInRange(getLeadsByRep(rep.id), month);
    const won = leads.filter(l => isWon(l.status));
    totalWon += won.length;
    totalRevenue += won.reduce((s, l) => s + l.deal_value, 0);
    totalLeads += leads.length;
  }

  const count = reps.filter(r => r.role === 'sales_officer').length;

  return {
    conversionRate: totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0,
    avgDealValue: totalWon > 0 ? totalRevenue / totalWon : 0,
    unitsWon: count > 0 ? totalWon / count : 0,
  };
}

export function computeRepComparison(repId: string, month?: string): RepComparison {
  const rep = getRepById(repId)!;
  const repSummary = computeRepSummary(repId, month);

  const branchReps = getRepsByBranch(rep.branch_id);
  const branchAvg = computeRepAverages(branchReps, month);

  const allOfficers = data.sales_reps.filter(r => r.role === 'sales_officer');
  const networkAvg = computeRepAverages(allOfficers, month);

  const branchRepWon = branchReps
    .filter(r => r.role === 'sales_officer')
    .map(r => ({ id: r.id, won: leadsInRange(getLeadsByRep(r.id), month).filter(l => isWon(l.status)).length }))
    .sort((a, b) => b.won - a.won);
  const repRank = branchRepWon.findIndex(r => r.id === repId);
  const percentileInBranch = branchRepWon.length > 0
    ? Math.round(((branchRepWon.length - repRank - 1) / branchRepWon.length) * 100)
    : 0;

  const allRepWon = allOfficers
    .map(r => ({ id: r.id, won: leadsInRange(getLeadsByRep(r.id), month).filter(l => isWon(l.status)).length }))
    .sort((a, b) => b.won - a.won);
  const networkRank = allRepWon.findIndex(r => r.id === repId);
  const percentileInNetwork = allRepWon.length > 0
    ? Math.round(((allRepWon.length - networkRank - 1) / allRepWon.length) * 100)
    : 0;

  return { rep: repSummary, branchAvg, networkAvg, percentileInBranch, percentileInNetwork };
}

export function computeBranchComparison(branchId: string, month?: string): BranchComparison {
  const branchSummary = computeBranchSummary(branchId, month);

  const allBranches = data.branches;
  let totalWon = 0;
  let totalRevenue = 0;
  let totalLeads = 0;

  for (const b of allBranches) {
    const s = computeBranchSummary(b.id, month);
    totalWon += s.wonLeads;
    totalRevenue += s.totalRevenue;
    totalLeads += s.totalLeads;
  }

  const branchCount = allBranches.length;

  return {
    branch: branchSummary,
    networkAvg: {
      conversionRate: totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0,
      avgDealValue: totalWon > 0 ? totalRevenue / totalWon : 0,
      unitsWon: branchCount > 0 ? totalWon / branchCount : 0,
    },
  };
}

export function getSourcePerformance(leads: Lead[]): SourceStats[] {
  const sources = [...new Set(leads.map(l => l.source))];
  return sources.map(source => {
    const sourceLeads = leads.filter(l => l.source === source);
    const converted = sourceLeads.filter(l => isWon(l.status));
    return {
      source,
      totalLeads: sourceLeads.length,
      converted: converted.length,
      conversionRate: sourceLeads.length > 0 ? (converted.length / sourceLeads.length) * 100 : 0,
      avgDealValue: converted.length > 0
        ? converted.reduce((s, l) => s + l.deal_value, 0) / converted.length
        : 0,
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

export function getLostReasonBreakdown(leads: Lead[], scope?: string): LostReasonStats[] {
  let lostLeads = leads.filter(l => l.status === 'lost');
  if (scope) lostLeads = lostLeads.filter(l => l.branch_id === scope);

  const totalLost = lostLeads.length;
  const reasons = [...new Set(lostLeads.map(l => l.lost_reason).filter(Boolean))] as string[];

  return reasons.map(reason => {
    const withReason = lostLeads.filter(l => l.lost_reason === reason);
    return {
      reason,
      count: withReason.length,
      percentOfLost: totalLost > 0 ? (withReason.length / totalLost) * 100 : 0,
      totalValueLost: withReason.reduce((s, l) => s + l.deal_value, 0),
    };
  }).sort((a, b) => b.count - a.count);
}

export function getTimeToFirstContact(allLeads: Lead[]): ContactSpeedStats {
  const hoursList: number[] = [];
  const byBranchMap: Record<string, { total: number; count: number }> = {};
  const slowLeads: { lead: Lead; hoursWaited: number }[] = [];

  for (const lead of allLeads) {
    const contactedEntry = lead.status_history.find(h => h.status === 'contacted');
    if (!contactedEntry) continue;

    const created = new Date(lead.created_at).getTime();
    const contacted = new Date(contactedEntry.timestamp).getTime();
    const hours = (contacted - created) / (1000 * 60 * 60);
    hoursList.push(hours);

    if (!byBranchMap[lead.branch_id]) byBranchMap[lead.branch_id] = { total: 0, count: 0 };
    byBranchMap[lead.branch_id].total += hours;
    byBranchMap[lead.branch_id].count++;

    if (hours > 48) slowLeads.push({ lead, hoursWaited: Math.round(hours) });
  }

  const avgHours = hoursList.length > 0
    ? Math.round((hoursList.reduce((s, h) => s + h, 0) / hoursList.length) * 10) / 10
    : 0;

  const sorted = [...hoursList].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianHours = sorted.length > 0
    ? Math.round((sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
    : 0;

  const byBranch = Object.entries(byBranchMap).map(([branchId, stats]) => {
    const branch = getBranchById(branchId);
    return {
      branchId,
      branchName: branch ? branch.name : branchId,
      avgHours: Math.round((stats.total / stats.count) * 10) / 10,
      count: stats.count,
    };
  }).sort((a, b) => b.avgHours - a.avgHours);

  return { avgHours, medianHours, byBranch, slowLeads };
}
