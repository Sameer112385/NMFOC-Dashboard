"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { getEffectivePendingCost, getPostingSummary, getMaterialPendingCost, getSubcontractPendingCost, getManpowerPendingCost } from "@/lib/pm-posting";
import type { DailyUpdate, PMManpowerLine, PMMaterialLine, PMSubcontractLine } from "@/lib/types";
import { ChevronDown, ChevronUp, Clock, FileCheck, CheckCircle } from "lucide-react";

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

    setRowMessage((current) => ({ ...current, [rowId]: "SAP posting status saved successfully." }));
    router.refresh();
  }

  const sortedUpdates = useMemo(() => tableUpdates, [tableUpdates]);

  return (
    <div className="overflow-hidden rounded-xl border border-line/40 bg-panel/30 shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-[1300px] w-full text-xs">
          <thead className="bg-panel2/60 border-b border-line/35 text-left text-muted/80">
            <tr>
              <th className="w-12 px-5 py-3.5 text-center"></th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Project</th>
              <th className="px-5 py-3.5">Revenue WBS</th>
              <th className="px-5 py-3.5 text-right">Expected Progress</th>
              <th className="px-5 py-3.5 text-right">Material Cost</th>
              <th className="px-5 py-3.5 text-right">Subcontractor Cost</th>
              <th className="px-5 py-3.5 text-right">Manpower Cost</th>
              <th className="px-5 py-3.5">Simulation / SAP Posting</th>
              <th className="px-5 py-3.5 text-right">Active PM Simulated</th>
              <th className="px-5 py-3.5">Issue / Delay</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5">Submitted By</th>
            </tr>
          </thead>
          {sortedUpdates.map((update) => {
            const rowKey = `${update.project_id}-${update.update_date}-${update.revenue_wbs_id}-${update.created_at ?? ""}`;
            const rowId = update.id ?? rowKey;
            const isOpen = openRow === rowKey;
            const postingSummary = getPostingSummary(update);

            return (
              <tbody key={rowKey} className="divide-y divide-line/25">
                <tr
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-panel2/40",
                    isOpen ? "bg-panel2/30" : "bg-panel/10"
                  )}
                  onClick={() => setOpenRow((current) => (current === rowKey ? null : rowKey))}
                >
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-panel shadow-sm text-muted">
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted/80 font-semibold">{new Date(update.update_date).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-bold text-text">{projectNameById[update.project_id] ?? update.project_id}</td>
                  <td className="px-5 py-4 font-semibold data-value text-muted">{wbsCodeById[update.revenue_wbs_id] ?? update.revenue_wbs_id}</td>
                  <td className="px-5 py-4 text-right data-value font-bold text-text">{formatPercent(update.expected_progress)}</td>
                  <td className={cn("px-5 py-4 text-right data-value text-muted", update.material_sap_posted && "line-through opacity-45")}>
                    {formatCurrency(update.pending_material_cost)}
                  </td>
                  <td className={cn("px-5 py-4 text-right data-value text-muted", update.subcontract_sap_posted && "line-through opacity-45")}>
                    {formatCurrency(update.pending_subcontractor_cost)}
                  </td>
                  <td className={cn("px-5 py-4 text-right data-value text-muted", update.manpower_sap_posted && "line-through opacity-45")}>
                    {formatCurrency(update.pending_manpower_cost)}
                  </td>
                  <td className="px-5 py-4 text-[11px] text-muted">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted/65" /> Mat: {postingSummary.material}</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3 w-3 text-muted/65" /> Sub: {postingSummary.subcontract}</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><Clock className="h-3 w-3 text-muted/65" /> MP: {postingSummary.manpower}</div>
                  </td>
                  <td className="px-5 py-4 text-right data-value font-extrabold text-accent">{formatCurrency(getEffectivePendingCost(update))}</td>
                  <td className="px-5 py-4 text-muted font-medium max-w-xs truncate">{update.issue_delay ?? "-"}</td>
                  <td className="px-5 py-4 text-center">
                    <Badge tone={update.approval_status === 'Approved' ? 'success' : update.approval_status === 'Pending' ? 'warning' : 'default'}>
                      {update.approval_status ?? "New"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-muted/80 font-medium">{update.submitted_by ?? "-"}</td>
                </tr>
                {isOpen ? (
                  <tr className="bg-panel2/15">
                    <td colSpan={13} className="px-6 py-6 border-l-2 border-accent/40">
                      <div className="space-y-6 max-w-[1400px]">
                        {/* Subcontractor Block */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          <PostingControlCard
                            title="Subcontractor"
                            description="Active costs display in dashboard calculations. Mark 'Posted in SAP' when invoice matches official postings."
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
                                )
                              )
                            }
                            onPostedAtChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, subcontract_posted_at: value } : item,
                                )
                              )
                            }
                            onPostedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, subcontract_posted_by: value } : item,
                                )
                              )
                            }
                            onPostingReferenceChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, subcontract_posting_reference: value } : item,
                                )
                              )
                            }
                            onUpdatedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, subcontract_updated_by: value } : item,
                                )
                              )
                            }
                            referencePlaceholder="Service Entry Sheet / Purchase Order Ref"
                          />
                          <SubcontractorDetailCard lines={update.subcontract_lines ?? []} />
                        </div>

                        {/* Manpower Block */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          <PostingControlCard
                            title="Manpower"
                            description="Calculated timesheet accruals. Uncheck once labor postings are recognized under SAP actual costs."
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
                                )
                              )
                            }
                            onPostedAtChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, manpower_posted_at: value } : item,
                                )
                              )
                            }
                            onPostedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, manpower_posted_by: value } : item,
                                )
                              )
                            }
                            onPostingReferenceChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, manpower_posting_reference: value } : item,
                                )
                              )
                            }
                            onUpdatedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, manpower_updated_by: value } : item,
                                )
                              )
                            }
                            referencePlaceholder="Timesheet Doc / Activity Allocation Ref"
                          />
                          <ManpowerDetailCard lines={update.manpower_lines ?? []} />
                        </div>

                        {/* Material Block */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          <PostingControlCard
                            title="Material"
                            description="Material consumption not yet synchronized in SAP. Remove simulation upon receipt of SAP GR/GI slips."
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
                                )
                              )
                            }
                            onPostedAtChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, material_posted_at: value } : item,
                                )
                              )
                            }
                            onPostedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, material_posted_by: value } : item,
                                )
                              )
                            }
                            onPostingReferenceChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, material_posting_reference: value } : item,
                                )
                              )
                            }
                            onUpdatedByChange={(value) =>
                              setTableUpdates((current) =>
                                current.map((item) =>
                                  item.id === update.id ? { ...item, material_updated_by: value } : item,
                                )
                              )
                            }
                            referencePlaceholder="Material Doc / Goods Issue Ref"
                          />
                          <MaterialDetailCard lines={update.material_lines ?? []} />
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/30">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                savePostingStatus(
                                  tableUpdates.find((item) => item.id === update.id) ?? update,
                                )
                              }
                              disabled={savingRow === rowId}
                              className="rounded-lg bg-accent px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-60 shadow-sm"
                            >
                              {savingRow === rowId ? "Saving..." : "Save SAP posting status"}
                            </button>
                            {rowMessage[rowId] ? (
                              <span className="text-xs font-bold text-accent bg-accent/5 border border-accent/15 px-3 py-1.5 rounded-md">
                                {rowMessage[rowId]}
                              </span>
                            ) : null}
                          </div>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this PM update? This will revert simulated cost/revenue contributions.")) return;
                              setSavingRow(rowId);
                              const res = await fetch("/api/pm-updates", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: rowId }),
                              });
                              setSavingRow(null);
                              if (!res.ok) {
                                const payload = await res.json().catch(() => ({}));
                                setRowMessage((curr) => ({ ...curr, [rowId]: payload.error ?? "Failed to delete update." }));
                                return;
                              }
                              setTableUpdates((curr) => curr.filter((item) => item.id !== update.id));
                              setOpenRow(null);
                              router.refresh();
                            }}
                            disabled={savingRow === rowId}
                            className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-xs font-bold text-danger hover:bg-danger hover:text-white transition disabled:opacity-60"
                          >
                            Delete Update
                          </button>
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
    <div className="rounded-xl border border-line bg-panel p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-[13px] font-bold text-text">{title} Posting Control</div>
          <div className="text-[11px] leading-relaxed text-muted/80 font-medium">{description}</div>
        </div>
        <label className="flex items-center gap-2.5 text-xs font-bold text-text shrink-0 cursor-pointer self-start sm:self-auto bg-panel2/60 px-3 py-1.5 rounded-lg border border-line/50 hover:bg-panel2 transition">
          <input
            type="checkbox"
            checked={stillSimulating}
            onChange={(event) => onStillSimulatingChange(event.target.checked)}
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent accent-accent bg-panel cursor-pointer"
          />
          <span>{stillSimulating ? "Accruing in simulation" : "Posted in SAP"}</span>
        </label>
      </div>

      {!stillSimulating && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Posting Date</span>
            <input
              type="date"
              value={postedAt}
              onChange={(event) => onPostedAtChange(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Posted By</span>
            <input
              value={postedBy}
              onChange={(event) => onPostedByChange(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text outline-none focus:border-accent placeholder:text-muted/50"
              placeholder="Full Name"
            />
          </label>
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">SAP Reference Doc</span>
            <input
              value={postingReference}
              onChange={(event) => onPostingReferenceChange(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text outline-none focus:border-accent placeholder:text-muted/50"
              placeholder={referencePlaceholder}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Updated By</span>
            <input
              value={updatedBy}
              onChange={(event) => onUpdatedByChange(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-text outline-none focus:border-accent"
            />
          </label>
          <div className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">Last Updated</span>
            <div className="rounded-lg border border-line/60 bg-panel2/40 px-3 py-2 text-xs text-muted/80 font-medium h-[34px] flex items-center">
              {updatedAt ? new Date(updatedAt).toLocaleString() : "No updates recorded"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5 shadow-sm space-y-3">
      <div className="text-[13px] font-bold text-text border-b border-line/30 pb-2 flex items-center gap-2">
        <FileCheck className="h-4 w-4 text-accent" />
        {title}
      </div>
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
    return <div className="text-xs text-muted/70 font-medium py-2">{emptyText}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line/50">
      <div
        className="grid border-b border-line/50 bg-panel2/60 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted/90"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column.key} className={cn(column.align === "right" ? "text-right" : "")}>
            {column.label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-line/20 bg-panel/30">
        {rows.map((row, rowIndex) => (
          <div
            key={`detail-row-${rowIndex}`}
            className="grid px-3 py-2.5 text-xs text-text hover:bg-panel2/20 transition-colors"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div
                key={`${rowIndex}-${column.key}`}
                className={cn(
                  "pr-3 break-words font-medium",
                  column.align === "right" ? "text-right tabular-nums font-bold" : "",
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
    <SectionCard title="Simulated Subcontracts">
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
        emptyText="No subcontractor lines simulated."
      />
    </SectionCard>
  );
}

// Subcomponent: Manpower lines
function ManpowerDetailCard({ lines }: { lines: PMManpowerLine[] }) {
  return (
    <SectionCard title="Simulated Manpower">
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
        emptyText="No manpower lines simulated."
      />
    </SectionCard>
  );
}

// Subcomponent: Material lines
function MaterialDetailCard({ lines }: { lines: PMMaterialLine[] }) {
  return (
    <SectionCard title="Simulated Materials">
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
        emptyText="No material lines simulated."
      />
    </SectionCard>
  );
}

