# AI Handover - NMFOC Dashboard

Date: 2026-06-23
Project root: `D:\Antigravity\NMFOC Dashboard`

## 1. Current Architecture

This is a Next.js App Router application backed by Supabase. The app is a project financial control dashboard for SAP-derived project data, with Cost-to-Cost revenue recognition.

Main layers:

- Frontend pages live under `app/(app)`.
- API routes live under `app/api`.
- Reusable UI components live under `components`.
- Business logic and data access live under `lib`.
- Supabase schema and manual setup scripts live under `supabase`.
- Local/demo database fallback lives in `lib/local-db.ts`.

Core flow:

1. Upload source files from Financial Sources page.
2. Parse and store raw source rows in Supabase.
3. Run calculation on upload or manual recalculation.
4. Save calculated output in `revenue_wbs`.
5. Dashboards and reports read saved output instead of recalculating from raw GR55/CN41/Sales Order each page load.

Important modules:

- `lib/financial-imports.ts`: Parses GR55 and Sales Order files.
- `lib/cn41.ts`: Parses CN41 files and extracts WBS/planned cost structure.
- `lib/financial-engine.ts`: Combines CN41, GR55, Sales Order, PM updates, WBS Master, and Cost Element Control into calculated revenue WBS rows.
- `lib/calculations.ts`: Cost-to-Cost formulas, summaries, risk alerts, and snapshots.
- `lib/pm-posting.ts`: PM simulation and SAP posting inclusion logic.
- `lib/data.ts`: Server-side data access for pages.
- `lib/supabase/pagination.ts`: Fetches all Supabase rows across pages to avoid the default 1000-row truncation.
- `lib/financial-format.ts`: Truncates calculated numeric outputs to 2 decimals before saving.

## 2. Database Schema

Primary tables:

- `users_profile`: App user profile and role mapping.
- `projects`: Project header, client, project manager assignment, status, site, subcontract summary legacy fields.
- `cn41_uploads`: CN41 file upload metadata.
- `cn41_rows`: Parsed CN41 rows. Used only for planned cost and WBS hierarchy/mapping.
- `gr55_uploads`: GR55 file upload metadata.
- `gr55_rows`: Parsed GR55 actual cost rows. Raw audit source for SAP actual cost.
- `sales_order_uploads`: Sales Order file upload metadata.
- `sales_order_rows`: Parsed Sales Order revenue rows. Source of planned/contract revenue.
- `revenue_wbs`: Saved calculated output by project/WBS. Dashboard source of truth.
- `project_wbs_master`: Project-level WBS control table for revenue WBS and Include in Cost settings.
- `project_cost_element_control`: Project-level GR55 cost element include/exclude settings.
- `project_manpower_rates`: Manpower rate master.
- `project_material_master`: Planned material master.
- `project_subcontracts`: Subcontract package master.
- `pm_daily_updates`: PM simulated cost and SAP posting control history.
- `simulation_snapshots`: Financial snapshot totals.
- `risk_alerts`: Generated risk flags.
- `comments`: Project comments.

Key schema notes:

- `revenue_wbs.upload_id` references `cn41_uploads`; non-CN41 recalculations now pass `null` to avoid FK errors.
- `project_wbs_master` is the single control point for WBS inclusion/exclusion.
- `project_cost_element_control` is the single control point for GR55 cost element inclusion/exclusion.
- GR55 raw rows remain stored for audit, but dashboards should not scan them on page load.
- `revenue_wbs` contains both SAP and Management view metrics.

## 3. API Endpoints

Financial source APIs:

- `POST /api/financial-sources/upload`
  Uploads CN41, GR55, and Sales Order files. Stores raw rows, syncs missing cost elements from GR55, recalculates `revenue_wbs`.

- `POST /api/financial-sources/recalculate`
  Manual recalculation from latest stored source rows and current project controls. Also backfills missing GR55 cost elements into `project_cost_element_control`.

- `GET /api/financial-sources/latest`
  Returns latest CN41, GR55, and Sales Order upload metadata for a project.

Project setup APIs:

- `POST /api/projects`
  Create project.

- `PATCH /api/projects/[projectId]`
  Update project header and PM assignment.

- `DELETE /api/projects/[projectId]`
  Delete project and related project data.

- `POST /api/project-wbs-master`
  Save WBS Master settings.

- `POST /api/project-cost-elements`
  Save cost element include/exclude settings.

- `POST /api/project-subcontracts`
  Save subcontract packages.

- `POST /api/project-masters/manpower`
  Create manpower rate.

- `DELETE /api/project-masters/manpower`
  Delete manpower rate.

