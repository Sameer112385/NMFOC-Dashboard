import { notFound } from 'next/navigation';
import { PageShell } from '@/components/ui';
import { ProjectAdminWorkspace } from '@/components/project-admin-workspace';
import {
  getLatestUploadDate,
  getProjectById,
  getProjectManagerUsers,
  getProjectCostElementControl,
  getProjectManpowerRates,
  getProjectMaterialMaster,
  getProjectSubcontracts,
  getProjectWbsMaster,
  getRevenueRows,
} from '@/lib/data';
import { getCurrentAppUser } from '@/lib/current-user';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  const currentUser = await getCurrentAppUser();

  if (!project) return notFound();
  if (
    currentUser?.role === 'Project Manager' &&
    project.project_manager_user_id !== currentUser.id &&
    project.project_manager_email !== currentUser.email
  ) {
    return notFound();
  }

  const [revenueWbs, manpowerRates, materialMasters, projectSubcontracts, latestUpload, projectWbsMaster, projectCostElements, projectManagers] = await Promise.all([
    getRevenueRows(projectId),
    getProjectManpowerRates(projectId),
    getProjectMaterialMaster(projectId),
    getProjectSubcontracts(projectId),
    getLatestUploadDate(projectId),
    getProjectWbsMaster(projectId),
    getProjectCostElementControl(projectId),
    getProjectManagerUsers(),
  ]);

  return (
    <PageShell
      title={project.project_name}
      subtitle="Maintain project setup, revenue WBS-linked material master, and manpower rate master here."
    >
      <ProjectAdminWorkspace
        project={project}
        revenueWbs={revenueWbs}
        manpowerRates={manpowerRates}
        materialMasters={materialMasters}
        projectSubcontracts={projectSubcontracts}
        projectWbsMaster={projectWbsMaster}
        projectCostElements={projectCostElements}
        projectManagers={projectManagers}
        latestUpload={latestUpload}
      />
    </PageShell>
  );
}
