# Comparative Analytics — Parameter Definitions

## Overview

Every number on a rep or branch card is framed relative to a peer benchmark. This file defines what each parameter means and how it's computed.

---

## `BranchComparison` (BranchDetail page)

Used on `/branch/:id`. The "Network Avg" is computed across **all 5 branches** (pooled).

| Card | Branch Value | Network Avg | Meaning |
|------|-------------|-------------|---------|
| **Conversion Rate** | `branch.wonLeads / branch.totalLeads × 100` | `∑ allBranches.wonLeads / ∑ allBranches.totalLeads × 100` | What % of leads this branch converts vs the network's pooled conversion rate |
| **Avg Deal Value** | `branch.totalRevenue / branch.wonLeads` → formatted to 2 decimal places | `∑ allBranches.totalRevenue / ∑ allBranches.wonLeads` → formatted to 2 decimal places | Average ₹ per won deal at this branch vs the network average |
| **Units Won** | `branch.wonLeads` (raw count, integer) | `∑ allBranches.wonLeads / 5 branches` → formatted to 2 decimal places | How many cars this branch sold vs the average across all 5 branches |

**IsAbove**: Branch value > network avg → green (above avg), else red (below avg).

---

## `RepComparison` (RepDetail page)

Used on `/rep/:id`. Compares a single rep against two peer groups.

| KPI Card | Branch Avg | Network Avg | Delta Format |
|----------|-----------|-------------|--------------|
| **Deals Won** | `∑ branch.officers.wonLeads / count(branch.officers)` | `∑ allOfficers.wonLeads / count(allOfficers)` | `branch avg X (+N) · network avg Y (+N)` |
| **Conversion Rate** | `∑ branch.officers.wonLeads / ∑ branch.officers.totalLeads × 100` | `∑ allOfficers.wonLeads / ∑ allOfficers.totalLeads × 100` | `branch avg X% (+Npts) · network avg Y% (+Npts)` |
| **Avg Deal Value** | `∑ branch.officers.totalRevenue / ∑ branch.officers.wonLeads` | `∑ allOfficers.totalRevenue / ∑ allOfficers.wonLeads` | `branch avg ₹X (+₹N) · network avg ₹Y (+₹N)` |
| **Revenue** | *Not compared* — shows `Top Nth% in network` percentile | | Percentile rank among all officers by won units |

### Scope rules
- **Branch Avg**: only `sales_officer` role reps in the same branch as the target rep (excludes `branch_manager`).
- **Network Avg**: only `sales_officer` role reps across all branches (excludes `branch_manager`).
- **Percentile**: `(count of officers with fewer or equal won deals / total officers) × 100`. Higher is better. Managers excluded.

### Delta sign
- `+N` ahead of benchmark, `‑N` behind.

---

## `RepAverages` (internal type)

Used as the return shape for both branch-avg and network-avg in comparisons.

| Field | Computation | Unit |
|-------|------------|------|
| `conversionRate` | `totalWon / totalLeads` × 100 | percentage (pooled, not mean of means) |
| `avgDealValue` | `totalRevenue / totalWon` | rupees (weighted by won count) |
| `unitsWon` | `totalWon / repCount` (or `totalWon / branchCount` depending on scope) | unit count (mean per entity) |

**Key invariant**: `unitsWon` is always an **average per entity** (per rep or per branch), never a sum. This keeps delta comparisons meaningful (individual vs average, not individual vs total).

---

## Dashboard Branch Table sort columns

| Column Key | Source Field | Type |
|-----------|-------------|------|
| `name` | `branch.name` | string (lexicographic) |
| `city` | `branch.city` | string (lexicographic) |
| `totalLeads` | `branchSummary.totalLeads` | number |
| `wonLeads` | `branchSummary.wonLeads` | number |
| `totalRevenue` | `branchSummary.totalRevenue` | number |
| `targetUnits` | `branchSummary.targetUnits` | number |
| `unitsProgress` | `branchSummary.unitsProgress` | number (0–100) |
| `conversionRate` | `branchSummary.conversionRate` | number (0–100) |
