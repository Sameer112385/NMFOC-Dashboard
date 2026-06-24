"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  FileUp,
  FolderKanban,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/upload-cn41', label: 'Financial Sources', icon: UploadCloud },
      { href: '/pm-daily-updates', label: 'PM Daily Updates', icon: ListChecks },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/simulation', label: 'Financial Performance', icon: FileUp },
      { href: '/sap-vs-simulation', label: 'Source Comparison', icon: GitCompareArrows },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert },
      { href: '/comments', label: 'Comments', icon: MessageSquare },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar({ open, mobileOpen, onCloseMobile, userRole }: { open: boolean; mobileOpen: boolean; onCloseMobile: () => void; userRole?: string | null }) {
  const pathname = usePathname();
  const restrictedRoles = ['Project Manager', 'Viewer'];
  const isRestricted = userRole ? restrictedRoles.includes(userRole) : false;

  // Filter out Settings for restricted roles
  const visibleSections = sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !(isRestricted && item.href === '/settings')),
  }));

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 border-r border-line/50 bg-panel/95 px-4 py-6 shadow-panel backdrop-blur-xl transition-all duration-300 ease-out flex flex-col justify-between', open ? 'w-72' : 'w-[92px]', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
      <div className="space-y-6">
        {/* Brand Header */}
        <div className={cn('rounded-2xl bg-gradient-to-br from-accent/5 to-accent/15 border border-accent/10 p-4 transition-all', !open && 'p-2 flex justify-center')}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-glow">
              <BarChart3 className="h-5 w-5" />
            </div>
            {open ? (
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">DETASAD</div>
                <div className="text-sm font-bold tracking-tight text-text truncate">Control Center</div>
              </div>
            ) : null}
          </div>
          {open ? <p className="mt-3 text-[11px] leading-relaxed text-muted font-medium">Enterprise financial control and cost-to-cost simulation.</p> : null}
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-6 overflow-y-auto pr-1">
          {visibleSections.map((section) => (
            <div key={section.label} className="space-y-2">
              {open ? <div className="section-kicker px-2 text-muted/65 font-bold tracking-[0.15em]">{section.label}</div> : null}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={!open ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition duration-150 relative',
                        open ? 'justify-start' : 'justify-center',
                        active
                          ? 'bg-accent/10 text-accent'
                          : 'text-muted hover:bg-panel2/80 hover:text-text'
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-accent" />
                      )}
                      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', active ? 'text-accent' : 'text-muted/80 group-hover:text-text')}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      {open ? <span className="truncate tracking-wide">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Role Footer */}
      <div className={cn('rounded-2xl border border-line/40 bg-panel2/50 p-4 text-[11px] text-muted', !open && 'p-2 flex justify-center')}>
        {open ? (
          <div className="space-y-1 font-medium">
            <div className="section-kicker text-muted/80 font-bold">Signed In As</div>
            <div className="leading-relaxed">
              {userRole ?? 'Viewer'}
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-accent" title={`Role: ${userRole ?? 'Viewer'}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        )}
      </div>
    </aside>
  );
}
