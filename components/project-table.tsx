"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Badge, surfaceCard } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/utils';

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

export function ProjectTable({
  rows,
  demoMode,
  canDeleteProject,
}: {
  rows: ProjectRow[];
  demoMode: boolean;
  canDeleteProject: boolean;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function deleteProject(id: string) {
    setMessage('');
    if (!window.confirm('Delete this project and all of its related project data? This cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to delete project.');
      }
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete project.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {demoMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <div>Local data mode is active. {canDeleteProject ? 'You can delete projects before each test upload.' : 'Delete action is available only for admins.'}</div>
        </div>
      ) : null}
      {message ? <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{message}</div> : null}

      <div className={`overflow-hidden ${surfaceCard}`}>
        <table className="min-w-full divide-y divide-line/20 text-sm">
          <thead className="bg-panel2/60 text-left text-muted">
            <tr>
              <th className="px-4 py-3">Project Code</th>
              <th className="px-4 py-3">Project Name</th>
              <th className="px-4 py-3">Latest Source Upload</th>
              <th className="px-4 py-3">Planned Cost</th>
              <th className="px-4 py-3">Management Actual Cost</th>
              <th className="px-4 py-3">POC %</th>
              <th className="px-4 py-3">Planned Revenue</th>
              <th className="px-4 py-3">Recognized Revenue</th>
              <th className="px-4 py-3">Forecast Margin</th>
              <th className="px-4 py-3">Risk Status</th>
              {canDeleteProject ? <th className="px-4 py-3">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/20 bg-panel/55">
            {rows.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-3 text-text">{project.project_code}</td>
                <td className="px-4 py-3 text-text">
                  <Link href={`/projects/${project.id}`} className="hover:text-accent">
                    {project.project_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{project.latestUpload ? new Date(project.latestUpload).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(project.plannedCost)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(project.actualCostToDate)}</td>
                <td className="px-4 py-3 text-muted">{formatPercent(project.pocPercent)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(project.plannedRevenue)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(project.recognizedRevenueToDate)}</td>
                <td className="px-4 py-3 text-muted">
                  <div>{formatCurrency(project.forecastMargin)}</div>
                  <div className="mt-1 text-xs text-muted/80">{formatPercent(project.forecastMarginPercent)} margin</div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={project.riskStatus === 'Warning' ? 'warning' : 'success'}>{project.riskStatus}</Badge>
                </td>
                {canDeleteProject ? (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      disabled={deletingId === project.id}
                      className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
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
  );
}
