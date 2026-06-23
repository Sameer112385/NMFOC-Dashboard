"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { surfaceCard } from "@/components/ui";
import type { ProjectCostElementControl } from "@/lib/types";

type Props = {
  projectId: string;
  rows: ProjectCostElementControl[];
};

type EditableRow = ProjectCostElementControl & { localId: string };

export function ProjectCostElementControlPanel({ projectId, rows }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<EditableRow[]>(() => mapRows(rows));
  const [query, setQuery] = useState("");

  useEffect(() => {
    setItems(mapRows(rows));
  }, [rows]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.cost_element, item.cost_element_name, item.remarks ?? ""].some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [items, query]);

  const stats = useMemo(() => {
    const included = items.filter((item) => item.include_in_cost).length;
    return { total: items.length, included, excluded: items.length - included };
  }, [items]);

  function updateRow(localId: string, key: keyof EditableRow, value: string | boolean) {
    setItems((current) => current.map((row) => (row.localId === localId ? { ...row, [key]: value } : row)));
  }

  async function saveRows() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/project-cost-elements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        rows: items.map(({ cost_element, cost_element_name, include_in_cost, remarks }) => ({
          cost_element,
          cost_element_name,
          include_in_cost,
          remarks,
        })),
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSaving(false);
      setMessage(payload.error ?? "Unable to save cost element control.");
      return;
    }

    setMessage("Cost element control saved. Recalculating financials...");
    const recalcResponse = await fetch("/api/financial-sources/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    const recalcPayload = await recalcResponse.json().catch(() => ({}));
    setSaving(false);

    if (!recalcResponse.ok) {
      setMessage(recalcPayload.error ?? "Cost element control saved, but financial recalculation failed.");
      return;
    }

    setMessage(`Cost element control saved. Recalculated ${recalcPayload.rowCount ?? 0} financial WBS row(s).`);
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

    setMessage(`Recalculated ${payload.rowCount ?? 0} WBS row(s) from current cost element settings.`);
    router.refresh();
  }

  return (
    <div className={`space-y-4 p-5 ${surfaceCard}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text">Cost Element Control</h3>
          <p className="mt-1 text-sm text-muted">
            Control which GR55 cost elements are included in WBS actual cost. Source rows remain stored; excluded elements are ignored in calculations.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total Elements" value={String(stats.total)} />
          <SummaryCard label="Included" value={String(stats.included)} />
          <SummaryCard label="Excluded" value={String(stats.excluded)} />
        </div>
      </div>

      <input
        className="w-full rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search cost element code, name, or remarks"
      />

      <div className="overflow-x-auto rounded-2xl border border-line/70">
        <table className="min-w-full text-sm">
          <thead className="bg-panel2/80 text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Cost Element</th>
              <th className="px-4 py-3 text-left">Cost Element Name</th>
              <th className="px-4 py-3 text-left">Include in Actual Cost</th>
              <th className="px-4 py-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((row) => (
              <tr key={row.localId} className="border-t border-line/60">
                <td className="px-4 py-3 align-top text-text">{row.cost_element}</td>
                <td className="px-4 py-3 align-top">
                  <input
                    className={inputClass}
                    value={row.cost_element_name}
                    onChange={(event) => updateRow(row.localId, "cost_element_name", event.target.value)}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-line/70 bg-panel/50 px-3 py-2 text-sm text-text">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line/70 bg-panel/80 text-accent focus:ring-accent/50"
                      checked={row.include_in_cost}
                      onChange={(event) => updateRow(row.localId, "include_in_cost", event.target.checked)}
                    />
                    <span>{row.include_in_cost ? "Include in Cost" : "Exclude from Cost"}</span>
                  </label>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    className={inputClass}
                    value={row.remarks ?? ""}
                    placeholder="Remarks"
                    onChange={(event) => updateRow(row.localId, "remarks", event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          No GR55 cost elements detected yet. Upload GR55 first, then return here to include or exclude cost elements.
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="button" onClick={saveRows} disabled={saving || !items.length} className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60">
          {saving ? "Saving..." : "Save cost element control"}
        </button>
        <button type="button" onClick={recalculateRows} disabled={recalculating} className="rounded-xl border border-line/70 bg-panel/60 px-4 py-3 text-sm font-medium text-text hover:bg-panel2/80 disabled:opacity-60">
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

function mapRows(rows: ProjectCostElementControl[]) {
  return rows.map((row) => ({
    ...row,
    localId: row.id ?? `${row.cost_element}-${crypto.randomUUID()}`,
    cost_element_name: row.cost_element_name || row.cost_element,
    include_in_cost: row.include_in_cost !== false,
    remarks: row.remarks ?? "",
  }));
}

const inputClass = "min-w-[260px] rounded-xl border border-line/70 bg-panel/70 px-3 py-2 text-sm text-text";
