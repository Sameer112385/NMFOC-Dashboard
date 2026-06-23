"use client";

import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { ProjectCostElementControlPanel } from "@/components/project-cost-element-control-panel";
import { surfaceCard } from "@/components/ui";
import type { Project, ProjectCostElementControl } from "@/lib/types";

type Props = {
  projects: Project[];
  selectedProjectId: string;
  costElements: ProjectCostElementControl[];
};

export function CostElementsPageClient({ projects, selectedProjectId, costElements }: Props) {
  const router = useRouter();
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="space-y-4">
      <div className={`p-5 ${surfaceCard}`}>
        <div className="max-w-xl">
          <div className="mb-2 text-sm font-medium text-muted">Project</div>
          <DarkSelect
            value={selectedProjectId}
            onChange={(value) => router.push(`/cost-elements?projectId=${value}`)}
            options={projects.map((project) => ({ value: project.id, label: `${project.project_name} (${project.project_code})` }))}
            placeholder="Select project"
          />
        </div>
        {selectedProject ? (
          <div className="mt-4 rounded-xl border border-line/70 bg-panel/40 px-4 py-3 text-sm text-muted">
            Rules saved here apply only to <span className="font-semibold text-text">{selectedProject.project_name}</span>.
          </div>
        ) : null}
      </div>

      {selectedProjectId ? (
        <ProjectCostElementControlPanel projectId={selectedProjectId} rows={costElements} />
      ) : (
        <div className={`p-8 text-sm text-muted ${surfaceCard}`}>Create or select a project first.</div>
      )}
    </div>
  );
}
