import { cn, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import type { ReactNode } from 'react';

export function PageShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, value, hint, tone = 'default' }: {
  title: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'warning' | 'danger' | 'success';
}) {
  const valueLength = value.replace(/\s+/g, '').length;
  const toneClass = {
    default: 'border-line/70 bg-panel/75',
    accent: 'border-accent/35 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent shadow-glow',
    warning: 'border-warning/35 bg-gradient-to-br from-warning/18 via-warning/10 to-transparent',
    danger: 'border-danger/35 bg-gradient-to-br from-danger/18 via-danger/10 to-transparent',
    success: 'border-success/35 bg-gradient-to-br from-success/18 via-success/10 to-transparent',
  }[tone];
  const valueClass =
    valueLength > 18
      ? 'text-[clamp(0.85rem,1.1vw,1.05rem)]'
      : valueLength > 14
        ? 'text-[clamp(0.95rem,1.25vw,1.2rem)]'
        : valueLength > 10
          ? 'text-[clamp(1rem,1.5vw,1.35rem)]'
          : 'text-[clamp(1.1rem,1.8vw,1.45rem)]';

  return (
    <div className={cn('surface-card min-w-0 px-3 py-2.5 sm:px-3.5 sm:py-3', toneClass)}>
      <div className="truncate text-[10px] uppercase tracking-[0.14em] text-muted">{title}</div>
      <div className={cn('mt-1.5 whitespace-nowrap text-right font-semibold leading-none tracking-tight text-text', valueClass)}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent' }) {
  const styles = {
    default: 'bg-panel/75 text-text border-line/70',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
  }[tone];

  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', styles)}>{children}</span>;
}

export function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/20 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn("font-medium text-text", valueClass)}>{value}</span>
    </div>
  );
}

export function MetricGrid({ items }: { items: { label: string; value: number; kind?: 'currency' | 'number' | 'percent' }[] }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
      {items.map((item) => (
        <div key={item.label} className="surface-card min-w-0 p-3">
          <div className="truncate text-[10px] uppercase tracking-[0.14em] text-muted">{item.label}</div>
          <div className="mt-1.5 whitespace-nowrap text-right text-[clamp(0.95rem,1.45vw,1.25rem)] font-semibold leading-none text-text">
            {item.kind === 'currency'
              ? formatCurrency(item.value)
              : item.kind === 'percent'
                ? formatPercent(item.value)
                : formatNumber(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="surface-card p-10 text-center">
      <div className="text-lg font-semibold text-text">{title}</div>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export const surfaceCard = 'surface-card rounded-2xl';
