"use client";

import { useMemo, useState } from 'react';
import { Badge, surfaceCard } from '@/components/ui';
import { DarkSelect } from '@/components/dark-select';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  CostComparisonChart,
  PendingChart,
  PocChart,
  RevenueSplitChart,
  RevenueVsSimulationChart,
  ScrollableTopWbsChart,
} from '@/components/charts';

type RevenueRow = {
  project_id: string;
  wbs_code: string;
  wbs_description: string;
  status: string;
  sap_actual_cost?: number;
  sap_earned_revenue?: number;
  pm_pending_cost?: number;
  planned_cost: number;
  actual_cost_to_date: number;
  planned_revenue: number;
  recognized_revenue_to_date: number;
  remaining_revenue: number;
  remaining_cost: number;
  forecast_margin: number;
  forecast_margin_percent: number;
  mtd_actual_cost: number;
  mtd_revenue_recognition: number;
  ytd_actual_cost: number;
  ytd_revenue_recognition: number;
  poc_percent: number;
  mtd_margin: number;
  ytd_margin: number;
  current_month_revenue_recognition?: number;
  opening_recognized_revenue?: number;
};

export function DashboardWbsFilter({ rows }: { rows: RevenueRow[] }) {
  const [wbsQuery, setWbsQuery] = useState('');
  const [descriptionQuery, setDescriptionQuery] = useState('');
  const [statusQuery, setStatusQuery] = useState('');
  const [percentageQuery, setPercentageQuery] = useState('');

  const descriptionOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.wbs_description).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const descriptionChoices = useMemo(
    () => [
      { value: '', label: 'All descriptions' },
      ...descriptionOptions.map((description) => ({ value: description, label: description })),
    ],
    [descriptionOptions],
  );

  const statusChoices = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      ...Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((status) => ({
        value: status,
        label: status,
      })),
    ],
    [rows],
  );

  const percentageChoices = useMemo(
    () => [
      { value: '', label: 'All percentages' },
      { value: '0-25', label: '0% - 25%' },
      { value: '25-50', label: '25% - 50%' },
      { value: '50-75', label: '50% - 75%' },
      { value: '75-100', label: '75% - 100%' },
      { value: '100+', label: '100%+' },
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    const wbs = wbsQuery.trim().toLowerCase();
    const desc = descriptionQuery.trim().toLowerCase();
    const status = statusQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesWbs = !wbs || row.wbs_code.toLowerCase().includes(wbs);
      const matchesDesc = !desc || row.wbs_description.toLowerCase().includes(desc);
      const matchesStatus = !status || row.status.toLowerCase() === status;
      const p = row.poc_percent;
      const matchesPercentage =
        !percentageQuery ||
        (percentageQuery === '0-25' && p >= 0 && p < 25) ||
        (percentageQuery === '25-50' && p >= 25 && p < 50) ||
        (percentageQuery === '50-75' && p >= 50 && p < 75) ||
        (percentageQuery === '75-100' && p >= 75 && p <= 100) ||
        (percentageQuery === '100+' && p > 100);
      return matchesWbs && matchesDesc && matchesStatus && matchesPercentage;
    });
  }, [rows, wbsQuery, descriptionQuery, statusQuery, percentageQuery]);

  const totals = {
    sapActualCost: filteredRows.reduce((sum, row) => sum + (row.sap_actual_cost ?? 0), 0),
    pmSimulatedCost: filteredRows.reduce((sum, row) => sum + (row.pm_pending_cost ?? 0), 0),
    actualCost: filteredRows.reduce((sum, row) => sum + row.actual_cost_to_date, 0),
    plannedCost: filteredRows.reduce((sum, row) => sum + row.planned_cost, 0),
    plannedRevenue: filteredRows.reduce((sum, row) => sum + row.planned_revenue, 0),
    recognizedRevenue: filteredRows.reduce((sum, row) => sum + row.recognized_revenue_to_date, 0),
    remainingRevenue: filteredRows.reduce((sum, row) => sum + row.remaining_revenue, 0),
    remainingCost: filteredRows.reduce((sum, row) => sum + row.remaining_cost, 0),
    forecastMargin: filteredRows.reduce((sum, row) => sum + row.forecast_margin, 0),
    mtdActualCost: filteredRows.reduce((sum, row) => sum + row.mtd_actual_cost, 0),
    mtdRecognition: filteredRows.reduce((sum, row) => sum + row.mtd_revenue_recognition, 0),
    ytdActualCost: filteredRows.reduce((sum, row) => sum + row.ytd_actual_cost, 0),
    ytdRecognition: filteredRows.reduce((sum, row) => sum + row.ytd_revenue_recognition, 0),
  };

  const sortedFilteredRows = useMemo(
    () => filteredRows.slice().sort((a, b) => b.recognized_revenue_to_date - a.recognized_revenue_to_date),
    [filteredRows],
  );

  return (
    <div className="relative w-full space-y-4 pt-2 lg:pt-0">
      <div className="absolute right-0 top-0 hidden text-sm text-muted lg:block lg:-translate-y-8">
        Showing <strong className="text-text">{filteredRows.length}</strong> of <strong className="text-text">{rows.length}</strong> rows
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 lg:flex lg:flex-1 lg:items-end">
          <label className="block min-w-0 lg:flex-1">
            <span className="mb-2 block text-sm text-muted">Filter by WBS</span>
            <input
              value={wbsQuery}
              onChange={(e) => setWbsQuery(e.target.value)}
              placeholder="Type WBS code"
              className="w-full rounded-xl border border-line/70 bg-panel/70 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/50"
            />
          </label>
          <label className="block min-w-0 lg:flex-[1.2]">
            <span className="mb-2 block text-sm text-muted">Filter by WBS Description</span>
            <DarkSelect value={descriptionQuery} onChange={setDescriptionQuery} options={descriptionChoices} placeholder="All descriptions" />
          </label>
          <label className="block min-w-0 lg:flex-[0.8]">
            <span className="mb-2 block text-sm text-muted">Filter by Status</span>
            <DarkSelect value={statusQuery} onChange={setStatusQuery} options={statusChoices} placeholder="All statuses" />
          </label>
          <label className="block min-w-0 lg:flex-[0.8]">
            <span className="mb-2 block text-sm text-muted">Filter by POC</span>
            <DarkSelect value={percentageQuery} onChange={setPercentageQuery} options={percentageChoices} placeholder="All percentages" />
          </label>
          <button
            type="button"
            onClick={() => {
              setWbsQuery('');
              setDescriptionQuery('');
              setStatusQuery('');
              setPercentageQuery('');
            }}
            className="h-[44px] rounded-xl border border-line/70 px-3 py-2 text-xs font-medium text-text hover:bg-panel2/80"
          >
            Clear
          </button>
        </div>
      </div>
      <div className={`text-sm text-muted lg:hidden ${surfaceCard} px-4 py-3`}>
        Showing <strong className="text-text">{filteredRows.length}</strong> of <strong className="text-text">{rows.length}</strong> rows
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        {[
          { label: 'SAP Actual Cost', value: formatCurrency(totals.sapActualCost) },
          { label: 'PM Simulated Cost', value: formatCurrency(totals.pmSimulatedCost) },
          { label: 'Management Actual Cost', value: formatCurrency(totals.actualCost) },
          { label: 'Planned Cost', value: formatCurrency(totals.plannedCost) },
          { label: 'Planned Revenue', value: formatCurrency(totals.plannedRevenue) },
          { label: 'Recognized Revenue', value: formatCurrency(totals.recognizedRevenue) },
          { label: 'Forecast Margin', value: formatCurrency(totals.forecastMargin) },
          { label: 'MTD Revenue Recognition', value: formatCurrency(totals.mtdRecognition) },
          { label: 'YTD Revenue Recognition', value: formatCurrency(totals.ytdRecognition) },
        ].map((item) => (
          <div key={item.label} className={`px-3 py-3 ${surfaceCard}`}>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{item.label}</div>
            <div className="mt-2 text-right text-base font-semibold tracking-tight text-text sm:text-lg">{item.value}</div>
          </div>
        ))}
      </div>

      <div className={`overflow-x-auto ${surfaceCard}`}>
        <table className="min-w-[1200px] divide-y divide-line/20 text-sm">
          <thead className="bg-panel2/60 text-left text-muted">
            <tr>
              <th className="px-4 py-3">WBS Code</th>
              <th className="px-4 py-3">WBS Description</th>
              <th className="px-4 py-3">Planned Cost</th>
              <th className="px-4 py-3">SAP Actual Cost</th>
              <th className="px-4 py-3">PM Simulated Cost</th>
              <th className="px-4 py-3">Management Actual Cost</th>
              <th className="px-4 py-3">Planned Revenue</th>
              <th className="px-4 py-3">Recognized Revenue</th>
              <th className="px-4 py-3">Remaining Revenue</th>
              <th className="px-4 py-3">Remaining Cost</th>
              <th className="px-4 py-3">POC %</th>
              <th className="px-4 py-3">Forecast Margin</th>
              <th className="px-4 py-3">Forecast Margin %</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/20 bg-panel/55">
            {filteredRows.map((row) => (
              <tr key={row.wbs_code}>
                <td className="px-4 py-3 text-text">{row.wbs_code}</td>
                <td className="px-4 py-3 text-muted">{row.wbs_description}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.planned_cost)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.sap_actual_cost ?? 0)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.pm_pending_cost ?? 0)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.actual_cost_to_date)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.planned_revenue)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.recognized_revenue_to_date)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.remaining_revenue)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.remaining_cost)}</td>
                <td className="px-4 py-3 text-muted">{formatPercent(row.poc_percent)}</td>
                <td className="px-4 py-3 text-muted">{formatCurrency(row.forecast_margin)}</td>
                <td className="px-4 py-3 text-muted">{formatPercent(row.forecast_margin_percent)}</td>
                <td className="px-4 py-3">
                  <Badge tone={row.poc_percent > 100 ? 'warning' : 'success'}>{row.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <RevenueSplitChart recognized={totals.recognizedRevenue} remaining={Math.max(0, totals.remainingRevenue)} total={totals.plannedRevenue} />
          <RevenueVsSimulationChart
            data={filteredRows.map((row) => ({
              name: row.wbs_code,
              sap: row.recognized_revenue_to_date,
              simulated: row.planned_revenue,
            }))}
          />
          <CostComparisonChart
            data={filteredRows.map((row) => ({
              name: row.wbs_code,
              sap: row.actual_cost_to_date,
              simulated: row.planned_cost,
            }))}
          />
          <ScrollableTopWbsChart
            data={sortedFilteredRows.map((row) => ({
              name: row.wbs_code,
              value: row.recognized_revenue_to_date,
            }))}
          />
          <PendingChart
            data={filteredRows
              .filter((row) => row.remaining_cost > 0)
              .slice(0, 8)
              .map((row) => ({ name: row.wbs_code, value: row.remaining_cost }))}
          />
          <PocChart data={filteredRows.map((row) => ({ name: row.wbs_code, value: row.poc_percent }))} />
        </div>
      ) : null}
    </div>
  );
}
