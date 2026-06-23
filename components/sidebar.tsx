import Link from 'next/link';
import { BarChart3, FileUp, FolderKanban, LayoutDashboard, ListChecks, ShieldAlert, Settings, UploadCloud, FileText, GitCompareArrows, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/upload-cn41', label: 'Financial Sources', icon: UploadCloud },
  { href: '/revenue-wbs', label: 'Revenue WBS', icon: BarChart3 },
  { href: '/cost-elements', label: 'Cost Elements', icon: SlidersHorizontal },
  { href: '/pm-daily-updates', label: 'PM Daily Updates', icon: ListChecks },
  { href: '/simulation', label: 'Financial Performance', icon: FileUp },
  { href: '/sap-vs-simulation', label: 'Source Comparison', icon: GitCompareArrows },
  { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert },
  { href: '/comments', label: 'Comments', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-line/70 bg-panel/85 p-5 transition-transform duration-300 ease-out backdrop-blur-xl',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 to-transparent p-4 shadow-glow">
        <div className="text-xs uppercase tracking-[0.3em] text-accent">Cost-to-Cost</div>
        <div className="mt-2 text-lg font-semibold text-text">Revenue Recognition Dashboard</div>
        <p className="mt-2 text-sm text-muted">Actual cost from GR55, planned cost from CN41, and planned revenue from sales orders.</p>
      </div>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition hover:bg-panel2/80 hover:text-text"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-line/60 bg-panel/75 p-3 text-sm text-muted">
        Roles supported: Admin, Cost Controller, Project Manager, Viewer.
      </div>
    </aside>
  );
}
