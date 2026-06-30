"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Folder,
  BarChart3,
  Database,
  Calendar,
  LineChart,
  ArrowLeftRight,
  ShieldAlert,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/projects', label: 'Projects', icon: Folder },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/upload-cn41', label: 'Financial Sources', icon: Database },
      { href: '/pm-daily-updates', label: 'PM Daily Updates', icon: Calendar },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/simulation', label: 'Financial Performance', icon: LineChart },
      { href: '/sap-vs-simulation', label: 'Source Comparison', icon: ArrowLeftRight },
      { href: '/risk-alerts', label: 'Risk Alerts', icon: ShieldAlert },
      { href: '/comments', label: 'Comments', icon: MessageSquare },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  open,
  mobileOpen,
  onCloseMobile,
  userRole,
  userName,
}: {
  open: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userRole?: string | null;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const restrictedRoles = ['Project Manager', 'Viewer'];
  const isRestricted = userRole ? restrictedRoles.includes(userRole) : false;

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter out Settings for restricted roles
  const visibleSections = sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !(isRestricted && item.href === '/settings')),
  }));

  const userInitials = (userName || userRole || 'U')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 border-r border-line/45 bg-panel px-3.5 py-6 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out flex flex-col justify-between',
        open ? 'w-72' : 'w-[92px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="space-y-5">
        {/* Brand Header */}
        <div className={cn('px-1.5 flex items-center justify-between', !open && 'justify-center')}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-[15px] shadow-sm select-none">
              D
            </div>
            {open ? (
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold tracking-tight text-text font-sans">DETASAD</div>
                <div className="text-[10.5px] font-medium text-muted/75 leading-none mt-0.5 font-sans">Control Center</div>
              </div>
            ) : null}
          </div>
          {open && (
            <div className="flex h-5 w-5 items-center justify-center rounded text-muted/50 hover:bg-panel2 hover:text-text cursor-pointer transition">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Mock Search Bar */}
        {open && (
          <div className="px-0.5">
            <div className="flex items-center justify-between rounded-lg border border-line bg-panel2/10 px-3 py-1.8 text-muted/50 hover:bg-panel2/40 hover:border-line/80 transition cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted/50" />
                <span className="text-[12px] font-medium font-sans">Search...</span>
              </div>
              <span className="text-[10px] font-medium bg-panel border border-line px-1.5 py-0.5 rounded text-muted/55 shadow-sm font-sans">⌘K</span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-4 overflow-y-auto pr-0.5 scrollbar-thin max-h-[calc(100vh-230px)]">
          {visibleSections.map((section) => {
            const isCollapsed = collapsedSections[section.label];
            return (
              <div key={section.label} className="space-y-0.5 font-sans">
                {open ? (
                  <div
                    onClick={() => toggleSection(section.label)}
                    className="flex items-center justify-between px-2 py-1 text-muted/50 hover:text-text/75 text-[10px] font-bold tracking-wider uppercase select-none cursor-pointer transition"
                  >
                    <span>{section.label}</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted/40" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5 text-muted/40" />
                    )}
                  </div>
                ) : null}
                {!isCollapsed && (
                  <div className="space-y-0.5">
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
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition duration-150 relative mx-0.5',
                            open ? 'justify-start' : 'justify-center',
                            active
                              ? 'bg-panel2 text-text font-medium'
                              : 'text-muted hover:bg-panel2/50 hover:text-text'
                          )}
                        >
                          <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', active ? 'text-text' : 'text-muted/70 group-hover:text-text/90')} />
                          {open ? <span className="truncate tracking-wide font-sans">{item.label}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div
        className={cn(
          'rounded-2xl border border-line/45 bg-panel2/30 p-2.5 text-[11px] text-muted transition-all duration-200 hover:bg-panel2/60 flex items-center justify-between font-sans',
          !open && 'p-1 flex justify-center'
        )}
      >
        {open ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-accent text-white font-extrabold text-[12px] shadow-sm select-none border border-accent/10">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-text truncate leading-tight" title={userName || 'User'}>
                  {userName || 'User'}
                </div>
                <div className="text-[10.5px] font-medium text-muted/75 truncate mt-0.5 leading-none">
                  {userRole || 'Viewer'}
                </div>
              </div>
            </div>
            <button type="button" className="h-5 w-5 flex items-center justify-center rounded text-muted hover:bg-panel border-0 cursor-pointer transition shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div
            className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-accent text-white font-extrabold text-[12px] select-none shadow-sm border border-accent/10 cursor-pointer"
            title={`${userName || 'User'} (${userRole || 'Viewer'})`}
          >
            {userInitials}
          </div>
        )}
      </div>
    </aside>
  );
}
