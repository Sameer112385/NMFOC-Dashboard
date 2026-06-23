"use client";

import { useState } from "react";
import { ProjectAdminDetailsForm } from "@/components/project-admin-details-form";
import { ProjectMasterAdminPanel } from "@/components/project-master-admin-panel";
import { ProjectCostElementControlPanel } from "@/components/project-cost-element-control-panel";
import { ProjectWbsMasterPanel } from "@/components/project-wbs-master-panel";
import { cn } from "@/lib/utils";
import type { Project, ProjectCostElementControl, ProjectManpowerRate, ProjectMaterialMaster, ProjectSubcontract, ProjectWbsMaster, RevenueWBS, UserProfile } from "@/lib/types";

type Props = {
  project: Project;
  revenueWbs: RevenueWBS[];
  manpowerRates: ProjectManpowerRate[];
  materialMasters: ProjectMaterialMaster[];
  projectSubcontracts: ProjectSubcontract[];
  projectWbsMaster: ProjectWbsMaster[];
  projectCostElements: ProjectCostElementControl[];
  projectManagers: UserProfile[];
  latestUpload: string | null;
};

const tabs = [
  { key: "summary", label: "Project Summary" },
  { key: "wbs-master", label: "WBS Master" },
  { key: "cost-elements", label: "Cost Element Control" },
  { key: "manpower", label: "Manpower Master" },
  { key: "material", label: "Material Master" },
  { key: "subcontracts", label: "Subcontractor Management" },
] as const;

export function ProjectAdminWorkspace({
  project,
  revenueWbs,
  manpowerRates,
  materialMasters,
  projectSubcontracts,
  projectWbsMaster,
  projectCostElements,
  projectManagers,
  latestUpload,
}: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("summary");

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-panel/90 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-accent/40 bg-accent/15 text-text"
                  : "border-line/70 bg-panel/40 text-muted hover:bg-panel2/80 hover:text-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "summary" ? (
        <ProjectAdminDetailsForm
          project={project}
          revenueWbsCount={revenueWbs.length}
          latestUpload={latestUpload}
          manpowerRatesCount={manpowerRates.length}
          materialMastersCount={materialMasters.length}
          projectSubcontracts={projectSubcontracts}
          projectManagers={projectManagers}
          section="summary"
        />
      ) : null}

      {activeTab === "manpower" ? (
        <ProjectMasterAdminPanel
          projectId={project.id}
          projectName={project.project_name}
          revenueWbs={revenueWbs}
          projectWbsMaster={projectWbsMaster}
          manpowerRates={manpowerRates}
          materialMasters={materialMasters}
          section="manpower"
        />
      ) : null}

      {activeTab === "wbs-master" ? (
        <ProjectWbsMasterPanel
          projectId={project.id}
          rows={projectWbsMaster}
        />
      ) : null}

      {activeTab === "cost-elements" ? (
        <ProjectCostElementControlPanel
          projectId={project.id}
          rows={projectCostElements}
        />
      ) : null}

      {activeTab === "material" ? (
        <ProjectMasterAdminPanel
          projectId={project.id}
          projectName={project.project_name}
          revenueWbs={revenueWbs}
          projectWbsMaster={projectWbsMaster}
          manpowerRates={manpowerRates}
          materialMasters={materialMasters}
          section="material"
        />
      ) : null}

      {activeTab === "subcontracts" ? (
        <ProjectAdminDetailsForm
          project={project}
          revenueWbsCount={revenueWbs.length}
          latestUpload={latestUpload}
          manpowerRatesCount={manpowerRates.length}
          materialMastersCount={materialMasters.length}
          projectSubcontracts={projectSubcontracts}
          projectManagers={projectManagers}
          section="subcontracts"
        />
      ) : null}
    </div>
  );
}
