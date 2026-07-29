# DealerPulse — Architecture & Data Flow

## Stack

```
React 19 + TypeScript 6
  ├── Vite 8 (bundler)
  ├── Tailwind CSS 4 (styling)
  ├── React Router 7 (HashRouter — SPA routing)
  ├── Recharts (charts)
  └── Lucide React (icons)
```

**No backend. No database. No state management library.**
All ~510 leads + 160 deliveries live in a static JSON imported at build time.

---

## Data Flow (Top to Bottom)

```
 dealership_data.json  (raw ~500KB JSON, imported at module level)
        │
        ▼
   lib/data.ts         (583 lines — ALL data logic lives here)
        │
        ├── Pure functions: getLeads(), getBranches(), getDeliveries()
        ├── Computed views: computeBranchSummary(), computeRepSummary(),
        │   getConversionFunnel(), getModelPerformance(), getContactSpeed(),
        │   getLostReasonBreakdown(), getStaleLeads(), getDashboardInsights()
        └── Comparison engines: computeRepComparison(), computeBranchComparison()
              │
              ▼
   pages/*.tsx         (read results via useMemo, render with React)
```

**Key principle:** Every data function is a stateless computation — given month/scope params, it returns a derived view. No mutations, no global state, no reducers.

---

## Routing (HashRouter)

```
#/                    → Dashboard (3 tabs)
#/branch/:id          → BranchDetail (per-branch drilldown)
#/rep/:id             → RepDetail (per-rep drilldown)
#/reps                → RepsDirectory (all reps table)
```

All cross-page navigation carries `?month=` in the URL hash to persist the filter.

---

## Page-by-Page State Diagram

### Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  URL state:   ?month=YYYY-MM&tab=health|pipeline|operations         │
│  Session:     sessionStorage['activeTab'] (backup for back-nav)     │
│  Local state: activeTab (useState), selectedMonth (from URL)        │
└─────────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
  │  Business    │   │  Pipeline &  │   │   Speed &        │
  │  Health      │   │  Quality     │   │   Fulfillment    │
  │              │   │              │   │                  │
  │ • 6 KPI cards│   │ • Funnel     │   │ • Response Speed │
  │ • Stacked    │   │   (3-segment │   │   (dist + top-10)│
  │   revenue    │   │    bar)      │   │ • Stale Leads    │
  │   chart      │   │ • Source     │   │ • Fulfillment    │
  │ • Branch     │   │   Perf table │   │   (KPIs + trend) │
  │   Perf table │   │ • Lost Reason│   │                  │
  │   (sortable) │   │   Analysis   │   │                  │
  │ • Insights   │   │ • Model Perf │   │                  │
  │   grid       │   │   table      │   │                  │
  │              │   │   (branch-   │   │                  │
  │              │   │    filterable)│   │                  │
  └──────────────┘   └──────────────┘   └──────────────────┘
         │                  │                    │
         │  Click row       │                    │
         └──────► #/branch/B1?month=...          │
                              │                  │
                              │  Click rep name  │
                              │  in stale/longest│
                              └──────► #/rep/SR01?month=...
```

**Data dependencies per tab:**

| Tab | Depends on | Data functions called |
|-----|-----------|---------------------|
| Business Health | selectedMonth | computeBranchSummary, getDashboardInsights, getDeliveryStats |
| Pipeline & Quality | filteredLeads, selectedMonth | getConversionFunnel, getSourcePerformance, getLostReasonBreakdown, getModelPerformance |
| Speed & Fulfillment | filteredLeads, deliveryStats | getTimeToFirstContact, getStaleLeads, getDeliveryTrend |

---

### Branch Detail (`/branch/:id`)

```
┌─────────────────────────────────────────────────────────────┐
│  URL state:   ?month=YYYY-MM                                │
│  Local state: selectedMonth (initialized from URL,          │
│               syncs back via setSearchParams)                │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                  ▼
  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Key Metrics      │  │ vs Network   │  │ Monthly      │
  │ (6 KPI cards)    │  │ Average      │  │ Performance  │
  │ + Unit Progress  │  │ (3 comparison│  │ (stacked bar) │
  │                  │  │  cards)      │  │              │
  └──────────────────┘  └──────────────┘  └──────┬───────┘
                                                 │
            ┌────────────────────────────────────┼──────────┐
            ▼                                    ▼          ▼
  ┌────────────────────┐  ┌─────────────────┐  ┌──────────────┐
  │ Team (merged panel)│  │ Pipeline        │  │ Model Perf   │
  │ • Manager row      │  │ • Funnel (left) │  │ (pre-scoped  │
  │ • Officers table   │  │ • Lost Reasons  │  │  sortable    │
  │   (ranked by won)  │  │   (right)       │  │  table)      │
  └────────────────────┘  └─────────────────┘  └──────┬───────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │ Stale Leads  │
                                              │ (table)      │
                                              └──────────────┘
