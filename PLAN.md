# DealerPulse — Build Plan

## Overview
A real-time dealership performance dashboard for a 5-branch Toyota network with 30 sales reps and ~500 leads (Jun–Dec 2025).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript (Vite) |
| Routing | React Router v6 (HashRouter) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Data | Client-side JSON import (no backend) |
| Deploy | Vercel (static SPA) |

---

## Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Overview KPIs, trends, insights, funnel, leaderboard, stale leads, delivery health |
| `/branch/:id` | BranchDetail | Branch KPIs vs targets, rep leaderboard, pipeline, stale leads |
| `/rep/:id` | RepDetail | Rep KPIs, pipeline, lead list, stale leads |

---

## Pages & Components

### 1. Overview Dashboard (`/`)
- **6 KPI Cards** — Revenue, Units Sold, Conversion Rate, Active Leads, Pipeline Value, Avg Delivery Time
- **Monthly Revenue vs Target Chart** — Grouped bar chart (Recharts)
- **Conversion Funnel** — Horizontal stacked bar showing drop-off at each stage (new → contacted → test_drive → negotiation → order_placed → delivered) with lost counts & reason breakdown
- **Branch vs Target Table** — Sortable table with progress bars and color-coded status
- **Actionable Insights Panel** — Auto-generated alerts (behind target, low conversion, stale leads, top/bottom performers)
- **Stale Leads Panel** — Leads with 7+ days inactivity, sorted by stalest
- **Branch Leaderboard** — Ranked by units won
- **Delivery Health** — Avg days trend, delay reason pie chart

### 2. Branch Detail (`/branch/:id`)
- Branch KPI summary vs monthly target
- Unit target progress bar with status message
- Monthly won/leads trend chart
- Rep performance leaderboard (ranked by won deals)
- Lead status breakdown (horizontal bars by status)
- Pipeline funnel (scoped to branch)
- Stale leads table (customer, rep, stage, days stale)

### 3. Rep Detail (`/rep/:id`)
- Rep KPI summary (revenue, won, conversion, avg deal value)
- Pipeline summary cards (total, active, won)
- Pipeline funnel (scoped to rep)
- Recent lead list with status badges
- Stale leads table (customer, model, stage, days stale)

---

## Shared Components

| Component | File | Purpose |
|---|---|---|
| `KPICard` | `shared/KPICard.tsx` | Metric display card with icon, trend, color variants |
| `InsightCard` | `shared/InsightCard.tsx` | Alert/info/tip card with icon |
| `StatusBadge` | `shared/StatusBadge.tsx` | Lead status pill badge |
| `ProgressBar` | `shared/Misc.tsx` | Horizontal progress bar with color coding |
| `EmptyState` | `shared/Misc.tsx` | Empty/no-data placeholder |
| `Spinner` | `shared/Misc.tsx` | Loading spinner |
| `Leaderboard` | `shared/Leaderboard.tsx` | Ranked list with progress bars |
| `MonthFilter` | `shared/MonthFilter.tsx` | Month dropdown selector |
| `Breadcrumbs` | `layout/Breadcrumbs.tsx` | Navigation breadcrumbs |
| `Sidebar` | `layout/Sidebar.tsx` | Desktop sidebar nav (collapses on tablet) |
| `Layout` | `layout/Layout.tsx` | Main layout wrapper with responsive sidebar |

---

## Data Layer (`src/lib/data.ts`)

### Helper Functions

| Function | Returns | Purpose |
|---|---|---|
| `getBranches()` | `Branch[]` | All branches |
| `getBranchById(id)` | `Branch \| undefined` | Single branch |
| `getReps()` | `SalesRep[]` | All reps |
| `getRepById(id)` | `SalesRep \| undefined` | Single rep |
| `getRepsByBranch(branchId)` | `SalesRep[]` | Reps for a branch |
| `getLeads()` | `Lead[]` | All leads |
| `getLeadsByBranch(branchId)` | `Lead[]` | Leads for a branch |
| `getLeadsByRep(repId)` | `Lead[]` | Leads for a rep |
| `getTargets()` | `MonthlyTarget[]` | All monthly targets |
| `getTargetsForBranch(branchId, month?)` | `MonthlyTarget[]` | Targets filtered by branch/month |
| `getDeliveries()` | `DeliveryRecord[]` | All delivery records |
| `getAllMonths()` | `string[]` | Sorted unique months |
| `leadsInRange(leads, month?)` | `Lead[]` | Filter leads by month |
| `computeBranchSummary(branchId, month?)` | `BranchSummary` | Aggregated branch KPIs vs targets |
| `computeRepSummary(repId, month?)` | `RepSummary` | Aggregated rep KPIs |
| `getConversionFunnel(leads)` | `FunnelStage[]` | Funnel with drop-off at each stage |
| `getStaleLeads(leads, thresholdDays=7)` | `StaleLead[]` | Leads inactive for N+ days |
| `getMonthlyTrend(leads, targets)` | `TrendPoint[]` | Monthly aggregation for charts |
| `getDeliveryStats()` | Delivery stats | Avg days, delay reasons breakdown |
| `getDashboardInsights(month?)` | `string[]` | Auto-generated actionable insights |

---

## Data Model Types (`src/lib/types.ts`)

```typescript
Branch        { id, name, city }
SalesRep      { id, name, branch_id, role, joined }
Lead          { id, customer_name, phone, source, model_interested, status,
                assigned_to, branch_id, created_at, last_activity_at,
                status_history, expected_close_date, deal_value, lost_reason }
MonthlyTarget { branch_id, month, target_units, target_revenue }
DeliveryRecord { lead_id, order_date, delivery_date, days_to_deliver, delay_reason }
BranchSummary { branch, totalLeads, activeLeads, wonLeads, lostLeads, totalRevenue,
                conversionRate, targetUnits, targetRevenue, unitsAchieved,
                revenueAchieved, unitsProgress, revenueProgress }
RepSummary    { rep, branch, totalLeads, wonLeads, lostLeads, totalRevenue,
                conversionRate, avgDealValue }
FunnelStage   { name, count, lostCount, lostReasons }
StaleLead     { lead, rep, branch, daysSinceLastActivity, currentStage }
```

---

## Build Phases

1. **Scaffold** — `npm create vite`, install deps, configure Tailwind
2. **Data layer** — Write types, import JSON, write all helper functions
3. **Shared components** — KPICard, StatusBadge, InsightCard, ProgressBar, etc.
4. **Layout** — Sidebar, Header (mobile), Breadcrumbs, Layout wrapper
5. **Dashboard page** — KPIs, trend chart, insights, branch table, funnel, stale leads, leaderboard, delivery health
6. **Branch detail page** — Branch KPIs, progress bar, rep leaderboard, trend, funnel, stale leads
7. **Rep detail page** — Rep KPIs, pipeline, lead list, stale leads
8. **Polish** — Responsive breakpoints, empty states, DECISIONS.md

---

## Differentiation Features (Phase 2)

| Feature | Why it matters |
|---|---|
| Conversion Funnel | Shows exact drop-off counts + lost reasons per stage — identifies where the pipeline leaks |
| Branch/Rep Leaderboard | Creates healthy competition; CEO sees top/bottom at a glance |
| Lead Aging Alerts | Prevents leads from going cold — actionable list with rep, branch, days stale |
| Delivery Health | Tracks avg delivery time trend + delay cause breakdown — surfaces operational bottlenecks (RTO, logistics, fitment backlog) |
