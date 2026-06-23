"use client";

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatCompactCurrency, formatCompactNumber, formatPercent } from '@/lib/utils';
import { surfaceCard } from '@/components/ui';

const palette = ['#43c6b8', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa', '#22c55e'];

const chartTooltipStyle = {
  backgroundColor: 'rgb(var(--color-panel) / 0.96)',
  border: '1px solid rgb(var(--color-line) / 0.9)',
  borderRadius: 12,
  color: 'rgb(var(--color-text))',
};

const chartLegendStyle = {
  color: 'rgb(var(--color-text))',
};

function chartAxisTickFormatter(value: number | string) {
  if (typeof value === 'number') return formatCompactNumber(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatCompactNumber(parsed) : String(value);
}

function chartTooltipFormatter(value: number, name: string) {
  const label = name.toLowerCase();
  if (label.includes('poc') || label.includes('%')) return [formatPercent(value), name];
  return [formatCompactCurrency(value), name];
}

function wrapChart({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn(surfaceCard, 'p-5', className)}>
      <h3 className="text-base font-semibold tracking-tight text-text">{title}</h3>
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}

export function RevenueVsSimulationChart({ data }: { data: { name: string; sap: number; simulated: number }[] }) {
  return wrapChart({
    title: 'Recognized Revenue vs Forecast Revenue',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line) / 0.35)" />
          <XAxis dataKey="name" stroke="rgb(var(--color-muted))" />
          <YAxis stroke="rgb(var(--color-muted))" tickFormatter={chartAxisTickFormatter} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Legend />
          <Bar dataKey="sap" fill="#60a5fa" name="SAP Revenue" />
          <Bar dataKey="simulated" fill="#43c6b8" name="Simulated Revenue" />
        </BarChart>
      </ResponsiveContainer>
    ),
  });
}

export function CostComparisonChart({ data }: { data: { name: string; sap: number; simulated: number }[] }) {
  return wrapChart({
    title: 'Actual Cost vs Forecast Cost',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line) / 0.35)" />
          <XAxis dataKey="name" stroke="rgb(var(--color-muted))" />
          <YAxis stroke="rgb(var(--color-muted))" tickFormatter={chartAxisTickFormatter} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Legend />
          <Line type="monotone" dataKey="sap" stroke="#f59e0b" name="SAP Actual Cost" />
          <Line type="monotone" dataKey="simulated" stroke="#43c6b8" name="Simulated Actual Cost" />
        </LineChart>
      </ResponsiveContainer>
    ),
  });
}

export function TopWbsChart({ data }: { data: { name: string; value: number }[] }) {
  return wrapChart({
    title: 'Top WBS by Recognized Revenue',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line) / 0.35)" />
          <XAxis type="number" stroke="rgb(var(--color-muted))" tickFormatter={chartAxisTickFormatter} />
          <YAxis dataKey="name" type="category" stroke="rgb(var(--color-muted))" width={160} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Bar dataKey="value" fill="#43c6b8">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ),
  });
}

export function ScrollableTopWbsChart({ data }: { data: { name: string; value: number }[] }) {
  const chartHeight = Math.max(360, data.length * 42);

  return wrapChart({
    title: 'All WBS by Recognized Revenue',
    className: 'xl:col-span-1',
    children: (
      <div className="h-full overflow-y-auto pr-2">
        <div style={{ height: chartHeight, minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line) / 0.35)" />
              <XAxis type="number" stroke="rgb(var(--color-muted))" tickFormatter={chartAxisTickFormatter} />
              <YAxis dataKey="name" type="category" stroke="rgb(var(--color-muted))" width={220} interval={0} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
              <Bar dataKey="value" fill="#43c6b8">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
  });
}

export function PendingChart({ data }: { data: { name: string; value: number }[] }) {
  return wrapChart({
    title: 'Top WBS with Pending Cost',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    ),
  });
}

export function RevenueSplitChart({
  recognized,
  remaining,
  total,
}: {
  recognized: number;
  remaining: number;
  total: number;
}) {
  const chartData = [
    { name: 'Revenue Recognised', value: Math.max(0, recognized) },
    { name: 'Revenue Remaining', value: Math.max(0, remaining) },
  ];
  const safeTotal = total > 0 ? total : chartData.reduce((sum, item) => sum + item.value, 0);

  return wrapChart({
    title: 'Recognized Revenue vs Remaining Revenue',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={92}
            innerRadius={58}
            paddingAngle={3}
            stroke="rgb(var(--color-panel))"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={index === 0 ? '#43c6b8' : '#f59e0b'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipStyle}
            itemStyle={chartLegendStyle}
            labelStyle={chartLegendStyle}
            formatter={(value: number, name: string) => {
              const percent = safeTotal > 0 ? (value / safeTotal) * 100 : 0;
              return [`${formatCompactCurrency(value)} (${formatPercent(percent)})`, name];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ color: 'rgb(var(--color-text))' }}
            formatter={(value) => <span className="text-sm text-text">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    ),
  });
}

export function PocChart({ data }: { data: { name: string; value: number }[] }) {
  return wrapChart({
    title: 'POC % by WBS',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-line) / 0.35)" />
          <XAxis dataKey="name" stroke="rgb(var(--color-muted))" />
          <YAxis stroke="rgb(var(--color-muted))" tickFormatter={chartAxisTickFormatter} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Bar dataKey="value" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    ),
  });
}

export function RiskChart({ data }: { data: { name: string; value: number }[] }) {
  return wrapChart({
    title: 'Risk Count by Type',
    children: (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    ),
  });
}
