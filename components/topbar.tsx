"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, Search, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function Topbar({
  onToggleSidebar,
  sidebarOpen,
}: {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check local demo session
    const hasDemo = Boolean(window.localStorage.getItem('sap-cn41-demo-session'));
    if (hasDemo) {
      setIsLoggedIn(true);
      return;
    }

    // Check if Supabase configured
    const isSupabaseConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      Boolean(
        window.localStorage.getItem('sap-cn41-supabase-url') &&
          window.localStorage.getItem('sap-cn41-supabase-anon-key')
      );

    if (isSupabaseConfigured) {
      try {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getSession().then(({ data }) => {
          setIsLoggedIn(Boolean(data?.session));
        });
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line/70 bg-panel/55 px-4 py-3 backdrop-blur-xl md:px-5 md:py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-xl border border-line/70 bg-panel/70 p-2 text-text hover:bg-panel2/80 lg:hidden"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="rounded-2xl bg-accent/15 px-3 py-2 text-accent">C2C</div>
        <div>
          <div className="text-sm font-medium text-text">Cost-to-Cost Revenue Recognition</div>
          <div className="text-xs text-muted">GR55 actual cost, CN41 planned cost, and sales order revenue</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-line/70 bg-panel/70 px-4 py-2 text-sm text-muted md:flex">
          <Search className="h-4 w-4" />
          Search projects, WBS, or risks
        </div>
        <ThemeToggle />
        <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/55 px-4 py-2 text-sm text-text hover:bg-panel2/80">
          <LogOut className="h-4 w-4" />
          {isLoggedIn ? 'Log Out' : 'Login'}
        </Link>
      </div>
    </header>
  );
}
