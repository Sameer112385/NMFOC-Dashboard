# AI Handover Document

## 1. Current Architecture
- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **UI/Styling**: React 19, Tailwind CSS v4, Lucide React (icons), Recharts (data visualization)
- **Database/Backend**: Supabase (PostgreSQL), Supabase Auth
- **Deployment**: Vercel-ready

## 2. Database Schema (Key Tables)
- `projects`: Core project metadata (code, name, client, status, PM assignment).
- `users_profile`: Application user profiles containing RBAC roles (`Admin`, `Cost Controller`, `Project Manager`, `Viewer`).
- `project_wbs_master`: WBS configuration logic (`is_revenue_generating`, `include_in_cost`).
- `project_cost_elements`: GR55 Cost Element mapping (`include_in_cost`).
- `project_subcontracts`: PO-level subcontractor package configurations.
- `project_manpower_master`: Labor rates.
- `project_material_master`: Planned material quantities and unit prices.
- `financial_sources`: Raw financial data ingested from CN41 (SAP WBS) and GR55 (SAP Cost).

## 3. API Endpoints
- **Data Ingestion**: `/api/financial-sources` (Handles Excel upload/parsing for CN41 & GR55).
- **Recalculation**: `/api/financial-sources/recalculate` (Recalculates WBS metrics based on master data toggles).
- **Project Master Data**: 
  - `/api/projects/[id]` (PATCH)
  - `/api/project-wbs-master`
  - `/api/project-cost-elements`
  - `/api/project-subcontracts`
- **Resource Masters**:
  - `/api/project-masters/manpower`
  - `/api/project-masters/materials`
  - `/api/project-masters/bulk` (Excel template uploads)

## 4. Business Rules
1. **WBS Revenue/Cost Logic**: 
   - Recognized Revenue is derived *only* from WBS lines checked as `is_revenue_generating` in WBS Master.
   - Actual Cost is derived *only* from WBS lines checked as `include_in_cost` in WBS Master.
2. **Cost Element Logic**:
   - GR55 Cost Elements must be checked as `include_in_cost` in the Cost Element Control panel to be included in calculations. High-level categories include Materials, Manpower, Subcontractor, Rental, etc.
   - "(Materials + Consumables)" is treated as "Materials".
3. **Subcontractor Performance**:
   - Subcontractor accruals and performance are analyzed by PO Number matching against GR55 Purchasing Documents.
4. **Role-Based Access Control (RBAC)**:
   - **Admin / Cost Controller**: Full edit access to all Project Master Data panels and the Settings module.
   - **Project Manager / Viewer**: Read-only access to Project Master Data (inputs disabled, save buttons hidden). The Settings module (`/settings`) is completely hidden from the sidebar and redirects to `/dashboard` if accessed directly.

## 5. Files Modified Today
- **RBAC Implementation (Master Data & Settings)**:
  - `lib/current-user.ts` (Added `canEditProjectMaster` and `canAccessSettings` helpers)
  - `app/(app)/layout.tsx`, `components/app-shell.tsx`, `components/sidebar.tsx` (Sidebar UI hiding for Settings)
  - `app/(app)/settings/page.tsx` (Server-side redirect)
  - `app/(app)/projects/[projectId]/page.tsx` (Prop drilling `canEdit` flag)
  - `components/project-admin-workspace.tsx` (Read-only banner)
  - `components/project-admin-details-form.tsx` (Fieldsets disabled for read-only)
  - `components/project-master-admin-panel.tsx`
  - `components/project-cost-element-control-panel.tsx`
  - `components/project-wbs-master-panel.tsx`
- **Dashboard & Cost Trend Analysis**:
  - `components/trend-analysis-panel.tsx` (Implemented high-level project-wide trend analysis by cost element group when no WBS is selected).
  - `lib/financial-engine.ts`, `lib/trends.ts` (Subcontractor PO tracking and data aggregation).

## 6. Open Issues
- Currently, there are no blocking bugs.
- *Note:* Supabase Row-Level Security (RLS) policies for enforcing RBAC at the database layer are recommended for production (currently enforced via UI/Server Components).

## 7. Next Recommended Tasks
1. **PM Daily Updates**: Build out the daily progress update wizards for Project Managers.
2. **Supabase RLS**: Implement strict Postgres Row-Level Security (RLS) policies referencing `users_profile.role` to ensure backend data integrity matches the frontend RBAC.
3. **Advanced Reporting**: Build out the comprehensive `/reports` section with PDF export capabilities.
