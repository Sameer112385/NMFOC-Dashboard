"use client";

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sap-cn41-sidebar-open';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setSidebarOpen(saved === 'true');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} />

      <div
        className={cn(
          'min-h-screen transition-[margin-left] duration-300 ease-out',
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-0',
        )}
      >
        <Topbar
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen((value) => !value)}
        className={cn(
          'fixed left-3 top-3 z-50 inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/80 px-3 py-2 text-xs text-text backdrop-blur-xl hover:bg-panel2/80 lg:top-4',
          sidebarOpen ? 'lg:left-[17rem]' : 'lg:left-3',
        )}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="hidden sm:inline">{sidebarOpen ? 'Collapse' : 'Open'} menu</span>
        <Menu className="h-4 w-4 sm:hidden" />
      </button>
    </div>
  );
}
