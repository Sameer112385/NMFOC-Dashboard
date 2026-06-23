import { PageShell, Card, StatRow } from '@/components/ui';
import { getDailyUpdates, getRevenueRows } from '@/lib/data';
import { buildRiskAlerts } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';

export default async function ReportsPage() {
  const revenueRows = await getRevenueRows();
  const updates = await getDailyUpdates();
  const risks = buildRiskAlerts(revenueRows);

  const actualCost = revenueRows.reduce((sum, row) => sum + row.actual_cost_to_date, 0);
  const plannedCost = revenueRows.reduce((sum, row) => sum + row.planned_cost, 0);
  const plannedRevenue = revenueRows.reduce((sum, row) => sum + row.planned_revenue, 0);
  const recognizedRevenue = revenueRows.reduce((sum, row) => sum + row.recognized_revenue_to_date, 0);
  const mtdRevenue = revenueRows.reduce((sum, row) => sum + row.mtd_revenue_recognition, 0);
  const ytdRevenue = revenueRows.reduce((sum, row) => sum + row.ytd_revenue_recognition, 0);

  return (
    <PageShell title="PDF Reports" subtitle="Generate a project summary report with Cost-to-Cost KPIs, PM updates, forecast, and risk actions.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Project Summary" value={`${revenueRows.length} WBS`} />
        <Card title="Actual Cost to Date" value={formatCurrency(actualCost)} />
        <Card title="Planned Cost" value={formatCurrency(plannedCost)} tone="warning" />
        <Card title="Recognized Revenue" value={formatCurrency(recognizedRevenue)} tone="accent" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">Recommended Actions</h3>
          <div className="mt-4 space-y-1">
            <StatRow label="Review high-risk WBS" value={String(risks.length)} />
            <StatRow label="Review PM reference entries" value={String(updates.length)} />
            <StatRow label="Check revenue variance" value={formatCurrency(plannedRevenue - recognizedRevenue)} />
            <StatRow label="MTD revenue recognition" value={formatCurrency(mtdRevenue)} />
            <StatRow label="YTD revenue recognition" value={formatCurrency(ytdRevenue)} />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text">Export Actions</h3>
          <p className="mt-2 text-sm text-muted">
            Wire `jsPDF` or `react-pdf` here to generate a PDF pack containing the project summary, Cost-to-Cost metrics, PM updates, variance, and risks.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg">Generate PDF</button>
            <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-text">Export data</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
