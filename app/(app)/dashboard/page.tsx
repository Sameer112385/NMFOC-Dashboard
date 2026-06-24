import Link from 'next/link';
import { PageShell, EmptyState } from '@/components/ui';
import { getProjects } from '@/lib/data';
import { ArrowRight, Building2, FolderKanban, User } from 'lucide-react';

export default async function DashboardIndexPage() {
  const projects = await getProjects();

  if (!projects.length) {
    return (
      <PageShell title="Project Control Center" subtitle="Choose a project to inspect the financial summary dashboard.">
        <EmptyState title="No projects yet" description="Create a project first, then upload CN41, GR55, or Sales Order data to activate the dashboard." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Project Control Center" subtitle="Select an active project below to access financial summary, period rollups, WBS exposure, and risk insight.">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/dashboard/${project.id}`} className="group surface-card relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1 hover:border-accent/35">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel2/75 px-3 py-1 text-xs font-semibold text-muted">
                <FolderKanban className="h-3.5 w-3.5 text-accent" />
                {project.project_code}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${project.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {project.status ?? 'Active'}
              </span>
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-tight text-text transition-colors group-hover:text-accent">{project.project_name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Executive-level cost and revenue monitoring workspace for this delivery scope.</p>

            <div className="mt-6 space-y-3 border-t border-line/60 pt-4 text-sm text-muted">
              {project.client_name ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted/70" />
                  <span className="truncate">Client: <span className="font-medium text-text">{project.client_name}</span></span>
                </div>
              ) : null}
              {project.project_manager_name ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted/70" />
                  <span className="truncate">PM: <span className="font-medium text-text">{project.project_manager_name}</span></span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm font-medium text-accent">
              <span>Open executive dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