- `POST /api/project-masters/materials`
  Create material master row.

- `DELETE /api/project-masters/materials`
  Delete material master row.

- `POST /api/project-masters/bulk`
  Bulk upload manpower/material master templates.

- `GET /api/project-masters/template`
  Download manpower/material template.

PM and posting APIs:

- `POST /api/pm-updates`
  Save PM Daily Update and refresh financial outputs.

- `PATCH /api/pm-updates`
  Update SAP posting control status for subcontractor, manpower, and material sections, then refresh financial outputs.

Admin/settings APIs:

- `GET /api/settings/supabase`
  Read Supabase connection status.

- `POST /api/settings/supabase`
  Save/test Supabase connection settings.

- `GET /api/admin/users`
  List users.

- `POST /api/admin/users`
  Create user.

- `PATCH /api/admin/users`
  Update user.

- `DELETE /api/admin/users`
  Delete user.

- `GET /api/admin/backup`
  Export backup Excel.

- `POST /api/admin/reset`
  Reset app data or full reset depending request body.

## 4. Business Rules

Revenue recognition methodology:

- Planned Cost = CN41 planned cost from `OCostPlan0`.
- CN41 is used only for WBS structure, WBS identification, WBS description, hierarchy level, and planned cost.
- CN41 actual cost and CN41 revenue are not used for recognition.
- Planned Revenue = Sales Order `Net Value` grouped by Sales Order `WBS Element`.
- GR55 Actual Cost = `Val/COArea Crcy`.
- GR55 date basis = `Posting Date`.
- GR55 blank `WBS Element` rows are excluded.
- GR55 negative values are included as-is.
- GR55 cost category = `Cost element name`.

Cost-to-Cost formulas:

- SAP Actual Cost = GR55 actual cost after WBS and cost element filters.
- PM Simulated Cost = active PM Daily Update cost where relevant still-simulating flags are true.
- Management Actual Cost = SAP Actual Cost + PM Simulated Cost.
- POC % = Management Actual Cost / Planned Cost.
- Recognized Revenue = POC % x Planned Revenue.
- SAP POC % = SAP Actual Cost / Planned Cost.
- SAP Recognized Revenue = SAP POC % x Planned Revenue.

WBS Master rules:

- WBS Master is populated from CN41 rows where `ObjectType = WBS element`.
- WBS code = CN41 `Projektelm`.
- WBS description = CN41 `Project object`.
- Planned cost = CN41 `OCostPlan0`.
- If `Include in Cost` is checked, that WBS contributes to planned/actual cost calculations.
- If `Include in Cost` is unchecked, that WBS is excluded from all cost calculations.
- If `Revenue WBS` is checked, that WBS appears in revenue-facing dashboards and PM Daily Update WBS selection.

Cost Element Control rules:

- Cost elements are inferred from GR55 and stored in `project_cost_element_control`.
- Missing cost elements are inserted with `include_in_cost = true`.
- Existing include/exclude user settings must not be overwritten by upload or recalculate.
- Excluded cost elements remain in raw GR55 source but are ignored in calculations.

PM simulation and SAP posting rules:

- PM Daily Update represents real work performed but not yet posted in SAP.
- Still Simulating checked = include in management actual cost.
- Still Simulating unchecked = treated as posted in SAP/stop simulation and excluded from active management calculation.
- PM history remains visible even when no longer simulated.
- Separate posting control exists for subcontractor, manpower, and material.
- Posting control stores posting date, posted by, reference, updated by, and updated date fields where available.

Dashboard rules:

- Dashboard should read saved `revenue_wbs` output, not recalculate from raw GR55 on page load.
- Heavy recalculation happens only on upload, manual Recalculate Financials, or PM update changes.
- Top KPI cards and WBS Financial Analysis should use the same saved WBS totals.
- Calculated numeric outputs saved to `revenue_wbs` are truncated to 2 decimals, not rounded.

## 5. Files Modified Today

Pages:

- `app/(app)/cost-elements/page.tsx`
- `app/(app)/dashboard/[projectId]/page.tsx`
- `app/(app)/projects/[projectId]/page.tsx`

API routes:

- `app/api/admin/backup/route.ts`
- `app/api/admin/reset/route.ts`
- `app/api/financial-sources/recalculate/route.ts`
- `app/api/financial-sources/upload/route.ts`
- `app/api/pm-updates/route.ts`
- `app/api/project-cost-elements/route.ts`

Components:

- `components/cn41-upload-form.tsx`
- `components/cost-elements-page-client.tsx`
- `components/project-admin-details-form.tsx`
- `components/project-admin-workspace.tsx`
- `components/project-cost-element-control-panel.tsx`
- `components/sidebar.tsx`

