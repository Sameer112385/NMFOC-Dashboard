"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { surfaceCard } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Download, Upload } from "lucide-react";
import type { Project, ProjectManpowerRate, ProjectMaterialMaster, ProjectWbsMaster, RevenueWBS } from "@/lib/types";

type Props = {
  projects?: Project[];
  revenueWbs: RevenueWBS[];
  projectWbsMaster?: ProjectWbsMaster[];
  manpowerRates: ProjectManpowerRate[];
  materialMasters: ProjectMaterialMaster[];
  projectId?: string;
  projectName?: string;
  section?: "full" | "manpower" | "material";
};

export function ProjectMasterAdminPanel({
  projects = [],
  revenueWbs,
  projectWbsMaster = [],
  manpowerRates,
  materialMasters,
  projectId: fixedProjectId,
  projectName,
  section = "full",
}: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(fixedProjectId ?? projects[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"summary" | "manpower" | "material">("summary");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<"" | "manpower" | "material">("");
  const [selectedManpowerFile, setSelectedManpowerFile] = useState<File | null>(null);
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);
  const manpowerFileRef = useRef<HTMLInputElement | null>(null);
  const materialFileRef = useRef<HTMLInputElement | null>(null);

  const [rateForm, setRateForm] = useState({
    revenue_wbs_code: "",
    work_center: "",
    cost_center: "",
    labor_category: "",
    hourly_rate: "",
  });

  const [materialForm, setMaterialForm] = useState({
    revenue_wbs_code: "",
    material_code: "",
    material_description: "",
    unit_of_measure: "",
    planned_quantity: "",
    unit_price: "",
  });

  const projectCostWbs = useMemo(
    () =>
      projectWbsMaster
        .filter((item) => item.project_id === projectId && item.is_active !== false && item.include_in_cost)
        .map((item) => ({
          project_id: item.project_id,
          wbs_code: item.wbs_code,
          wbs_description: item.wbs_description,
        }))
        .sort((a, b) => a.wbs_code.localeCompare(b.wbs_code)),
    [projectId, projectWbsMaster],
  );
  const projectWbs = useMemo(
    () => revenueWbs.filter((item) => item.project_id === projectId).sort((a, b) => a.wbs_code.localeCompare(b.wbs_code)),
    [projectId, revenueWbs],
  );
  const materialWbsOptions = projectCostWbs.length ? projectCostWbs : projectWbs;
  const projectRates = useMemo(
    () => manpowerRates.filter((item) => item.project_id === projectId),
    [projectId, manpowerRates],
  );
  const projectMaterials = useMemo(
    () =>
      materialMasters
        .filter((item) => item.project_id === projectId)
        .sort((a, b) => a.revenue_wbs_code.localeCompare(b.revenue_wbs_code) || a.material_code.localeCompare(b.material_code)),
    [projectId, materialMasters],
  );
  const showProjectSelector = !fixedProjectId;
  const resolvedTab = section === "full" ? activeTab : section;

  useEffect(() => {
    if (fixedProjectId) {
      setProjectId(fixedProjectId);
    }
  }, [fixedProjectId]);


  useEffect(() => {
    setMaterialForm((current) => ({
      ...current,
      revenue_wbs_code:
        materialWbsOptions.some((item) => item.wbs_code === current.revenue_wbs_code) ? current.revenue_wbs_code : materialWbsOptions[0]?.wbs_code ?? "",
    }));
  }, [materialWbsOptions]);

  async function saveRate() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/project-masters/manpower", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        revenue_wbs_code: "",
        work_center: rateForm.work_center,
        cost_center: rateForm.cost_center,
        labor_category: rateForm.labor_category,
        hourly_rate: Number(rateForm.hourly_rate || 0),
      }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save manpower rate.");
      return;
    }
    setRateForm({
      revenue_wbs_code: "",
      work_center: "",
      cost_center: "",
      labor_category: "",
      hourly_rate: "",
    });
    setMessage("Manpower rate master saved.");
    router.refresh();
  }

  async function saveMaterial() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/project-masters/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        revenue_wbs_code: materialForm.revenue_wbs_code,
        material_code: materialForm.material_code,
        material_description: materialForm.material_description,
        unit_of_measure: materialForm.unit_of_measure,
        planned_quantity: Number(materialForm.planned_quantity || 0),
        unit_price: Number(materialForm.unit_price || 0),
      }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save material master.");
      return;
    }
    setMaterialForm((current) => ({
      revenue_wbs_code: current.revenue_wbs_code,
      material_code: "",
      material_description: "",
      unit_of_measure: "",
      planned_quantity: "",
      unit_price: "",
    }));
    setMessage("Project material master saved.");
    router.refresh();
  }

  async function deleteRate(id?: string) {
    if (!id) return;
    setSaving(true);
    const response = await fetch("/api/project-masters/manpower", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to delete manpower rate.");
      return;
    }
    setMessage("Manpower rate master deleted.");
    router.refresh();
  }

  async function deleteMaterial(id?: string) {
    if (!id) return;
    setSaving(true);
    const response = await fetch("/api/project-masters/materials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to delete material master.");
      return;
    }
    setMessage("Project material master deleted.");
    router.refresh();
  }

  async function uploadBulk(type: "manpower" | "material", file?: File | null) {
    if (!projectId || !file) return;
    setUploadingType(type);
    setMessage("");
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("type", type);
    formData.set("file", file);

    const response = await fetch("/api/project-masters/bulk", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setUploadingType("");

    if (!response.ok) {
      setMessage(payload.error ?? `Unable to upload ${type} template.`);
      return;
    }

    if (type === "manpower") {
      if (manpowerFileRef.current) manpowerFileRef.current.value = "";
      setSelectedManpowerFile(null);
    }
    if (type === "material") {
      if (materialFileRef.current) materialFileRef.current.value = "";
      setSelectedMaterialFile(null);
    }
    setMessage(`${payload.imported ?? 0} ${type} rows imported successfully.`);
    router.refresh();
  }

  return (
    <div className={`space-y-4 p-5 ${surfaceCard}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text">Project Cost Masters</h3>
          <p className="mt-1 text-sm text-muted">
            Maintain project manpower rates and planned material master here. PM daily updates will calculate from these masters automatically.
          </p>
        </div>
        {showProjectSelector ? (
          <div className="min-w-[260px]">
            <div className="mb-2 text-sm text-muted">Project</div>
            <DarkSelect
              value={projectId}
              onChange={setProjectId}
              options={projects.map((project) => ({ value: project.id, label: `${project.project_name} (${project.project_code})` }))}
              placeholder="Select project"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">Project</div>
            <div className="mt-1 text-sm font-medium text-text">{projectName ?? "Selected project"}</div>
          </div>
        )}
      </div>

      {section === "full" ? (
        <div className="flex flex-wrap gap-2">
          {[
            { key: "summary", label: "Project Summary" },
            { key: "manpower", label: "Manpower Master" },
            { key: "material", label: "Project Material Master" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={
                activeTab === tab.key
                  ? "rounded-xl border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-medium text-text"
                  : "rounded-xl border border-line/70 bg-panel/40 px-4 py-2 text-sm font-medium text-muted hover:bg-panel2/80 hover:text-text"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {resolvedTab === "summary" ? (
        <div className={`space-y-4 p-4 ${surfaceCard}`}>
          <div>
            <div className="text-sm font-semibold text-text">Project Summary</div>
            <div className="mt-1 text-xs text-muted">
              Quick view of project-linked master readiness for this selected project.
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <SummaryStat label="Cost WBS Count" value={String(materialWbsOptions.length)} />
            <SummaryStat label="Manpower Rate Records" value={String(projectRates.length)} />
            <SummaryStat label="Material Master Records" value={String(projectMaterials.length)} />
            <SummaryStat
              label="Project"
              value={projectName ?? projects.find((project) => project.id === projectId)?.project_name ?? "Selected project"}
            />
            <SummaryStat
              label="Latest WBS"
              value={materialWbsOptions[0] ? `${materialWbsOptions[0].wbs_code}` : "No cost WBS found"}
            />
            <SummaryStat
              label="Masters Status"
              value={projectRates.length || projectMaterials.length ? "Configured" : "Pending setup"}
            />
          </div>
        </div>
      ) : null}

      {resolvedTab === "manpower" ? (
        <div className={`space-y-4 p-4 ${surfaceCard}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-text">Manpower Rate Master</div>
              <div className="mt-1 text-xs text-muted">Maintain project labor categories, work center/cost center, and hourly rates.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={projectId ? `/api/project-masters/template?type=manpower&projectId=${projectId}` : "#"}
                className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-3 py-2 text-xs font-medium text-text hover:bg-panel2/80"
              >
                <Download className="h-3.5 w-3.5" />
                Download template
              </a>
              <input
                ref={manpowerFileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setSelectedManpowerFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => manpowerFileRef.current?.click()}
                disabled={!projectId}
                className={secondaryButtonClass}
              >
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Choose file
                </span>
              </button>
              <button
                type="button"
                onClick={() => uploadBulk("manpower", selectedManpowerFile)}
                disabled={!projectId || !selectedManpowerFile || uploadingType === "manpower"}
                className={secondaryButtonClass}
              >
                {uploadingType === "manpower" ? "Uploading..." : "Upload file"}
              </button>
            </div>
          </div>
          <div className="text-xs text-muted">
            {selectedManpowerFile ? `Selected file: ${selectedManpowerFile.name}` : "No file selected for manpower bulk upload."}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={rateForm.work_center} onChange={(e) => setRateForm((c) => ({ ...c, work_center: e.target.value }))} placeholder="Work center" className={inputClass} />
            <input value={rateForm.cost_center} onChange={(e) => setRateForm((c) => ({ ...c, cost_center: e.target.value }))} placeholder="Cost center" className={inputClass} />
            <input value={rateForm.labor_category} onChange={(e) => setRateForm((c) => ({ ...c, labor_category: e.target.value }))} placeholder="Labor category" className={inputClass} />
            <input value={rateForm.hourly_rate} onChange={(e) => setRateForm((c) => ({ ...c, hourly_rate: e.target.value }))} placeholder="Hourly rate" type="number" step="0.01" className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" disabled={saving || !projectId || !rateForm.labor_category || !rateForm.hourly_rate} onClick={saveRate} className={primaryButtonClass}>Save manpower rate</button>
          </div>
          <div className="space-y-2">
            {projectRates.length ? projectRates.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-panel/40 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text">{rate.labor_category}</div>
                  <div className="text-xs text-muted">
                    {[rate.work_center, rate.cost_center].filter(Boolean).join(" | ") || "No work / cost center linked"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-text">{formatCurrency(rate.hourly_rate)}</div>
                  <button type="button" onClick={() => deleteRate(rate.id)} className={dangerButtonClass}>Delete</button>
                </div>
              </div>
            )) : <div className="text-sm text-muted">No manpower rates maintained for this project yet.</div>}
          </div>
        </div>
      ) : null}

      {resolvedTab === "material" ? (
        <div className={`space-y-4 p-4 ${surfaceCard}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-text">Project Material Master</div>
              <div className="mt-1 text-xs text-muted">Maintain planned materials by revenue WBS, including planned quantity and unit price.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={projectId ? `/api/project-masters/template?type=material&projectId=${projectId}` : "#"}
                className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-3 py-2 text-xs font-medium text-text hover:bg-panel2/80"
              >
                <Download className="h-3.5 w-3.5" />
                Download template
              </a>
              <input
                ref={materialFileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setSelectedMaterialFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => materialFileRef.current?.click()}
                disabled={!projectId}
                className={secondaryButtonClass}
              >
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Choose file
                </span>
              </button>
              <button
                type="button"
                onClick={() => uploadBulk("material", selectedMaterialFile)}
                disabled={!projectId || !selectedMaterialFile || uploadingType === "material"}
                className={secondaryButtonClass}
              >
                {uploadingType === "material" ? "Uploading..." : "Upload file"}
              </button>
            </div>
          </div>
          <div className="text-xs text-muted">
            {selectedMaterialFile ? `Selected file: ${selectedMaterialFile.name}` : "No file selected for material bulk upload."}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DarkSelect
              value={materialForm.revenue_wbs_code}
              onChange={(value) => setMaterialForm((c) => ({ ...c, revenue_wbs_code: value }))}
              options={materialWbsOptions.map((row) => ({ value: row.wbs_code, label: `${row.wbs_code} - ${row.wbs_description}` }))}
              placeholder="Select revenue WBS"
            />
            <input value={materialForm.material_code} onChange={(e) => setMaterialForm((c) => ({ ...c, material_code: e.target.value }))} placeholder="Material code" className={inputClass} />
            <input value={materialForm.material_description} onChange={(e) => setMaterialForm((c) => ({ ...c, material_description: e.target.value }))} placeholder="Material description" className={inputClass} />
            <input value={materialForm.unit_of_measure} onChange={(e) => setMaterialForm((c) => ({ ...c, unit_of_measure: e.target.value }))} placeholder="Unit of measure" className={inputClass} />
            <input value={materialForm.planned_quantity} onChange={(e) => setMaterialForm((c) => ({ ...c, planned_quantity: e.target.value }))} placeholder="Planned quantity" type="number" step="0.01" className={inputClass} />
            <input value={materialForm.unit_price} onChange={(e) => setMaterialForm((c) => ({ ...c, unit_price: e.target.value }))} placeholder="Unit price" type="number" step="0.01" className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" disabled={saving || !projectId || !materialForm.revenue_wbs_code} onClick={saveMaterial} className={primaryButtonClass}>Save material</button>
          </div>
          <div className="space-y-2">
            {projectMaterials.length ? projectMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-panel/40 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text">{material.material_code} - {material.material_description}</div>
                  <div className="text-xs text-muted">
                    {material.revenue_wbs_code} | {material.unit_of_measure || "-"} | Planned Qty {formatNumber(material.planned_quantity)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-text">{formatCurrency(material.unit_price)}</div>
                  <button type="button" onClick={() => deleteMaterial(material.id)} className={dangerButtonClass}>Delete</button>
                </div>
              </div>
            )) : <div className="text-sm text-muted">No project material master maintained for this project yet.</div>}
          </div>
        </div>
      ) : null}

      {message ? <div className="text-sm text-muted">{message}</div> : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-panel/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold text-text">{value}</div>
    </div>
  );
}

const inputClass = "rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text";
const primaryButtonClass = "rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60";
const secondaryButtonClass = "rounded-xl border border-line/70 px-3 py-2 text-xs font-medium text-text hover:bg-panel2/80 disabled:opacity-60";
const dangerButtonClass = "rounded-xl border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10";
