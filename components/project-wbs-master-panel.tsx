"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { surfaceCard } from "@/components/ui";
import type { ProjectWbsMaster } from "@/lib/types";

type Props = {
  projectId: string;
  rows: ProjectWbsMaster[];
};

type EditableRow = ProjectWbsMaster & { localId: string };

export function ProjectWbsMasterPanel({ projectId, rows }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<EditableRow[]>(() => mapRowsToEditable(rows));

  useEffect(() => {
    setItems(mapRowsToEditable(rows));
  }, [rows]);

  const stats = useMemo(() => {
    const revenueCount = items.filter((item) => item.is_revenue_generating && item.is_active).length;
    const costCount = items.filter((item) => item.include_in_cost && item.is_active).length;
    const excludedCount = items.filter((item) => !item.is_revenue_generating && !item.include_in_cost).length;
    return { revenueCount, costCount, excludedCount };
  }, [items]);

  function updateRow(localId: string, key: keyof EditableRow, value: string | boolean) {
    setItems((current) => current.map((row) => (row.localId === localId ? { ...row, [key]: value } : row)));
  }

  async function saveRows() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/project-wbs-master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        rows: items.map(({ wbs_code, wbs_description, is_revenue_generating, include_in_cost, is_active, remarks }) => ({
          wbs_code,
          wbs_description,
          is_revenue_generating,
          include_in_cost,
          is_active,
          remarks,
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSaving(false);
      setMessage(payload.error ?? "Unable to save WBS configuration.");
      return;
    }

    setMessage("WBS configuration saved. Recalculating financials...");
    const recalcResponse = await fetch("/api/financial-sources/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    const recalcPayload = await recalcResponse.json().catch(() => ({}));
    setSaving(false);

    if (!recalcResponse.ok) {
      setMessage(recalcPayload.error ?? "WBS configuration saved, but financial recalculation failed.");
      return;
    }

    setMessage(`WBS configuration saved. Recalculated ${recalcPayload.rowCount ?? 0} financial WBS row(s).`);
    router.refresh();
  }

  async function recalculateRows() {
    setRecalculating(true);
    setMessage("");

    const response = await fetch("/api/financial-sources/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    const payload = await response.json().catch(() => ({}));
    setRecalculating(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to recalculate financial data.");
      return;
    }

    setMessage(`Recalculated ${payload.rowCount ?? 0} WBS row(s) from the current source data.`);
    router.refresh();
  }

  return (
    <div className={`space-y-4 p-5 ${surfaceCard}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text">WBS Master</h3>
          <p className="mt-1 text-sm text-muted">
            Control how each WBS contributes to revenue recognition, cost calculations, and project progress logic.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total WBS" value={String(items.length)} />
          <SummaryCard label="Revenue WBS" value={String(stats.revenueCount)} />
          <SummaryCard label="Cost WBS" value={String(stats.costCount)} />
          <SummaryCard label="Excluded WBS" value={String(stats.excludedCount)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line/70">
        <table className="min-w-full text-sm">
          <thead className="bg-panel2/80 text-muted">
            <tr>
              <th className="px-4 py-3 text-left">WBS Code</th>
              <th className="px-4 py-3 text-left">WBS Description</th>
              <th className="px-4 py-3 text-left">Revenue-Generating</th>
              <th className="px-4 py-3 text-left">Include in Cost</th>
              <th className="px-4 py-3 text-left">Active Status</th>
              <th className="px-4 py-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.localId} className="border-t border-line/60">
                <td className="px-4 py-3 align-top text-text">{row.wbs_code}</td>
                <td className="px-4 py-3 align-top">
                  <input
                    className={inputClass}
                    value={row.wbs_description}
                    onChange={(e) => updateRow(row.localId, "wbs_description", e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-line/70 bg-panel/50 px-3 py-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line/70 bg-panel/80 text-accent focus:ring-accent/50"
                      checked={row.is_revenue_generating}
                      onChange={(e) => updateRow(row.localId, "is_revenue_generating", e.target.checked)}
                    />
                    <span>{row.is_revenue_generating ? "Revenue WBS" : "Not Revenue WBS"}</span>
                  </label>
                </td>
                <td className="px-4 py-3 align-top">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-line/70 bg-panel/50 px-3 py-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line/70 bg-panel/80 text-accent focus:ring-accent/50"
                      checked={row.include_in_cost}
                      onChange={(e) => updateRow(row.localId, "include_in_cost", e.target.checked)}
                    />
                    <span>{row.include_in_cost ? "Include in Cost" : "Exclude from Cost"}</span>
                  </label>
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    className={selectClass}
                    value={row.is_active ? "active" : "inactive"}
                    onChange={(e) => updateRow(row.localId, "is_active", e.target.value === "active")}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    className={inputClass}
                    value={row.remarks ?? ""}
                    placeholder="Remarks"
                    onChange={(e) => updateRow(row.localId, "remarks", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveRows}
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save WBS configuration"}
        </button>
        <button
          type="button"
          onClick={recalculateRows}
          disabled={recalculating}
          className="rounded-xl border border-line/70 bg-panel/60 px-4 py-3 text-sm font-medium text-text hover:bg-panel2/80 disabled:opacity-60"
        >
          {recalculating ? "Recalculating..." : "Recalculate from sources"}
        </button>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-panel/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-2 text-base font-semibold text-text">{value}</div>
    </div>
  );
}

function mapRowsToEditable(rows: ProjectWbsMaster[]) {
  return rows.map((row) => ({
    ...row,
    localId: row.id ?? `${row.wbs_code}-${crypto.randomUUID()}`,
    remarks: row.remarks ?? "",
  }));
}

const inputClass = "min-w-[220px] rounded-xl border border-line/70 bg-panel/70 px-3 py-2 text-sm text-text";
const selectClass = "min-w-[140px] rounded-xl border border-line/70 bg-panel/70 px-3 py-2 text-sm text-text";
