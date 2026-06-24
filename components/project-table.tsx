"use client";

import { ArrowDownUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, surfaceCard } from '@/components/ui';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

type ProjectRow = {
  id: string;
  project_code: string;
  project_name: string;
  latestUpload: string | null;
  plannedCost: number;
  actualCostToDate: number;
  plannedRevenue: number;
  recognizedRevenueToDate: number;
  remainingRevenue: number;
  remainingCost: number;
  pocPercent: number;
  forecastMargin: number;
  forecastMarginPercent: number;
  mtdRevenueRecognition: number;
  ytdRevenueRecognition: number;
  riskStatus: 'Warning' | 'Safe';
};

type SortKey = 'project_code' | 'project_name' | 'plannedCost' | 'actualCostToDate' | 'pocPercent' | 'plannedRevenue' | 'recognizedRevenueToDate' | 'forecastMargin';

export function ProjectTable({ rows, demoMode, canDeleteProject }: { rows: ProjectRow[]; demoMode: boolean; canDeleteProject: boolean; }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('forecastMargin');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  async function deleteProject(id: string) {
    setMessage('');
    if (!window.confirm('Delete this project and all of its related data? This cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Unable to delete project.');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete project.');
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === 'project_name' || nextKey === 'project_code' ? 'asc' : 'desc');
  }

  const sortedRows = useMemo(() => {
    const ordered = [...rows].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right);
      return Number(left) - Number(right);
    });
    return sortDirection === 'asc' ? ordered : ordered.reverse();
  }, [rows, sortDirection, sortKey]);

  const totals = useMemo(() => ({
    plannedRevenue: rows.reduce((sum, row) => sum + row.plannedRevenue, 0),
    recognizedRevenue: rows.reduce((sum, row) => sum + row.recognizedRevenueToDate, 0),
    forecastMargin: rows.reduce((sum, row) => sum + row.forecastMargin, 0),
    actualCost: rows.reduce((sum, row) => sum + row.actualCostToDate, 0),
  }), [rows]);

  const headerButton = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <button type="button" onClick={() => toggleSort(key)} className={`inline-flex items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted hover:text-text transition ${align === 'right' ? 'justify-end w-full' : ''}`}>
      {label}
      <ArrowDownUp className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-xl border border-warning/20 bg-warning/5 px-5 py-4 text-xs font-semibold text-warning shadow-sm">
          Local database fallback is active. {canDeleteProject ? 'You can delete projects before uploading fresh datasets.' : 'Delete capability is restricted to Admin role.'}
        </div>
      ) : null}
      
      {message ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-xs font-semibold text-danger shadow-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Planned Revenue', value: formatCurrency(totals.plannedRevenue), tone: 'accent' },
          { label: 'Recognized Revenue', value: formatCurrency(totals.recognizedRevenue), tone: 'success' },
          { label: 'Management Actual Cost', value: formatCurrency(totals.actualCost), tone: 'accent' },
          { label: 'Forecast Margin', value: formatCurrency(totals.forecastMargin), tone: totals.forecastMargin >= 0 ? 'success' : 'danger' },
        ].map((item, idx) => (
          <div key={idx} className={cn("relative overflow-hidden rounded-xl border p-5 bg-panel shadow-card", {
            'border-accent/15': item.tone === 'accent',
            'border-success/15': item.tone === 'success',
            'border-danger/15': item.tone === 'danger',
          })}>
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r" style={{
              backgroundImage: item.tone === 'accent' ? 'linear-gradient(to right, transparent, rgb(var(--color-accent) / 0.4), transparent)' :
                               item.tone === 'success' ? 'linear-gradient(to right, transparent, rgb(var(--color-success) / 0.4), transparent)' :
                               'linear-gradient(to right, transparent, rgb(var(--color-danger) / 0.4), transparent)'
            }} />
            <div className="section-kicker text-muted/70 font-semibold tracking-wider">{item.label}</div>
            <div className="data-value mt-3.5 text-right text-[20px] font-extrabold text-text tracking-tight">{item.value}</div>
          </div>
        ))}
      </div>

      <div className={`overflow-hidden border border-line/40 bg-panel/30 shadow-card ${surfaceCard}`}>
        <div className="border-b border-line/30 px-5 py-4 flex flex-col gap-1">
          <div className="text-sm font-bold text-text">Project Portfolio</div>
          <div className="text-xs text-muted/75 font-medium">Click columns to sort. Select a project to inspect baselines or configuration.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-xs">
            <thead className="bg-panel2/60 text-left text-muted/80 border-b border-line/35">
              <tr>
                <th className="px-5 py-3.5">{headerButton('Project Code', 'project_code')}</th>
                <th className="px-5 py-3.5">{headerButton('Project Name', 'project_name')}</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Latest Upload</th>
                <th className="px-5 py-3.5 text-right">{headerButton('Planned Cost', 'plannedCost', 'right')}</th>
                <th className="px-5 py-3.5 text-right">{headerButton('Actual Cost', 'actualCostToDate', 'right')}</th>
                <th className="px-5 py-3.5 text-right">{headerButton('POC %', 'pocPercent', 'right')}</th>
                <th className="px-5 py-3.5 text-right">{headerButton('Planned Revenue', 'plannedRevenue', 'right')}</th>
                <th className="px-5 py-3.5 text-right">{headerButton('Recognized Revenue', 'recognizedRevenueToDate', 'right')}</th>
                <th className="px-5 py-3.5 text-right">{headerButton('Forecast Margin', 'forecastMargin', 'right')}</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Risk</th>
                {canDeleteProject ? <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/25 bg-panel/20">
              {sortedRows.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-panel2/40">
                  <td className="px-5 py-4 data-value font-semibold text-text">{project.project_code}</td>
                  <td className="px-5 py-4">
                    <Link href={`/projects/${project.id}`} className="font-bold text-accent hover:underline decoration-accent/40">
                      {project.project_name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted/80 font-medium">{project.latestUpload ? new Date(project.latestUpload).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-4 text-right data-value text-muted">{formatCurrency(project.plannedCost)}</td>
                  <td className="px-5 py-4 text-right data-value font-bold text-text">{formatCurrency(project.actualCostToDate)}</td>
                  <td className="px-5 py-4 text-right data-value font-bold text-text">{formatPercent(project.pocPercent)}</td>
                  <td className="px-5 py-4 text-right data-value text-muted">{formatCurrency(project.plannedRevenue)}</td>
                  <td className="px-5 py-4 text-right data-value font-bold text-text">{formatCurrency(project.recognizedRevenueToDate)}</td>
                  <td className="px-5 py-4 text-right data-value">
                    <div className={cn("font-bold", project.forecastMargin < 0 ? 'text-danger' : 'text-success')}>{formatCurrency(project.forecastMargin)}</div>
                    <div className="mt-0.5 text-[10px] text-muted font-medium">{formatPercent(project.forecastMarginPercent)} margin</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge tone={project.riskStatus === 'Warning' ? 'warning' : 'success'}>{project.riskStatus}</Badge>
                  </td>
                  {canDeleteProject ? (
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => deleteProject(project.id)}
                        disabled={deletingId === project.id}
                        className="rounded px-2.5 py-1.5 text-[10px] font-bold tracking-wide uppercase border border-danger/20 bg-danger/5 text-danger hover:bg-danger hover:text-white disabled:opacity-50 transition"
                      >
                        {deletingId === project.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

