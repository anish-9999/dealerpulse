# DealerPulse — Decisions Log

## What I Built

A real-time dealership performance dashboard (read-only SPA) for a 5-branch Toyota dealership network. The app ingests synthetic lead/target/delivery data and presents it through three levels of drill-down:

1. **Overview Dashboard** (`/`) — Global KPIs, monthly trends, conversion funnel, branch vs target table, stale lead alerts, delivery health, and branch leaderboard.
2. **Branch Detail** (`/branch/:id`) — Branch-specific KPIs vs targets, rep leaderboard, pipeline breakdown, and stale leads scoped to the branch.
3. **Rep Detail** (`/rep/:id`) — Individual rep performance, pipeline, lead list, and stale leads assigned to them.

## Key Product Decisions

### Client-side data processing (no backend)
The dataset is static (~500 leads in a 20K-line JSON). A backend API or database adds deployment complexity, migration overhead, and latency with zero benefit for a read-only dashboard with one user (the CEO). JavaScript's native array methods handle all aggregations (funnel, trend, stale lead detection) in under 5ms.

### Hash router over browser router
Vercel static deploys don't have server-side fallback routing. Hash router (`#/branch/B1`) avoids 404s on deep links without needing Vercel rewrites config.

### Recharts for charts
Most popular React charting library, good TypeScript support, and the built-in `ResponsiveContainer` handles tablet resizing automatically.

### Funnel as a custom 3-segment stacked bar with proportional widths, green delivered, and legend (v3)

**Data algorithm** (unchanged from earlier v3): two-pass over leads. Pass 1 classifies each lead into one bucket — lost leads increment `lostCount` at their last active stage, active/won leads increment raw `count` at their highest stage. Pass 2 computes cumulative display bars: `displayCount = cumulative`, then `cumulative -= rawCount + lostCount`.

**Visual rendering** (redesigned per spec):

