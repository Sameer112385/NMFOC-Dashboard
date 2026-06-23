import { notFound } from 'next/navigation';
import { PageShell, Badge, StatRow } from '@/components/ui';
import { DashboardWbsFilter } from '@/components/dashboard-wbs-filter';
import { ProjectMasterAdminPanel } from '@/components/project-master-admin-panel';
import {
  getDailyUpdates,
  getProjectById,
  getProjectManpowerRates,
  getProjectMaterialMaster,
  getProjectWbsMaster,
  getRevenueGeneratingRows,
  getRevenueRows,
} from '@/lib/data';
import { buildRiskAlerts } from '@/lib/calculations';
import { clampPercent, formatCurrency, formatPercent } from '@/lib/utils';
import {
  RevenueVsSimulationChart,
  CostComparisonChart,
  TopWbsChart,
  RevenueSplitChart,
  RiskChart,
  PocChart,
} from '@/components/charts';
import { getEffectivePendingCost } from '@/lib/pm-posting';
import { Briefcase, Coins, Percent, TrendingUp, Activity, ShieldAlert, DollarSign } from 'lucide-react';

function StatCard({ title, value, icon: Icon, tone = 'default', hint }: { title: string; value: string; icon: any; tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'; hint?: string }) {
  const toneClasses = {
    default: 'border-white/5 bg-white/[0.02]',
    accent: 'border-accent/20 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent',
    success: 'border-success/20 bg-gradient-to-br from-success/15 via-success/5 to-transparent',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/15 via-warning/5 to-transparent',
    danger: 'border-danger/20 bg-gradient-to-br from-danger/15 via-danger/5 to-transparent',
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</span>
        <Icon className="h-4.5 w-4.5 text-accent" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-text">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted/80">{hint}</div> : null}
    </div>
  );
}