Libraries:

- `lib/data.ts`
- `lib/financial-engine.ts`
- `lib/financial-format.ts`
- `lib/financial-imports.ts`
- `lib/local-db.ts`
- `lib/supabase/pagination.ts`
- `lib/types.ts`

Supabase SQL:

- `supabase/manual-setup.sql`
- `supabase/schema.sql`

## 6. Open Issues

Performance and data volume:

- GR55 raw data can be very large. Reading all GR55 rows into Next.js is expensive and should remain limited to upload/recalculate flows.
- Recalculate can still take tens of seconds for very large GR55 datasets because calculation is still done in the Next.js server process.
- Consider database-side aggregation or summary tables if project data grows beyond current volumes.

Period/filter reporting:

- Current saved output is primarily WBS-level current snapshot in `revenue_wbs`.
- For fast historical filters, add period-level summary tables such as `revenue_wbs_periods` and cost-category period summaries.
- Without period summary tables, deep historical period filters may require raw GR55 reads or recalculation.

Cost elements:

- Cost elements are now synced during GR55 upload/recalculate, but older projects require one manual Recalculate Financials to backfill the control table.
- Need verify all expected cost elements appear after clearing duplicate GR55 data and re-uploading latest GR55.

Decimal formatting:

- Calculated `revenue_wbs` values are truncated to 2 decimals going forward.
- Existing long-decimal records in Supabase require Recalculate Financials to rewrite clean values.

Source data cleanup:

- User had around 350k GR55 rows due repeated uploads. Need clear old GR55 rows before re-uploading final source file.
- Safe SQL for all GR55 cleanup:

```sql
delete from public.gr55_rows;
delete from public.gr55_uploads;
notify pgrst, 'reload schema';
```

Security/RLS:

- Some RLS policies were adjusted during PM posting control work.
- Need perform a full pass on RLS before production release.
- Project Manager visibility should be validated end-to-end: PM should only see assigned project.

Testing gaps:

- Need automated tests for financial engine scenarios: no cost, partial cost, overrun, amendments, zero planned cost, excluded WBS, excluded cost element, active/inactive PM simulation.
- Need end-to-end import test using sample CN41, GR55, and Sales Order files.

## 7. Next Recommended Tasks

1. Clear duplicate GR55 data in Supabase and re-upload the latest GR55 file.
2. Click Project Module -> Recalculate Financials once after upload.
3. Validate Cost Element Control count against GR55 distinct cost elements.
4. Validate project planned cost against WBS Master Include in Cost selections.
5. Validate dashboard Recognized Revenue equals WBS Financial Analysis total.
6. Add `revenue_wbs_periods` table for fast MTD/YTD/custom period filters.
7. Add `revenue_wbs_cost_categories` or similar summary table for cost category trends.
8. Add `last_calculated_at`, source version fields, and calculation status to projects or a new calculation log table.
9. Move heavy recalculation to a background job/queue if deployed beyond local usage.
10. Add indexes for large tables:

```sql
create index if not exists idx_gr55_rows_project_wbs_date on public.gr55_rows(project_id, wbs_code, posting_date);
create index if not exists idx_gr55_rows_project_cost_element on public.gr55_rows(project_id, cost_element);
create index if not exists idx_sales_order_rows_project_wbs on public.sales_order_rows(project_id, wbs_code);
create index if not exists idx_cn41_rows_project_wbs on public.cn41_rows(project_id, wbs_code);
create index if not exists idx_revenue_wbs_project_wbs on public.revenue_wbs(project_id, wbs_code);
```

11. Review Supabase RLS policies for all tables before production.
12. Add audit metadata to recalculation output: calculated by, calculated at, source versions used.
13. Add clear user messaging for long-running uploads/recalculations.
14. Add backup/export before destructive reset actions.
15. Build automated financial regression tests for the Cost-to-Cost engine.

## Operational Notes

Current recommended user workflow:

1. Upload CN41 planned cost.
2. Upload Sales Order planned revenue.
3. Upload GR55 actual cost.
4. Maintain WBS Master Include in Cost and Revenue WBS flags.
5. Maintain Cost Element Control include/exclude flags.
6. Click Recalculate Financials.
7. Use dashboard/reports from saved `revenue_wbs` output.

Important command used for validation:

```powershell
& '.\node-v24.16.0-win-x64\node-v24.16.0-win-x64\node.exe' '.\node_modules\typescript\bin\tsc' --noEmit --pretty false
```

Last validation status: TypeScript check passed after latest dashboard consistency and decimal truncation changes.
