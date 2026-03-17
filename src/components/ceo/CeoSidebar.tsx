"use client";

import Image from "next/image";
import { useEffect } from "react";
import {
  Activity,
  BookOpen,
  Users,
  TrendingDown,
  Database,
  X,
  type LucideIcon,
} from "lucide-react";

export type DashboardView = "operational" | "ledger" | "patients" | "retention" | "manage";

type NavItem = { id: DashboardView; label: string; icon: LucideIcon };

const OPERATIONS: NavItem[] = [
  { id: "operational", label: "Operational Pulse", icon: Activity },
  { id: "ledger", label: "Financial Ledger", icon: BookOpen },
];

const PATIENTS: NavItem[] = [
  { id: "patients", label: "Global Patient Hub", icon: Users },
  { id: "retention", label: "Revenue Recovery", icon: TrendingDown },
];

const DATA: NavItem[] = [
  { id: "manage", label: "Manage data", icon: Database },
];

function NavSection({
  title,
  items,
  view,
  onViewChange,
}: {
  title: string;
  items: NavItem[];
  view: DashboardView;
  onViewChange: (v: DashboardView) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-500/10 text-indigo-700 shadow-sm dark:bg-indigo-400/10 dark:text-indigo-300"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-slate-200"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CeoSidebar({
  view,
  onViewChange,
  mobileOpen = false,
  onMobileClose,
}: {
  view: DashboardView;
  onViewChange: (v: DashboardView) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  useEffect(() => {
    if (mobileOpen) {
      const handler = (e: KeyboardEvent) => e.key === "Escape" && onMobileClose?.();
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [mobileOpen, onMobileClose]);

  const handleSelect = (v: DashboardView) => {
    onViewChange(v);
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0">
            <Image
              src="/logo.png"
              alt="Nerve Center logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Nerve Center</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Command Center</p>
          </div>
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-3">
        <div className="flex flex-col gap-0.5 px-3">
          <NavSection title="Operations" items={OPERATIONS} view={view} onViewChange={handleSelect} />
          <NavSection title="Patients" items={PATIENTS} view={view} onViewChange={handleSelect} />
          <NavSection title="Data" items={DATA} view={view} onViewChange={handleSelect} />
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: sticky sidebar (non-scrollable, fixed height) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white dark:border-slate-700/80 dark:bg-slate-800/80 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile: overlay backdrop */}
      {mobileOpen && onMobileClose && (
        <div
          className="fixed inset-0 z-40 cursor-pointer bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === "Escape" && onMobileClose()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-800/80 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