export default async function ProjectDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) return notFound();

  const [revenueRows, costRows] = await Promise.all([
    getRevenueGeneratingRows(projectId),
    getRevenueRows(projectId),
  ]);
  const updates = await getDailyUpdates(projectId);
  const manpowerRates = await getProjectManpowerRates(projectId);
  const materialMasters = await getProjectMaterialMaster(projectId);
  const projectWbsMaster = await getProjectWbsMaster(projectId);
  const risks = buildRiskAlerts(revenueRows);

  const plannedCost = costRows.reduce((sum, row) => sum + row.planned_cost, 0);
  const actualCost = costRows.reduce((sum, row) => sum + row.actual_cost_to_date, 0);
  const sapActualCost = costRows.reduce((sum, row) => sum + (row.sap_actual_cost ?? 0), 0);
  const pmSimulatedCost = costRows.reduce((sum, row) => sum + (row.pm_pending_cost ?? 0), 0);
  const plannedRevenue = revenueRows.reduce((sum, row) => sum + row.planned_revenue, 0);
  const recognizedRevenue = revenueRows.reduce((sum, row) => sum + row.recognized_revenue_to_date, 0);
  const sapRecognizedRevenue = revenueRows.reduce((sum, row) => sum + (row.sap_earned_revenue ?? 0), 0);
  const remainingRevenue = plannedRevenue - recognizedRevenue;
  const remainingCost = plannedCost - actualCost;
  const forecastCost = costRows.reduce((sum, row) => sum + row.forecast_cost, 0) || actualCost;
  const forecastMargin = plannedRevenue - forecastCost;
  const forecastMarginPercent = plannedRevenue > 0 ? (forecastMargin / plannedRevenue) * 100 : 0;
  const pocPercent = clampPercent(plannedCost > 0 ? (actualCost / plannedCost) * 100 : 0);
  const sapPocPercent = clampPercent(plannedCost > 0 ? (sapActualCost / plannedCost) * 100 : 0);
  const sapMargin = plannedRevenue - sapActualCost;
  const managementMargin = plannedRevenue - actualCost;
  const mtdActual = costRows.reduce((sum, row) => sum + row.mtd_actual_cost, 0);
  const ytdActual = costRows.reduce((sum, row) => sum + row.ytd_actual_cost, 0);
  const mtdRevenue = revenueRows.reduce((sum, row) => sum + row.mtd_revenue_recognition, 0);
  const ytdRevenue = revenueRows.reduce((sum, row) => sum + row.ytd_revenue_recognition, 0);
  const currentMonthRevenue = mtdRevenue;
  const openingRecognizedRevenue = revenueRows.reduce((sum, row) => sum + (row.opening_recognized_revenue ?? 0), 0);
  const latestPmUpdate = updates[0] ?? null;
  const riskChartData = Array.from(risks.reduce((map, risk) => map.set(risk.risk_type, (map.get(risk.risk_type) ?? 0) + 1), new Map<string, number>()), ([name, value]) => ({ name, value }));

  return (
    <PageShell title={`${project.project_name} Financial Summary`} subtitle="Cost-to-Cost revenue recognition using Sales Order revenue, CN41 planned cost, and GR55 actual cost." actions={<Badge tone="accent">{project.project_code}</Badge>}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Planned Revenue" value={formatCurrency(plannedRevenue)} icon={DollarSign} tone="accent" />
        <StatCard title="Recognized Revenue" value={formatCurrency(recognizedRevenue)} icon={TrendingUp} tone="success" />
        <StatCard title="Management Actual Cost" value={formatCurrency(actualCost)} icon={Coins} tone="accent" hint="GR55 actual + active PM simulated cost" />
        <StatCard title="Forecast Margin" value={formatCurrency(forecastMargin)} icon={Percent} tone={forecastMargin >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Planned Cost" value={formatCurrency(plannedCost)} icon={Briefcase} />
        <StatCard title="POC %" value={formatPercent(pocPercent)} icon={Percent} tone="success" />
        <StatCard title="MTD Revenue Recognition" value={formatCurrency(mtdRevenue)} icon={TrendingUp} tone="accent" />
        <StatCard title="YTD Revenue Recognition" value={formatCurrency(ytdRevenue)} icon={TrendingUp} tone="accent" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">SAP View</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="GR55 actual cost" value={formatCurrency(sapActualCost)} />
            <StatRow label="SAP POC %" value={formatPercent(sapPocPercent)} />
            <StatRow label="SAP recognized revenue" value={formatCurrency(sapRecognizedRevenue)} />
            <StatRow label="SAP margin" value={formatCurrency(sapMargin)} />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">Management View</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="GR55 actual cost" value={formatCurrency(sapActualCost)} />
            <StatRow label="PM simulated cost" value={formatCurrency(pmSimulatedCost)} />
            <StatRow label="Management actual cost" value={formatCurrency(actualCost)} />
            <StatRow label="Management POC %" value={formatPercent(pocPercent)} />
            <StatRow label="Management recognized revenue" value={formatCurrency(recognizedRevenue)} />
            <StatRow label="Management margin" value={formatCurrency(managementMargin)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">Project-to-Date</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="Remaining revenue" value={formatCurrency(remainingRevenue)} />
            <StatRow label="Remaining cost" value={formatCurrency(remainingCost)} />
            <StatRow label="Forecast margin %" value={formatPercent(forecastMarginPercent)} />
            <StatRow label="Opening recognized revenue" value={formatCurrency(openingRecognizedRevenue)} />
            <StatRow label="Current month revenue recognition" value={formatCurrency(currentMonthRevenue)} />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">Period Rollups</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="MTD actual cost" value={formatCurrency(mtdActual)} />
            <StatRow label="YTD actual cost" value={formatCurrency(ytdActual)} />
            <StatRow label="Open PM updates" value={String(updates.length)} />
            <StatRow label="Open risk alerts" value={String(risks.length)} />
            <StatRow label="Project status" value={project.status ?? 'Active'} />
          </div>
        </div>
      </div>

      {!revenueRows.length ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          No revenue rows were generated yet. Upload the Sales Order file first so the WBS revenue can be built from Net Value, then add CN41 planned cost and GR55 actual cost if available.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueSplitChart recognized={recognizedRevenue} remaining={Math.max(0, remainingRevenue)} total={plannedRevenue} />
            <PocChart data={revenueRows.map((row) => ({ name: row.wbs_code, value: row.poc_percent }))} />
            <RevenueVsSimulationChart data={revenueRows.map((row) => ({ name: row.wbs_code, sap: row.sap_earned_revenue ?? 0, simulated: row.recognized_revenue_to_date }))} />
            <CostComparisonChart data={revenueRows.map((row) => ({ name: row.wbs_code, sap: row.sap_actual_cost ?? 0, simulated: row.actual_cost_to_date }))} />
            <TopWbsChart data={revenueRows.slice().sort((a, b) => b.recognized_revenue_to_date - a.recognized_revenue_to_date).slice(0, 6).map((row) => ({ name: row.wbs_code, value: row.recognized_revenue_to_date }))} />
            {riskChartData.length ? <RiskChart data={riskChartData} /> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
            <h3 className="text-lg font-semibold text-text">WBS Financial Analysis</h3>
            <p className="text-sm text-muted">Filter the revenue-generating WBS rows for the active project.</p>
            <div className="mt-4">
              <DashboardWbsFilter rows={revenueRows} />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text">Project Details</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="Project Code" value={project.project_code} />
            <StatRow label="Client" value={project.client_name ?? '-'} />
            <StatRow label="Current Status" value={project.status ?? 'Active'} />
            <StatRow label="Daily PM Updates" value={String(updates.length)} />
          </div>
        </div>

        {latestPmUpdate ? (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text flex items-center gap-2">
              <Activity className="h-5 w-5 text-warning" />
              Pending for Posting
            </h3>
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.01] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">Total Pending Cost</div>
              <div className="mt-1 text-2xl font-bold text-text">{formatCurrency(getEffectivePendingCost(latestPmUpdate))}</div>
            </div>
            <div className="mt-4 space-y-1">
              <StatRow label="PM Expected Progress %" value={formatPercent(clampPercent(latestPmUpdate.expected_progress))} />
              <StatRow label="Material Cost" value={formatCurrency(latestPmUpdate.pending_material_cost)} />
              <StatRow label="Subcontractor Cost" value={formatCurrency(latestPmUpdate.pending_subcontractor_cost)} />
              <StatRow label="Manpower Cost" value={formatCurrency(latestPmUpdate.pending_manpower_cost)} />
            </div>
          </div>
        ) : null}

        <div className="glass rounded-2xl p-6 xl:col-span-2">
          <h3 className="text-lg font-semibold text-text flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-danger" />
            Top Risk Exposure
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {risks.slice(0, 4).map((risk, index) => (
              <div key={`${risk.wbs_code}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-text text-sm truncate">{risk.risk_type}</div>
                  <Badge tone={risk.severity === 'High' ? 'danger' : risk.severity === 'Medium' ? 'warning' : 'success'}>{risk.severity}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted font-medium">{risk.wbs_code}</div>
                <div className="mt-1 text-sm text-muted-foreground">{risk.risk_description}</div>
              </div>
            ))}
            {!risks.length ? <div className="sm:col-span-2 py-6 text-center text-sm text-muted">No open risks found.</div> : null}
          </div>
        </div>
      </div>

      <ProjectMasterAdminPanel
        projectId={projectId}
        projectName={project.project_name}
        revenueWbs={revenueRows}
        projectWbsMaster={projectWbsMaster}
        manpowerRates={manpowerRates}
        materialMasters={materialMasters}
      />
    </PageShell>
  );
}