- **Proportional bar widths** — each stage's total bar width is scaled relative to the largest stage (`new` is full width). This eliminates the misleading equal-width bars from the previous version; short stages visually shrink, making the funnel shape obvious at a glance.
- **3-segment stacked bar** — each bar renders three proportional segments inline: blue (`--funnel-progressed`) for leads that flowed through, amber (`--funnel-idle`) for leads stuck at this stage, and red (`--funnel-lost`) for leads lost here. No separate text labels outside the bar — the red segment makes loss proportion visual.
- **Green delivered stage** — `delivered` renders as a single green (`--funnel-delivered`) bar, no progressed/idle split, since delivered is a terminal success state. The `order_placed` idle segment still uses amber (pending delivery ≠ stuck lead, but visually consistent).
- **No lost at won stages** — `order_placed` and `delivered` suppress the lost segment (leads can't logically be lost after placing an order).
- **Legend** — four colored dots with labels (Progressed, Idle, Lost, Delivered) sit above the bars so the color encoding is self-documenting.
- **Pill-shaped bars** — `rounded-full` on the outer bar container gives a softer, more polished look. Row height increased to `h-7` with `space-y-3` for better breathing room.
- **Context-aware number rendering** — numbers appear inside a segment only when the segment is >8% of the bar width. Very small segments get their number printed as colored text just outside/adjacent to the bar, preventing cramped illegible labels.
- **CSS variables** — `--funnel-progressed`, `--funnel-idle`, `--funnel-lost`, `--funnel-delivered` defined in `index.css` for consistent reuse across components and StatusBadge if needed.

### Tab-based dashboard IA (v2)
The original linear-scroll dashboard forced the user through all panels regardless of interest. Four horizontal tabs (Business Health, Pipeline & Quality, Operations, Delivery) group related panels and let the user focus on the relevant domain. Each tab loads its content lazily (rendered only when active).

### Insights: deduped and expanded (v2 → v3)
The original branch-target alerts were removed in v2 because the branch table already shows targets. In v3, they returned in a different form: **lead-volume gap** alerts flag branches where total lead volume < target units, reframing the problem from "sales isn't converting" to "marketing isn't generating enough leads." Three new rules were added: **source-quality mismatch** (high-volume sources with below-avg conversion, actionable for marketing budget), **tenure-aware bottom performer** (excludes reps with <2 months tenure to avoid falsely flagging new hires), and **single highest-value at-risk lead** (surfaces the largest stale deal by value with customer name and stage). The bottom-performer threshold (<3 all-time wins) was kept but the tenure filter prevents noise from ramp-up period.

### Revenue chart: stacked by branch with target line (v2)
A stacked bar chart shows each month's total revenue broken down by branch contribution, with a dashed red target line overlaid. This replaces the previous simple Revenue-vs-Target bar chart and gives the user both branch-level decomposition and network-level target tracking in one chart.

### No separate KPI grid (v2)
The original dashboard showed both a 3-card hero row (Revenue, Pipeline Value, Conversion Rate) and a 6-card KPI grid (same metrics + more). The 6-card grid was removed to eliminate duplication; the hero row (now on the Business Health tab) serves as the single KPI snapshot.

### Reps directory page (v2)
A new `/reps` page lists all sales representatives in a sortable, branch-filterable table with key metrics (leads, wins, conversion, revenue, avg deal). This adds a missing cross-cutting view that wasn't available through the branch detail pages alone.

### Month filter scope (v2)
The month filter now only scopes "snapshot" data (tab 1–3 panels). Trend charts (delivery trend, stacked revenue chart) always show all months regardless of the selected filter, since trends lose meaning when filtered to a single month.

### Stale lead threshold
Set at 7 days of inactivity for active pipeline leads (new/contacted/test_drive/negotiation). This surfaced ~30+ leads needing follow-up across branches.

### Key Insights section (v3)
Renamed from "All Insights" and moved to the top of the Business Health tab (above the revenue chart). Always expanded (not collapsible) since it's the first thing a CEO should see. The cards are informational only (not clickable) to keep the reading experience clean. The HeadlineInsight banner still cycles the top 3 alerts/tips at the very top of the page for persistent awareness during navigation.

### Avg Deal Value column (v3)
Added a sortable "Avg Deal" column to the branch performance table between Revenue and Target Units, computed as `totalRevenue / wonLeads` displayed in lakhs (₹X.XXL). This was already computed in branch detail views but wasn't surfaced at the aggregate level where a CEO would naturally compare branches.

### Section header clickable (v3)
The collapsible section header is now entirely clickable (not just the chevron), with `cursor-pointer` styling to indicate interactivity.

## Tradeoffs

| Decision | Rationale | Downside |
|---|---|---|
| No backend/DB | Zero ops, instant load, simpler deploy | Not extensible to multi-user or live data |
| Static JSON import | Avoids fetch latency | Bundle includes all data (~500KB) |
| Hash router | Predictable Vercel deploys | URLs include `#/` |
| No auth (per spec) | Focus on dashboard value | Not production-ready without SSO |
| Rule-based insights | No API keys, instant results | Less nuanced than LLM-generated |

## What I'd Build Next

1. **Live data ingestion** — Webhook or cron that syncs leads from a CRM (Salesforce/HubSpot) into a Postgres DB
2. **Auth & multi-tenancy** — Branch managers see only their branch; CEO sees all
3. **Lead write-back** — Managers mark leads as contacted, update stage, assign reps
4. **Forecasting model** — Weighted pipeline projection using historical stage-to-close ratios per branch
5. **AI summaries** — GPT-powered natural language brief for each branch/rep
6. **PDF export** — One-click snapshot of any view for meetings
7. **WebSocket real-time updates** — Live "lead just went stale" push notifications
8. **Anomaly detection** — Statistical model flagging abnormal conversion drops or delivery delays

## Interesting Data Patterns Noticed

- **Highway Toyota (B2)** has the lowest conversion rate (~15%) but the highest lead volume — suggests lead quality or follow-up process issues
- **Q4 delivery times spike significantly** — Nov–Dec avg >25 days vs Jun–Jul avg ~13 days. Almost entirely driven by "Accessory fitment backlog" and "Vehicle allocation delayed from factory", suggesting backend operational bottlenecks
- **Lost lead reasons cluster by stage** — Leads lost at "new" stage cite "budget constraints" and "relocated"; leads lost at "negotiation" cite "better offer elsewhere" and "chose competitor" — suggesting two different failure modes requiring different interventions
- **Central Toyota (B4) consistently hits targets** despite being the smallest branch — smaller team but higher efficiency
- **Eastside Toyota (B5)** has the most stale leads (8+), mostly assigned to SR27 (Manoj Mehta) — potential capacity or process issue

---

## v4 (Current) — Consolidated Refinement

### 3-tab IA (Delivery folded into Operations)
Delivery is not a separate dashboard concern — it's the same "how fast are we treating the customer" story applied post-sale. Merging Response Speed, Stale Leads, and Fulfillment into a single Operations tab gives the reader one place to assess velocity on both sides of the sale. The tab labels became: **Business Health** (is the business on track?), **Pipeline & Quality** (where are we winning and losing?), **Operations** (how fast are we moving?).

### Table over bar charts for multi-metric comparisons
Three panels were converted from bar-length-by-volume to sortable tables: Source Performance, Model Performance, and the existing Branch Performance table. The reasoning: bar length sized by a single metric (lead volume) conflates volume with quality — a high-volume, low-conversion source like Social Media looked "strong" because its bar was long. A table surfaces leads, won, conversion %, and avg deal value as peer columns without any single metric dominating the visual channel.

### Funnel blue-segment double-counting fix
The blue "progressed" segment was `cumulative - idle` only, silently counting lost leads as both progressed (blue) and lost (red). Fixed to `cumulative - idle - lost`. Verified: idle (222) + lost (288) = 510 total leads, zero double-count.

### Funnel visual redesign
Full spec applied: proportional bar widths, 3-segment inline bars (blue/amber/coral), green delivered stage (no amber for won deals), color legend, pill-shaped rounded-full bars, context-aware number rendering, CSS variables for funnel colors.

### Response Speed distribution instead of raw 48h+ list
The old "X leads waited 48h+" was a single count with a few names. Replaced with three-bucket distribution (0-24h, 24-48h, 48h+) showing the responsiveness shape at a glance, plus a capped top-10 slowest-first-contact list with full context (model, source, status, rep). This prevented ~186 individual entries from overwhelming the UI.

### Lead-volume-vs-target as the headline insight
Every branch's lead volume falls short of its target — even at 100% conversion, targets are unreachable. This reframes the network's core problem from "sales isn't converting" to "lead generation is the bottleneck." Computed as the gap between `totalLeads` and `targetUnits` for each branch, aggregated into a single network-wide alert.

### Delivery-time degradation as a tracked insight
Delivery time nearly doubled from ~13d early in the period to ~25d in Nov–Dec. The insight compares H1 vs H2 averages and flags when H2 exceeds H1 by 50%+. This surfaced a finding that was previously only visible by reading the trend chart.

### Welcome splash
Brief 800ms branded loading moment (app name + tagline + spinner) so the app feels polished on first load rather than flashing instantly to a data table. The data loads synchronously from a client-side JSON import, so the delay is purely cosmetic.

### Client-side data tradeoff
The dataset (~510 leads, 5 branches, 7 months) fits comfortably in a client bundle. A real multi-tenant production system would move to a backend API with proper querying, pagination, and authentication. This static-client approach was chosen for project scope and turnaround time, not as an architectural recommendation.

### Conversion rate definition
All conversion rates in the app are defined as: **percentage of leads created in the filtered period that have since closed as a win (delivered or order_placed)**. A lead created in June may be won in August — it still counts toward June's conversion rate. This means conversion rate can exceed 100% if `wonLeads > totalLeads` within a period (though this does not occur in the current dataset). The tooltip on each Lead Conv. Rate KPI and comparison card makes this explicit: *"Percentage of leads created this month that have since closed as a win (not necessarily in the same month)."* Sample sizes are shown alongside (e.g. "100.00% (4 leads)") so the reader can immediately discount unreliable percentages.

### Interesting Data Patterns (v4 additions)

- **Lead volume is the binding constraint.** Every branch's lead count is below its unit target. Even if every single lead converted, the network would still miss its target by ~86 units. This is a fundamentally different problem from "conversion needs improvement" — it's a pipeline generation problem.
- **Delivery time degrades 2x over the period.** Jun avg ~13d → Dec avg ~25d. The trend accelerates from September onward, with "Accessory fitment backlog" and "Vehicle allocation delays" as the dominant root causes. This is the single steepest operational degradation in the dataset.
- **Model performance tells a different story when sorted by conversion vs volume.** Fortuner (72 leads, 38% conv) and Innova Hycross (58 leads, 43% conv) have similar won counts but very different conversion patterns. A volume-sorted bar chart hid this; a conversion-sorted table surfaces it.
- **Response time spread across branches is negligible (45.5h–47.6h).** Despite being a stale-lead contributor, the by-branch breakdown shows nearly identical averages — the problem is network-wide, not branch-specific.

### What to build next (time permitting)
- **Lead forecasting model** — weighted pipeline projection using historical stage-to-close ratios per branch
- **Full drill-down for response speed** — the top-10 capped list is a simplification; a searchable full list with filters would be more useful for day-to-day management
- **Multi-period comparison** — month-over-month conversion rate trends for sources and models

### Rep detail presentation cleanup

Three presentation changes on the `/rep/:id` page, all purely cosmetic — no data logic changes:

1. **Standardized KPI comparison format.** Revenue was using percentile framing ("Top 92% in network") while the other three cards used delta framing ("+9.54pts", "+₹0.09L"). Switched Revenue to the same two-line delta format (Branch avg vs Network avg) so a reader scanning all four cards sees the same shape of information each time. This required adding `totalRevenue` to the `RepAverages` type to expose per-rep average revenue.

2. **Split Deals Won card.** The packed "12 delivered · 2 pending · Branch avg 11.80 (+2.20) · Network avg ..." single subtitle was dense and hard to parse. Now renders the delivered/pending breakdown as the first subtitle line and the branch/network comparison as a second line, using `whitespace-pre-line` on the KPICard subtitle to render `\n` as a real line break.

3. **Clarified Active stat.** "Active: 0" next to "2 orders pending" read as "nothing in motion" when 2 deals were still being fulfilled. Added a hover tooltip: "Active = leads not yet won or lost" so it's unambiguous that pending-delivery orders are tracked under Won, not Active.
