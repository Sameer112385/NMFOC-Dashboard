import { ProjectCreateForm } from '@/components/project-create-form';
import { EmptyState, PageShell } from '@/components/ui';
import { getLatestUploadDate, getProjects, getRevenueGeneratingRows, getRevenueRows } from '@/lib/data';
import { getCurrentAppUser } from '@/lib/current-user';
import { ProjectTable } from '@/components/project-table';
import { isLocalDbMode } from '@/lib/local-db';
import { clampPercent } from '@/lib/utils';

export default async function ProjectsPage() {
  const projects = await getProjects();
  const localMode = await isLocalDbMode();
  const currentUser = await getCurrentAppUser();
  const canDeleteProject = currentUser?.role === 'Admin';
  const visibleProjects =
    currentUser?.role === 'Project Manager'
      ? projects.filter((project) =>
          project.project_manager_user_id === currentUser.id || project.project_manager_email === currentUser.email,
        )
      : projects;

  const rows = await Promise.all(
    visibleProjects.map(async (project) => {
      const [revenueRows, costRows, latestUpload] = await Promise.all([
        getRevenueGeneratingRows(project.id),
        getRevenueRows(project.id),
        getLatestUploadDate(project.id),
      ]);
      const plannedRevenue = revenueRows.reduce((sum, row) => sum + row.planned_revenue, 0);
      const costPlanned = costRows.reduce((sum, row) => sum + row.planned_cost, 0);
      const costActual = costRows.reduce((sum, row) => sum + row.actual_cost_to_date, 0);
      const recognizedRevenueToDate = revenueRows.reduce((sum, row) => sum + row.recognized_revenue_to_date, 0);
      const forecastCost = costRows.reduce((sum, row) => sum + row.forecast_cost, 0) || costActual;
      const forecastMargin = plannedRevenue - forecastCost;
      const forecastMarginPercent = plannedRevenue > 0 ? (forecastMargin / plannedRevenue) * 100 : 0;
      const pocPercent = clampPercent(costPlanned > 0 ? (costActual / costPlanned) * 100 : 0);
      const riskStatus: 'Warning' | 'Safe' = forecastMargin < 0 ? 'Warning' : 'Safe';

      return {
        ...project,
        latestUpload,
        plannedCost: costPlanned,
        actualCostToDate: costActual,
        plannedRevenue,
        recognizedRevenueToDate,
        remainingRevenue: revenueRows.reduce((sum, row) => sum + row.remaining_revenue, 0),
        remainingCost: costPlanned - costActual,
        pocPercent,
        forecastMargin,
        forecastMarginPercent,
        mtdRevenueRecognition: revenueRows.reduce((sum, row) => sum + row.mtd_revenue_recognition, 0),
        ytdRevenueRecognition: revenueRows.reduce((sum, row) => sum + row.ytd_revenue_recognition, 0),
        riskStatus,
      };
    }),
  );

  return (
    <PageShell
      title="Projects"
      subtitle="All projects with the latest financial source refresh, Cost-to-Cost revenue summary, and margin status."
    >
      <ProjectCreateForm />
      {rows.length ? (
        <ProjectTable rows={rows} canDeleteProject={canDeleteProject} demoMode={localMode} />
      ) : (
        <EmptyState
          title="No projects yet"
          description="Create your first project above, then upload CN41, GR55, or Sales Order data against that project to populate the dashboard."
        />
      )}
    </PageShell>
  );
}
