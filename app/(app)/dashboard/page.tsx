import Link from 'next/link';
import { PageShell, EmptyState } from '@/components/ui';
import { getProjects } from '@/lib/data';
import { Briefcase, Building2, User, ArrowRight, FolderKanban } from 'lucide-react';

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
    <PageShell 
      title="Project Control Center" 
      subtitle="Select an active project below to access the Cost-to-Cost financial summary, period rollups, and risk analysis."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link 
            key={project.id} 
            href={`/dashboard/${project.id}`} 
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-accent/40 hover:bg-white/[0.06] hover:shadow-glow"
          >
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <FolderKanban className="h-3.5 w-3.5 text-accent" />
                {project.project_code}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                project.status === 'Active' 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-warning/10 text-warning border-warning/20'
              }`}>
                {project.status ?? 'Active'}
              </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-tight text-text transition-colors duration-200 group-hover:text-accent">
              {project.project_name}
            </h3>

            <div className="mt-6 space-y-2 border-t border-white/5 pt-4 text-sm text-muted">
              {project.client_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted/60" />
                  <span className="truncate">Client: <span className="font-medium text-text">{project.client_name}</span></span>
                </div>
              )}
              {project.project_manager_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted/60" />
                  <span className="truncate">PM: <span className="font-medium text-text">{project.project_manager_name}</span></span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-medium text-accent opacity-80 group-hover:opacity-100">
              <span>Enter Workspace</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
