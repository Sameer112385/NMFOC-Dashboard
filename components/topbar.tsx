"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Download, LogOut, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function Topbar({
  onOpenMobile,
  sidebarOpen,
}: {
  onOpenMobile: () => void;
  sidebarOpen: boolean;
}) {
  const pathname = usePathname() ?? '';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasDemo = Boolean(window.localStorage.getItem('sap-cn41-demo-session'));
    if (hasDemo) {
      setIsLoggedIn(true);
      return;
      }

    const isSupabaseConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      Boolean(
        window.localStorage.getItem('sap-cn41-supabase-url') &&
          window.localStorage.getItem('sap-cn41-supabase-anon-key')
      );

    if (isSupabaseConfigured) {
      try {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getSession()
          .then(({ data }) => setIsLoggedIn(Boolean(data?.session)))
          .catch(() => {});
      } catch {
        // ignore
      }
    }
  }, []);

  let moduleName = "Dashboard";
  if (pathname.startsWith('/projects')) {
    moduleName = "Projects";
  } else if (pathname.startsWith('/reports')) {
    moduleName = "Reports";
  } else if (pathname.startsWith('/upload-cn41')) {
    moduleName = "Financial Sources";
  } else if (pathname.startsWith('/pm-daily-updates')) {
    moduleName = "PM Daily Updates";
  } else if (pathname.startsWith('/simulation')) {
    moduleName = "Financial Performance";
  } else if (pathname.startsWith('/sap-vs-simulation')) {
    moduleName = "Source Comparison";
  } else if (pathname.startsWith('/risk-alerts')) {
    moduleName = "Risk Alerts";
  } else if (pathname.startsWith('/comments')) {
    moduleName = "Comments";
  } else if (pathname.startsWith('/settings')) {
    moduleName = "Settings";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/40 bg-bg/80 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onOpenMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line/80 bg-panel shadow-sm lg:hidden hover:bg-panel2"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="text-[16px] font-extrabold tracking-tight text-text">{moduleName}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 rounded-xl border border-line/60 bg-panel px-4 py-2 text-xs text-muted/70 xl:flex w-72 transition hover:border-line hover:bg-panel/90 shadow-sm cursor-text">
            <Search className="h-3.5 w-3.5 text-muted/50" />
            <span>Search WBS, risks, uploads...</span>
          </div>
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-line/60 bg-panel text-muted/70 hover:text-text md:inline-flex hover:bg-panel2 transition shadow-sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-line/60 bg-panel text-muted/70 hover:text-text md:inline-flex hover:bg-panel2 transition shadow-sm" aria-label="Export">
            <Download className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-line/60 bg-panel px-4 py-2 text-xs font-semibold text-text hover:border-accent hover:text-accent hover:bg-accent/5 transition shadow-sm">
            <LogOut className="h-3.5 w-3.5" />
            {isLoggedIn ? 'Log Out' : 'Login'}
          </Link>
        </div>
      </div>
    </header>
  );
}

