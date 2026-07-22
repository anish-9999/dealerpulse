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

### Funnel as a custom stacked bar (not Recharts Funnel)
The Recharts `Funnel` component doesn't display drop-off counts cleanly. A custom horizontal bar chart with labels reads better and works responsively.

### Stale lead threshold
Set at 7 days of inactivity for active pipeline leads (new/contacted/test_drive/negotiation). This surfaced ~30+ leads needing follow-up across branches.

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
