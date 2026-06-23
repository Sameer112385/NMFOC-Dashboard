"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { surfaceCard, StatRow } from "@/components/ui";
import type { Project, ProjectSubcontract, UserProfile } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type EditableSubcontractRow = {
  id: string;
  package_name: string;
  subcontractor_name: string;
  po_number: string;
  po_amount: string;
  scope: string;
  status: string;
};

export function ProjectAdminDetailsForm({
  project,
  revenueWbsCount,
  latestUpload,
  manpowerRatesCount,
  materialMastersCount,
  projectSubcontracts,
  projectManagers,
  section = "summary",
}: {
  project: Project;
  revenueWbsCount: number;
  latestUpload: string | null;
  manpowerRatesCount: number;
  materialMastersCount: number;
  projectSubcontracts: ProjectSubcontract[];
  projectManagers: UserProfile[];
  section?: "summary" | "subcontracts";
}) {
  const router = useRouter();
  const resolveManager = (managerId: string) =>
    projectManagers.find((manager) => manager.user_id === managerId || manager.id === managerId) ?? null;
  const initialManager = resolveManager(project.project_manager_user_id ?? "") ?? projectManagers.find((manager) => manager.full_name === project.project_manager_name || manager.email === project.project_manager_email) ?? null;
  const [showEditor, setShowEditor] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [form, setForm] = useState({
    project_code: project.project_code ?? "",
    project_name: project.project_name ?? "",
    client_name: project.client_name ?? "",
    project_manager_user_id: initialManager?.user_id ?? project.project_manager_user_id ?? "",
    project_manager_name: project.project_manager_name ?? "",
    project_manager_email: project.project_manager_email ?? "",
    project_manager_phone: project.project_manager_phone ?? "",
    site_location: project.site_location ?? "",
    status: project.status ?? "Active",
  });
  const [subcontractRows, setSubcontractRows] = useState<EditableSubcontractRow[]>(
    projectSubcontracts.length
      ? projectSubcontracts.map((row) => ({
          id: row.id ?? crypto.randomUUID(),
          package_name: row.package_name ?? "",
          subcontractor_name: row.subcontractor_name ?? "",
          po_number: row.po_number ?? "",
          po_amount: row.po_amount?.toString() ?? "",
          scope: row.scope ?? "",
          status: row.status ?? "Active",
        }))
      : [createEmptySubcontractRow()],
  );

  useEffect(() => {
    const manager =
      resolveManager(project.project_manager_user_id ?? "") ??
      projectManagers.find((item) => item.full_name === project.project_manager_name || item.email === project.project_manager_email) ??
      null;

    setForm({
      project_code: project.project_code ?? "",
      project_name: project.project_name ?? "",
      client_name: project.client_name ?? "",
      project_manager_user_id: manager?.user_id ?? project.project_manager_user_id ?? "",
      project_manager_name: project.project_manager_name ?? manager?.full_name ?? "",
      project_manager_email: project.project_manager_email ?? manager?.email ?? "",
      project_manager_phone: project.project_manager_phone ?? manager?.phone ?? "",
      site_location: project.site_location ?? "",
      status: project.status ?? "Active",
    });
  }, [
    project,
    projectManagers,
  ]);

  useEffect(() => {
    setSubcontractRows(
      projectSubcontracts.length
        ? projectSubcontracts.map((row) => ({
            id: row.id ?? crypto.randomUUID(),
            package_name: row.package_name ?? "",
            subcontractor_name: row.subcontractor_name ?? "",
            po_number: row.po_number ?? "",
            po_amount: row.po_amount?.toString() ?? "",
            scope: row.scope ?? "",
            status: row.status ?? "Active",
          }))
        : [createEmptySubcontractRow()],
    );
  }, [projectSubcontracts]);

  const subcontractSummary = useMemo(() => {
    const activeRows = projectSubcontracts.filter((row) => (row.status ?? "Active") !== "Closed");
    const totalPoAmount = projectSubcontracts.reduce((sum, row) => sum + Number(row.po_amount ?? 0), 0);
    const packageNames = projectSubcontracts.map((row) => row.package_name).filter(Boolean);

    return {
      activeCount: activeRows.length,
      totalPoAmount,
      packageNames: packageNames.length ? packageNames.join(", ") : "-",
    };
  }, [projectSubcontracts]);

  async function saveProjectDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const projectResponse = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_code: form.project_code,
        project_name: form.project_name,
        client_name: form.client_name,
        project_manager_user_id: form.project_manager_user_id,
        project_manager_name: form.project_manager_name,
        project_manager_email: form.project_manager_email,
        project_manager_phone: form.project_manager_phone,
        site_location: form.site_location,
        status: form.status,
      }),
    });

    const projectPayload = await projectResponse.json().catch(() => ({}));
    if (!projectResponse.ok) {
      setSaving(false);
      setMessage(projectPayload.error ?? "Unable to update project details.");
      return;
    }

    setSaving(false);
    setMessage("Project details updated.");
    router.refresh();
  }

  async function saveSubcontracts(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const subcontractResponse = await fetch("/api/project-subcontracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        rows: subcontractRows.map((row) => ({
          package_name: row.package_name,
          subcontractor_name: row.subcontractor_name,
          po_number: row.po_number,
          po_amount: row.po_amount,
          scope: row.scope,
          status: row.status,
        })),
      }),
    });

    const subcontractPayload = await subcontractResponse.json().catch(() => ({}));
    setSaving(false);

    if (!subcontractResponse.ok) {
      setMessage(subcontractPayload.error ?? "Unable to save project subcontracts.");
      return;
    }

    setMessage("Project subcontract packages updated.");
    router.refresh();
  }

  async function recalculateFinancials() {
    setRecalculating(true);
    setMessage("Recalculating financials from latest source data...");
    const response = await fetch("/api/financial-sources/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: project.id }),
    });
    const payload = await response.json().catch(() => ({}));
    setRecalculating(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to recalculate financial data.");
      return;
    }

    setMessage("Financials recalculated. " + (payload.rowCount ?? 0) + " WBS row(s) updated.");
    router.refresh();
  }

  function updateSubcontractRow(id: string, key: keyof EditableSubcontractRow, value: string) {
    setSubcontractRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  function addSubcontractRow() {
    setSubcontractRows((current) => [...current, createEmptySubcontractRow()]);
  }

  function removeSubcontractRow(id: string) {
    setSubcontractRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : [createEmptySubcontractRow()]));
  }

  function applySelectedManager(managerId: string) {
    const manager = resolveManager(managerId);
    setForm((current) => ({
      ...current,
      project_manager_user_id: manager?.user_id ?? "",
      project_manager_name: manager?.full_name ?? "",
      project_manager_email: manager?.email ?? "",
      project_manager_phone: manager?.phone ?? "",
    }));
  }

  return (
    <div className="space-y-4">
      {section === "summary" ? (
        <>
          <section className={`space-y-4 p-5 ${surfaceCard}`}>
            <div>
              <h3 className="text-lg font-semibold text-text">Project Summary</h3>
              <p className="mt-1 text-sm text-muted">
                Project overview, ownership, subcontract package readiness, and master-data readiness.
              </p>
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <SummaryField label="Project Name" value={form.project_name || "-"} />
                <SummaryField label="Project Code" value={form.project_code || "-"} />
                <SummaryField label="Revenue WBS Count" value={String(revenueWbsCount)} />
                <SummaryField label="Latest CN41 Upload" value={latestUpload ? new Date(latestUpload).toLocaleDateString() : "-"} />
                <SummaryField label="Status" value={form.status || "Active"} />
                <SummaryField label="Project Manager" value={form.project_manager_name || "-"} />
                <SummaryField label="Subcontract Packages" value={String(projectSubcontracts.length)} />
                <SummaryField label="Active Packages" value={String(subcontractSummary.activeCount)} />
                <SummaryField label="Total Subcontract PO" value={projectSubcontracts.length ? formatCurrency(subcontractSummary.totalPoAmount) : "-"} />
                <SummaryField label="Master Records" value={`${manpowerRatesCount} MP | ${materialMastersCount} Mat`} />
              </div>
            </section>

            <div className="grid gap-2">
              <StatRow label="Client" value={form.client_name || "-"} />
              <StatRow label="PM Email" value={form.project_manager_email || "-"} />
              <StatRow label="PM Phone" value={form.project_manager_phone || "-"} />
              <StatRow label="Site Location" value={form.site_location || "-"} />
              <StatRow label="Project Subcontract Packages" value={subcontractSummary.packageNames} />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={recalculateFinancials}
                disabled={recalculating}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
              >
                {recalculating ? "Recalculating..." : "Recalculate Financials"}
              </button>
              <button
                type="button"
                onClick={() => setShowEditor((current) => !current)}
                className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-4 py-2 text-sm font-medium text-text hover:bg-panel2/80"
              >
                {showEditor ? "Hide edit section" : "Edit project details"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", showEditor && "rotate-180")} />
              </button>
            </div>
          </section>

          {showEditor ? (
            <form onSubmit={saveProjectDetails} className={`space-y-4 p-5 ${surfaceCard}`}>
              <div>
                <h3 className="text-lg font-semibold text-text">Admin Project Details</h3>
                <p className="mt-1 text-sm text-muted">
                  Maintain the project header and PM ownership here. Subcontract package management is kept in its own tab to reduce page length and make administration cleaner.
                </p>
              </div>

              <section className="space-y-3">
                <div className="text-sm font-medium text-text">Project Header</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <input className={inputClass} placeholder="Project code" value={form.project_code} onChange={(e) => setForm((c) => ({ ...c, project_code: e.target.value }))} />
                  <input className={inputClass} placeholder="Project name" value={form.project_name} onChange={(e) => setForm((c) => ({ ...c, project_name: e.target.value }))} />
                  <input className={inputClass} placeholder="Client name" value={form.client_name} onChange={(e) => setForm((c) => ({ ...c, client_name: e.target.value }))} />
                  <input className={inputClass} placeholder="Site location" value={form.site_location} onChange={(e) => setForm((c) => ({ ...c, site_location: e.target.value }))} />
                </div>
                <div className="max-w-sm">
                  <select className={inputClass} value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-text">Project Management</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    className={inputClass}
                    value={form.project_manager_user_id}
                    onChange={(e) => applySelectedManager(e.target.value)}
                  >
                    <option value="">Select project manager</option>
                    {projectManagers.map((manager) => (
                      <option key={manager.user_id} value={manager.user_id}>
                        {manager.full_name || manager.email}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Project manager email"
                    value={form.project_manager_email}
                    readOnly
                  />
                  <input
                    className={inputClass}
                    placeholder="Project manager phone"
                    value={form.project_manager_phone}
                    readOnly
                  />
                </div>
                <div className="text-xs text-muted">
                  Select a PM from the user database. Name, email, and phone are filled automatically from that user profile.
                </div>
              </section>

              <div className="flex items-center gap-3">
                <button disabled={saving} className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60">
                  {saving ? "Saving..." : "Save project details"}
                </button>
                {message ? <span className="text-sm text-muted">{message}</span> : null}
              </div>
            </form>
          ) : null}
        </>
      ) : null}

      {section === "subcontracts" ? (
        <form onSubmit={saveSubcontracts} className={`space-y-4 p-5 ${surfaceCard}`}>
          <div>
            <h3 className="text-lg font-semibold text-text">Subcontractor Management</h3>
            <p className="mt-1 text-sm text-muted">
              Maintain whole-project subcontract packages here. Keep each commercial package such as Civil, Fiber, Asphalt, or any other package as a separate line for cleaner PM selection later.
            </p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-text">Project Subcontracts</div>
                <div className="mt-1 text-xs text-muted">
                  Add whole-project subcontract packages such as Civil, Fiber, Asphalt, or any other commercial package.
                </div>
              </div>
              <button
                type="button"
                onClick={addSubcontractRow}
                className="inline-flex items-center gap-2 rounded-xl border border-line/70 px-3 py-2 text-sm font-medium text-text hover:bg-panel2/80"
              >
                <Plus className="h-4 w-4" />
                Add package
              </button>
            </div>

            <div className="space-y-3">
              {subcontractRows.map((row, index) => (
                <div key={row.id} className="rounded-2xl border border-line/70 bg-panel/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-text">Package {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeSubcontractRow(row.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input className={inputClass} placeholder="Package name (Civil / Fiber / Asphalt)" value={row.package_name} onChange={(e) => updateSubcontractRow(row.id, "package_name", e.target.value)} />
                    <input className={inputClass} placeholder="Subcontractor name" value={row.subcontractor_name} onChange={(e) => updateSubcontractRow(row.id, "subcontractor_name", e.target.value)} />
                    <input className={inputClass} placeholder="PO number" value={row.po_number} onChange={(e) => updateSubcontractRow(row.id, "po_number", e.target.value)} />
                    <input className={inputClass} type="number" step="0.01" placeholder="PO amount" value={row.po_amount} onChange={(e) => updateSubcontractRow(row.id, "po_amount", e.target.value)} />
                    <select className={inputClass} value={row.status} onChange={(e) => updateSubcontractRow(row.id, "status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <textarea
                    className="mt-3 min-h-24 rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text"
                    placeholder="Scope / remarks for this subcontract package"
                    value={row.scope}
                    onChange={(e) => updateSubcontractRow(row.id, "scope", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button disabled={saving} className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60">
              {saving ? "Saving..." : "Save project subcontracts"}
            </button>
            {message ? <span className="text-sm text-muted">{message}</span> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}

const inputClass = "rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text";

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium text-text">{value}</div>
    </div>
  );
}

function createEmptySubcontractRow(): EditableSubcontractRow {
  return {
    id: crypto.randomUUID(),
    package_name: "",
    subcontractor_name: "",
    po_number: "",
    po_amount: "",
    scope: "",
    status: "Active",
  };
}