```

**Data dependencies:**
| Section | Depends on | Key functions |
|---------|-----------|--------------|
| Key Metrics | branch.id, selectedMonth | computeBranchSummary, getTargetsForBranch |
| vs Network | branch.id, selectedMonth | computeBranchComparison |
| Monthly Trend | allLeads, targets | getMonthlyTrend |
| Team | branch.id, selectedMonth | getTeamRoster, computeRepSummary |
| Pipeline | filteredLeads | getConversionFunnel, getLostReasonBreakdown |
| Model Perf | branch.id, selectedMonth | getModelPerformance |

---

### Rep Detail (`/rep/:id`)

```
┌─────────────────────────────────────────────────────────┐
│  URL state:   ?month=YYYY-MM                             │
│  Local state: selectedMonth (from URL, syncs back)       │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                 ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ KPI Cards    │  │ Pipeline     │  │ Stale Leads  │
  │ (4 cards     │  │ + Lead List  │  │ (table)      │
  │  with deltas)│  │ (2-column    │  │              │
  │              │  │  grid)       │  │              │
  └──────────────┘  └──────────────┘  └──────────────┘
```

**Data dependencies:**
| Section | Depends on | Key functions |
|---------|-----------|--------------|
| KPI Cards | rep.id, selectedMonth | computeRepSummary, computeRepComparison |
| Pipeline | filteredLeads | getConversionFunnel |
| Lead List | filteredLeads | — (raw `.slice(0, 20)`) |
| Stale Leads | filteredLeads | getStaleLeads |

---

### Reps Directory (`/reps`)

```
┌─────────────────────────────────────────────────────────────┐
│  Local state: searchQuery, branchFilter, sortKey, sortDir   │
│  No URL state — self-contained table                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Sortable Table  │
                  │ • Name (filter) │
                  │ • Branch(filter)│
                  │ • Leads, Won    │
                  │ • Conv%, Revenue│
                  │ • Avg Deal      │
                  │                  │
                  │  Click row ►     │
                  │  #/rep/:id       │
                  └─────────────────┘
