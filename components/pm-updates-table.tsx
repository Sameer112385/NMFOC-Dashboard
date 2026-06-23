"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { getEffectivePendingCost, getPostingSummary, getMaterialPendingCost, getSubcontractPendingCost, getManpowerPendingCost } from "@/lib/pm-posting";
import type { DailyUpdate, PMManpowerLine, PMMaterialLine, PMSubcontractLine } from "@/lib/types";

type PMUpdatesTableProps = {
  updates: DailyUpdate[];
  projectNameById: Record<string, string>;
  wbsCodeById: Record<string, string>;
};

export function PMUpdatesTable({ updates, projectNameById, wbsCodeById }: PMUpdatesTableProps) {
  const router = useRouter();
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [tableUpdates, setTableUpdates] = useState(updates);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    setTableUpdates(updates);
  }, [updates]);

  async function savePostingStatus(update: DailyUpdate) {
    const rowId = update.id ?? "";
    if (!rowId) return;

    setSavingRow(rowId);
    setRowMessage((current) => ({ ...current, [rowId]: "" }));

    const response = await fetch("/api/pm-updates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rowId,
        material_sap_posted: update.material_sap_posted ?? false,
        material_posted_at: update.material_posted_at ?? null,
        material_posted_by: update.material_posted_by ?? null,
        material_posting_reference: update.material_posting_reference ?? null,
        material_updated_by: update.material_updated_by ?? update.submitted_by ?? null,
        subcontract_sap_posted: update.subcontract_sap_posted ?? false,
        subcontract_posted_at: update.subcontract_posted_at ?? null,
        subcontract_posted_by: update.subcontract_posted_by ?? null,
        subcontract_posting_reference: update.subcontract_posting_reference ?? null,
        subcontract_updated_by: update.subcontract_updated_by ?? update.submitted_by ?? null,
        manpower_sap_posted: update.manpower_sap_posted ?? false,
        manpower_posted_at: update.manpower_posted_at ?? null,
        manpower_posted_by: update.manpower_posted_by ?? null,
        manpower_posting_reference: update.manpower_posting_reference ?? null,
        manpower_updated_by: update.manpower_updated_by ?? update.submitted_by ?? null,
      }),
    });

    const payload = await response.json();
    setSavingRow(null);

    if (!response.ok) {
      setRowMessage((current) => ({ ...current, [rowId]: payload.error ?? "Unable to save SAP posting status." }));
      return;
    }

    setRowMessage((current) => ({ ...current, [rowId]: "SAP posting status saved." }));
    router.refresh();
  }

  const sortedUpdates = useMemo(() => tableUpdates, [tableUpdates]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-muted">
          <tr>
            <th className="w-10 px-4 py-3"></th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Revenue WBS</th>
            <th className="px-4 py-3">Expected Progress %</th>
            <th className="px-4 py-3">Material Cost</th>
            <th className="px-4 py-3">Subcontractor Cost</th>
            <th className="px-4 py-3">Manpower Cost</th>
            <th className="px-4 py-3">Simulation / SAP Posting</th>
            <th className="px-4 py-3">Active PM Simulated Cost</th>
            <th className="px-4 py-3">Issue / Delay</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted By</th>
          </tr>
        </thead>
        {sortedUpdates.map((update) => {
          const rowKey = `${update.project_id}-${update.update_date}-${update.revenue_wbs_id}-${update.created_at ?? ""}`;
          const rowId = update.id ?? rowKey;
          const isOpen = openRow === rowKey;
          const postingSummary = getPostingSummary(update);

          return (
            <tbody key={rowKey} className="divide-y divide-white/10 bg-black/10">
              <tr
                className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                onClick={() => setOpenRow((current) => (current === rowKey ? null : rowKey))}
              >
                <td className="px-4 py-3 text-muted">{isOpen ? "-" : "+"}</td>
                <td className="px-4 py-3 text-muted">{new Date(update.update_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-text">{projectNameById[update.project_id] ?? update.project_id}</td>
                <td className="px-4 py-3 text-muted">{wbsCodeById[update.revenue_wbs_id] ?? update.revenue_wbs_id}</td>
                <td className="px-4 py-3 text-muted">{formatPercent(update.expected_progress)}</td>
                <td className={cn("px-4 py-3 text-muted", update.material_sap_posted && "line-through opacity-55")}>
                  {formatCurrency(update.pending_material_cost)}
                </td>
                <td className={cn("px-4 py-3 text-muted", update.subcontract_sap_posted && "line-through opacity-55")}>
                  {formatCurrency(update.pending_subcontractor_cost)}
                </td>
                <td className={cn("px-4 py-3 text-muted", update.manpower_sap_posted && "line-through opacity-55")}>
                  {formatCurrency(update.pending_manpower_cost)}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  <div>Mat: {postingSummary.material}</div>
                  <div>Sub: {postingSummary.subcontract}</div>
                  <div>MP: {postingSummary.manpower}</div>
                </td>
                <td className="px-4 py-3 font-medium text-text">{formatCurrency(getEffectivePendingCost(update))}</td>
                <td className="px-4 py-3 text-muted">{update.issue_delay ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{update.approval_status ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{update.submitted_by ?? "-"}</td>
              </tr>
              {isOpen ? (
                <tr className="bg-white/[0.03]">
                  <td colSpan={13} className="px-5 py-5">
                    <div className="space-y-4">
                      <PostingControlCard
                        title="Subcontractor"
                        description="Checked means this subcontractor cost is still active in management actual cost. Uncheck after it is posted in SAP."
                        stillSimulating={!(update.subcontract_sap_posted ?? false)}
                        postedAt={update.subcontract_posted_at ?? ""}
                        postedBy={update.subcontract_posted_by ?? ""}
                        postingReference={update.subcontract_posting_reference ?? ""}
                        updatedBy={update.subcontract_updated_by ?? update.submitted_by ?? ""}
                        updatedAt={update.subcontract_updated_at ?? ""}
                        onStillSimulatingChange={(stillSimulating) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, subcontract_sap_posted: !stillSimulating } : item,
                            ),
                          )
                        }
                        onPostedAtChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, subcontract_posted_at: value } : item,
                            ),
                          )
                        }
                        onPostedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, subcontract_posted_by: value } : item,
                            ),
                          )
                        }
                        onPostingReferenceChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, subcontract_posting_reference: value } : item,
                            ),
                          )
                        }
                        onUpdatedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, subcontract_updated_by: value } : item,
                            ),
                          )
                        }
                        referencePlaceholder="Service Entry Sheet / PO posting reference"
                      />
                      <SubcontractorDetailCard lines={update.subcontract_lines ?? []} />

                      <PostingControlCard
                        title="Manpower"
                        description="Checked means this manpower cost is still active in management actual cost. Uncheck after it is posted in SAP."
                        stillSimulating={!(update.manpower_sap_posted ?? false)}
                        postedAt={update.manpower_posted_at ?? ""}
                        postedBy={update.manpower_posted_by ?? ""}
                        postingReference={update.manpower_posting_reference ?? ""}
                        updatedBy={update.manpower_updated_by ?? update.submitted_by ?? ""}
                        updatedAt={update.manpower_updated_at ?? ""}
                        onStillSimulatingChange={(stillSimulating) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, manpower_sap_posted: !stillSimulating } : item,
                            ),
                          )
                        }
                        onPostedAtChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, manpower_posted_at: value } : item,
                            ),
                          )
                        }
                        onPostedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, manpower_posted_by: value } : item,
                            ),
                          )
                        }
                        onPostingReferenceChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, manpower_posting_reference: value } : item,
                            ),
                          )
                        }
                        onUpdatedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, manpower_updated_by: value } : item,
                            ),
                          )
                        }
                        referencePlaceholder="Timesheet card / labor posting reference"
                      />
                      <ManpowerDetailCard lines={update.manpower_lines ?? []} />

                      <PostingControlCard
                        title="Material"
                        description="Checked means this material cost is still active in management actual cost. Uncheck after it is posted in SAP."
                        stillSimulating={!(update.material_sap_posted ?? false)}
                        postedAt={update.material_posted_at ?? ""}
                        postedBy={update.material_posted_by ?? ""}
                        postingReference={update.material_posting_reference ?? ""}
                        updatedBy={update.material_updated_by ?? update.submitted_by ?? ""}
                        updatedAt={update.material_updated_at ?? ""}
                        onStillSimulatingChange={(stillSimulating) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, material_sap_posted: !stillSimulating } : item,
                            ),
                          )
                        }
                        onPostedAtChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, material_posted_at: value } : item,
                            ),
                          )
                        }
                        onPostedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, material_posted_by: value } : item,
                            ),
                          )
                        }
                        onPostingReferenceChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, material_posting_reference: value } : item,
                            ),
                          )
                        }
                        onUpdatedByChange={(value) =>
                          setTableUpdates((current) =>
                            current.map((item) =>
                              item.id === update.id ? { ...item, material_updated_by: value } : item,
                            ),
                          )
                        }
                        referencePlaceholder="Material document number / inventory reference"
                      />
                      <MaterialDetailCard lines={update.material_lines ?? []} />

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            savePostingStatus(
                              tableUpdates.find((item) => item.id === update.id) ?? update,
                            )
                          }
                          disabled={savingRow === rowId}
                          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
                        >
                          {savingRow === rowId ? "Saving..." : "Save SAP posting status"}
                        </button>
                        {rowMessage[rowId] ? <span className="text-sm text-muted">{rowMessage[rowId]}</span> : null}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function PostingControlCard({
  title,
  description,
  stillSimulating,
  postedAt,
  postedBy,
  postingReference,
  updatedBy,
  updatedAt,
  onStillSimulatingChange,
  onPostedAtChange,
  onPostedByChange,
  onPostingReferenceChange,
  onUpdatedByChange,
  referencePlaceholder,
}: {
  title: string;
  description: string;
  stillSimulating: boolean;
  postedAt: string;
  postedBy: string;
  postingReference: string;
  updatedBy: string;
  updatedAt: string;
  onStillSimulatingChange: (stillSimulating: boolean) => void;
  onPostedAtChange: (value: string) => void;
  onPostedByChange: (value: string) => void;
  onPostingReferenceChange: (value: string) => void;
  onUpdatedByChange: (value: string) => void;
  referencePlaceholder: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-text">{title} SAP Posting Control</div>
          <div className="mt-1 text-xs text-muted">{description}</div>
        </div>
        <label className="flex items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            checked={stillSimulating}
            onChange={(event) => onStillSimulatingChange(event.target.checked)}
            className="h-4 w-4 rounded border border-white/20 bg-panel"
          />
          <span>{stillSimulating ? "Still Simulating" : "Posted in SAP / Stop Simulation"}</span>
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input
          type="date"
          value={postedAt}
          onChange={(event) => onPostedAtChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-panel/70 px-4 py-3 text-sm text-text"
          placeholder="Posted date"
        />
        <input
          value={postedBy}
          onChange={(event) => onPostedByChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-panel/70 px-4 py-3 text-sm text-text"
          placeholder="Posted by"
        />
        <input
          value={postingReference}
          onChange={(event) => onPostingReferenceChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-panel/70 px-4 py-3 text-sm text-text"
          placeholder={referencePlaceholder}
        />
        <input
          value={updatedBy}
          onChange={(event) => onUpdatedByChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-panel/70 px-4 py-3 text-sm text-text"
          placeholder="Updated by"
        />
        <div className="rounded-xl border border-white/10 bg-panel/70 px-4 py-3 text-sm text-muted">
          {updatedAt ? new Date(updatedAt).toLocaleString() : "Updated date"}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="mb-3 text-sm font-semibold text-text">{title}</div>
      {children}
    </div>
  );
}

function DetailTable({
  columns,
  rows,
  emptyText,
}: {
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  rows: Array<Record<string, string>>;
  emptyText: string;
}) {
  if (!rows.length) {
    return <div className="text-sm text-muted">{emptyText}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div
        className="grid border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column.key} className={cn(column.align === "right" ? "text-right" : "")}>
            {column.label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-white/10">
        {rows.map((row, rowIndex) => (
          <div
            key={`detail-row-${rowIndex}`}
            className="grid px-3 py-3 text-sm text-text"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div
                key={`${rowIndex}-${column.key}`}
                className={cn(
                  "pr-3 break-words",
                  column.align === "right" ? "text-right tabular-nums" : "",
                )}
              >
                {row[column.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SubcontractorDetailCard({ lines }: { lines: PMSubcontractLine[] }) {
  return (
    <SectionCard title="Subcontractor Details">
      <DetailTable
        columns={[
          { key: "package_name", label: "Package / Vendor" },
          { key: "coc_reference", label: "COC Reference" },
          { key: "amount", label: "Amount", align: "right" },
        ]}
        rows={lines.map((line) => ({
          package_name: line.package_name || line.subcontractor_name || "-",
          coc_reference: line.coc_reference || "-",
          amount: formatCurrency(line.amount),
        }))}
        emptyText="No subcontractor lines."
      />
    </SectionCard>
  );
}

function ManpowerDetailCard({ lines }: { lines: PMManpowerLine[] }) {
  return (
    <SectionCard title="Manpower Details">
      <DetailTable
        columns={[
          { key: "work_center", label: "Work Center" },
          { key: "cost_center", label: "Cost Center" },
          { key: "labor_category", label: "Category" },
          { key: "hours_worked", label: "Hours", align: "right" },
          { key: "hourly_rate", label: "Rate", align: "right" },
          { key: "amount", label: "Amount", align: "right" },
        ]}
        rows={lines.map((line) => ({
          work_center: line.work_center || "-",
          cost_center: line.cost_center || "-",
          labor_category: line.labor_category || "-",
          hours_worked: formatNumber(line.hours_worked),
          hourly_rate: formatCurrency(line.hourly_rate),
          amount: formatCurrency(line.amount),
        }))}
        emptyText="No manpower lines."
      />
    </SectionCard>
  );
}

function MaterialDetailCard({ lines }: { lines: PMMaterialLine[] }) {
  return (
    <SectionCard title="Material Details">
      <DetailTable
        columns={[
          { key: "material_code", label: "Material Code" },
          { key: "material_description", label: "Description" },
          { key: "unit_of_measure", label: "UoM" },
          { key: "quantity", label: "Qty", align: "right" },
          { key: "unit_price", label: "Unit Price", align: "right" },
          { key: "amount", label: "Amount", align: "right" },
        ]}
        rows={lines.map((line) => ({
          material_code: line.material_code || "-",
          material_description: line.material_description || "-",
          unit_of_measure: line.unit_of_measure || "-",
          quantity: formatNumber(line.quantity),
          unit_price: formatCurrency(line.unit_price),
          amount: formatCurrency(line.amount),
        }))}
        emptyText="No material lines."
      />
    </SectionCard>
  );
}
