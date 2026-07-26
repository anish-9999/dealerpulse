export interface Branch {
  id: string;
  name: string;
  city: string;
}

export interface SalesRep {
  id: string;
  name: string;
  branch_id: string;
  role: 'branch_manager' | 'sales_officer';
  joined: string;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  source: string;
  model_interested: string;
  status: string;
  assigned_to: string;
  branch_id: string;
  created_at: string;
  last_activity_at: string;
  status_history: StatusHistoryEntry[];
  expected_close_date: string;
  deal_value: number;
  lost_reason: string | null;
}

export interface MonthlyTarget {
  branch_id: string;
  month: string;
  target_units: number;
  target_revenue: number;
}

export interface DeliveryRecord {
  lead_id: string;
  order_date: string;
  delivery_date: string;
  days_to_deliver: number;
  delay_reason: string | null;
}

export interface DealershipData {
  metadata: { generated_at: string; description: string; date_range: string; notes: string };
  branches: Branch[];
  sales_reps: SalesRep[];
  leads: Lead[];
  targets: MonthlyTarget[];
  deliveries: DeliveryRecord[];
}

export type LeadStatus = 'new' | 'contacted' | 'test_drive' | 'negotiation' | 'order_placed' | 'delivered' | 'lost';

export interface BranchSummary {
  branch: Branch;
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  totalRevenue: number;
  conversionRate: number;
  targetUnits: number;
  targetRevenue: number;
  unitsAchieved: number;
  revenueAchieved: number;
  unitsProgress: number;
  revenueProgress: number;
}

export interface RepSummary {
  rep: SalesRep;
  branch: Branch;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgDealValue: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  stuckCount: number;
  lostCount: number;
  lostReasons: Record<string, number>;
}

export interface StaleLead {
  lead: Lead;
  rep: SalesRep;
  branch: Branch;
  daysSinceLastActivity: number;
  currentStage: string;
}

export interface TeamRoster {
  manager: SalesRep;
  officers: SalesRep[];
}

export interface RepAverages {
  conversionRate: number;
  avgDealValue: number;
  unitsWon: number;
  totalRevenue: number;
}

export interface RepComparison {
  rep: RepSummary;
  branchAvg: RepAverages;
  networkAvg: RepAverages;
  percentileInBranch: number;
  percentileInNetwork: number;
}

export interface BranchComparison {
  branch: BranchSummary;
  networkAvg: RepAverages;
}

export interface SourceStats {
  source: string;
  totalLeads: number;
  converted: number;
  conversionRate: number;
  avgDealValue: number;
}

export interface LostReasonStats {
  reason: string;
  count: number;
  percentOfLost: number;
  totalValueLost: number;
}

export interface ModelPerformanceStats {
  model: string;
  totalLeads: number;
  won: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface ContactSpeedStats {
  avgHours: number;
  medianHours: number;
  byBranch: { branchId: string; branchName: string; avgHours: number; count: number }[];
  slowLeads: { lead: Lead; hoursWaited: number }[];
}