```

**Data:** `getAllRepsWithStats()` — single cross-cutting query, memoized.

---

## State Management Summary

| Concern | Mechanism | Reason |
|---------|-----------|--------|
| Month filter | `?month=` URL search param | Survives navigation, refresh, back/forward |
| Active dashboard tab | `sessionStorage` + `?tab=` URL | sessionStorage handles back-nav; URL handles direct links from insight tiles |
| Branch filter (Model Perf) | `useState` (component-local) | Only relevant within the tab — no need to persist |
| Sort state (all tables) | `useState` per table | Ephemeral — no value in persisting across navigations |
| Search query (Reps Dir) | `useState` | Ephemeral |
| Raw data | Static JS import | Loaded once at module init |
| Derived data | `useMemo` with explicit deps | Re-computes only when inputs change |

---

## Component Tree

```
<App>
  <WelcomeSplash>                    ← 800ms cosmetic delay
    <Layout>                         ← Sidebar + header + content area
      <Routes>
        <Dashboard>                  ← / (3 tabs)
          ├── <HeadlineInsight>      ← Cycling banner (auto + manual arrows)
          ├── <Tabs>                 ← 3 tab buttons
          ├── <DashboardBusinessHealth>
          │   ├── <KPICard> ×6
          │   ├── <Section> → revenue chart (Recharts BarChart)
          │   ├── <Section> → Branch Performance (sortable table)
          │   └── <InsightCard> ×N
          ├── <DashboardPipelineQuality>
          │   ├── <Section> → Funnel (custom HTML/CSS bars)
          │   ├── Source Performance (table)
          │   ├── Lost Reason Analysis (bars)
          │   └── Model Performance (sortable table + branch filter)
          └── <DashboardOperations>
              ├── Response Speed (distribution + Longest Waiting list)
              ├── Stale Leads (list with clickable rep names)
              └── Fulfillment (KPIs + delay reasons + trend chart)
        <BranchDetail>               ← /branch/:id
          ├── <Breadcrumbs>
          ├── <MonthFilter>
          ├── <KPICard> ×6 + <ProgressBar>
          ├── <ComparisonCard> ×3
          ├── Team (merged manager + officers table)
          ├── Pipeline (funnel + lost reasons)
          ├── Model Performance (sortable table, pre-scoped)
          └── Stale Leads (table)
        <RepDetail>                  ← /rep/:id
          ├── <Breadcrumbs>
          ├── <MonthFilter>
          ├── <KPICard> ×4 (with delta subtitles)
          ├── Pipeline (funnel + lead list)
          └── Stale Leads (table)
        <RepsDirectory>              ← /reps
          └── Sortable/filterable table
```

---

## Data Processing Pipeline

```
Raw JSON
  │
  ├── leads[] ──────────► leadsInRange() ──► filteredLeads[]
  │                            │
  │    ┌───────────────────────┼───────────────┐
  │    ▼                       ▼               ▼
  │  getConversionFunnel   getSourcePerf    getStaleLeads
  │  getLostReasonBreakdown                  getContactSpeed
  │  getModelPerformance                     getDeliveryStats
  │
  ├── branches[] ─────────► computeBranchSummary() ──► BranchSummary[]
  │                            │
  │    ┌───────────────────────┼───────────────┐
  │    ▼                       ▼               ▼
  │  computeBranchComparison  getTeamRoster   getTargetsForBranch
  │                                          getMonthlyTrend
  │
  ├── sales_reps[] ────────► computeRepSummary() ──► RepSummary[]
  │                            │
  │    ┌───────────────────────┼───────────────┐
  │    ▼                       ▼               ▼
  │  computeRepComparison    getAllRepsWithStats   getRepById
  │
  ├── targets[] ───────────► getTargetsForBranch()
  │
  └── deliveries[] ────────► getDeliveryStats() / getDeliveryTrend()
```

---

## Key Architecture Decisions

**1. No global state library.** Every page is self-contained. Data flows down via props or is recomputed in `useMemo`. Cross-page state (month filter) lives in the URL.

**2. Data layer is pure functions.** `data.ts` has zero React imports — it's a collection of functions that take primitives and return derived objects. This makes it testable, predictable, and independent of the rendering framework.

**3. Funnel is not a Recharts chart.** The 3-segment stacked bar is hand-built with HTML `<div>` elements + Tailwind. Recharts doesn't natively support proportional-width bars with different segment colors per stage, and the custom approach gives pixel-level control over the pill shape and context-aware number placement.

**4. Sort state is per-table, not global.** Each sortable table (Branch Performance, Source Performance, Model Performance ×2, Reps Directory) owns its own sort key/direction in `useState`. No attempt to share sort state — the UX gain doesn't justify the coupling.

**5. `getModelPerformance` accepts an optional `scope` param** — a branch ID. This single function powers both the network-level table (scope=undefined) and the branch-level table (scope=branchId), keeping the rendering logic identical.

**6. The insight engine (`getDashboardInsights`) runs 8 rule-based checks** against the full dataset. Each check is a flat `if` statement pushing to an array. No scoring, no ML — just deterministic pattern matching with clear thresholds.
