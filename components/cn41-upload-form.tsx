"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { surfaceCard } from "@/components/ui";

type SourceType = "cn41" | "gr55" | "sales_order";
type UploadItem = { file: File; sourceType: SourceType };

export function Cn41UploadForm({ projects }: { projects: { id: string; project_name: string }[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [latestSources, setLatestSources] = useState<Record<SourceType, UploadLabel | null>>({
    cn41: null,
    gr55: null,
    sales_order: null,
  });

  async function loadLatestSources(targetProjectId = projectId) {
    if (!targetProjectId) {
      setLatestSources({ cn41: null, gr55: null, sales_order: null });
      return;
    }

    const response = await fetch(`/api/financial-sources/latest?projectId=${encodeURIComponent(targetProjectId)}`);
    if (!response.ok) {
      throw new Error("Failed to load latest source metadata.");
    }

    const payload = await response.json();
    setLatestSources({
      cn41: payload.latest?.cn41 ?? null,
      gr55: payload.latest?.gr55 ?? null,
      sales_order: payload.latest?.sales_order ?? null,
    });
  }

  useEffect(() => {
    loadLatestSources(projectId).catch(() => {
      setLatestSources({ cn41: null, gr55: null, sales_order: null });
    });
  }, [projectId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || !projectId) {
      setMessage("Choose a project and at least one Excel file.");
      return;
    }

    setLoading(true);
    setMessage(items.some((item) => item.sourceType === "gr55") ? "Uploading GR55. Large SAP files can take a minute while the workbook is read and summarized." : "Uploading and recalculating financial sources.");
    const formData = new FormData();
    formData.set("project_id", projectId);
    for (const item of items) {
      formData.append("source_type", item.sourceType);
    }
    for (const item of items) {
      formData.append("file", item.file);
    }

    const response = await fetch("/api/financial-sources/upload", { method: "POST", body: formData });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Upload failed.");
      return;
    }

    const totalRows = Array.isArray(payload.results)
      ? payload.results.reduce((sum: number, item: { rowCount?: number }) => sum + Number(item.rowCount ?? 0), 0)
      : 0;
    setMessage(
      `Uploaded ${items.length} file(s). ${totalRows ? `${totalRows} rows processed.` : ""} ${
        Array.isArray(payload.results) ? `${payload.results.length} result(s) returned.` : ""
      }`,
    );
    setItems([]);
    await loadLatestSources(projectId);
    router.refresh();
  }

  async function handleRecalculate() {
    if (!projectId) {
      setMessage("Choose a project first.");
      return;
    }

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

    setMessage(`Recalculated ${payload.rowCount ?? 0} revenue WBS row(s) from the current source data.`);
    await loadLatestSources(projectId);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`p-5 ${surfaceCard}`}>
      <h3 className="text-lg font-semibold text-text">Upload Financial Source</h3>
      <p className="mt-1 text-sm text-muted">
        Upload CN41 for planned cost, GR55 for actual cost, or the Sales Order report for planned revenue.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
        <DarkSelect
          value={projectId}
          onChange={setProjectId}
          name="project_id"
          placeholder="Select project"
          options={projects.map((project) => ({ value: project.id, label: project.project_name }))}
        />
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            setItems((current) => [
              ...current,
              ...selected.map((file) => ({ file, sourceType: inferSourceType(file.name) })),
            ]);
            e.currentTarget.value = "";
          }}
          className="rounded-xl border border-line/70 bg-panel/70 px-4 py-3 text-sm text-text file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-bg"
        />
      </div>
      <div className="mt-3 space-y-2 text-xs text-muted">
        <div className="grid gap-2 rounded-xl border border-line/50 bg-panel/30 p-3 md:grid-cols-3">
          <SourceVersionLabel label="CN41" source={latestSources.cn41} />
          <SourceVersionLabel label="GR55" source={latestSources.gr55} />
          <SourceVersionLabel label="Sales Order" source={latestSources.sales_order} />
        </div>
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-line/50 bg-panel/40 px-3 py-2">
              <div className="min-w-0 flex-1 truncate">{item.file.name}</div>
              <select
                className="rounded-lg border border-line/70 bg-panel/70 px-2 py-1 text-xs text-text"
                value={item.sourceType}
                onChange={(e) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, sourceType: e.target.value as SourceType } : row,
                    ),
                  )
                }
              >
                <option value="cn41">CN41 planned cost</option>
                <option value="gr55">GR55 actual cost</option>
                <option value="sales_order">Sales order revenue</option>
              </select>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                className="rounded-lg border border-danger/30 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <div>Pick one or more files. Each file will be assigned its own source type before upload.</div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={loading || !items.length} className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg disabled:opacity-60">
          {loading ? "Uploading..." : "Upload and recalculate"}
        </button>
        <button
          type="button"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="rounded-xl border border-line/70 bg-panel/60 px-4 py-3 text-sm font-medium text-text hover:bg-panel2/80 disabled:opacity-60"
        >
          {recalculating ? "Recalculating..." : "Recalculate from WBS config"}
        </button>
        <span className="text-xs text-muted">
          {items.length ? `${items.length} file(s) selected` : "You can select multiple files at once."}
        </span>
        {message ? <span className="text-sm text-muted">{message}</span> : null}
      </div>
    </form>
  );
}

type UploadLabel = {
  file_name: string;
  upload_date: string;
  version_no: number;
  is_latest: boolean;
} | null;

function SourceVersionLabel({ label, source }: { label: string; source: UploadLabel }) {
  const dateLabel = source?.upload_date ? new Date(source.upload_date).toLocaleDateString("en-GB") : "none uploaded";
  const versionLabel = source ? `v${source.version_no}` : "no version";
  return (
    <div className="rounded-lg border border-line/50 bg-panel/70 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1 truncate text-sm text-text">{source ? source.file_name : "No file uploaded yet"}</div>
      <div className="text-[11px] text-muted">
        {versionLabel} {source ? `- ${dateLabel}` : ""}
      </div>
    </div>
  );
}

function inferSourceType(name: string): SourceType {
  const lowered = name.toLowerCase();
  if (lowered.includes("gr55")) return "gr55";
  if (lowered.includes("sales") || lowered.includes("order") || lowered.includes("so")) return "sales_order";
  return "cn41";
}
