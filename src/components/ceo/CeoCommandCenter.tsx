"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeAllDailyFinancials } from "@/lib/supabase/realtime";
import type { Clinic, DailyFinancial, OperationalAlert, StaffCheckIn } from "@/types/database";
import { LivePulseHeader, type BranchPulse } from "./LivePulseHeader";
import { RevenueGauge } from "./RevenueGauge";
import { OperationalAlertsFeed } from "./OperationalAlertsFeed";
import { MasterFinancialLedger, type LedgerFilters } from "./MasterFinancialLedger";
import { DailyReportCard, type ReportWithMood } from "./DailyReportCard";
import { KpiCards } from "./KpiCards";
import { ClinicOverview } from "./ClinicOverview";
import { RevenueTrend } from "./RevenueTrend";
import { StaffCheckInsToday } from "./StaffCheckInsToday";
import { CeoSidebar, type DashboardView } from "./CeoSidebar";
import { TotalGroupHealth } from "./TotalGroupHealth";
import { GlobalPatientSearch } from "@/components/patients/GlobalPatientSearch";
import { RetentionIntelligence } from "@/components/patients/RetentionIntelligence";
import { ManageData } from "./ManageData";
import { Select } from "@/components/ui/Select";
import { Filter, Menu } from "lucide-react";

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const REVENUE_TARGET = 50000;
const PAGE_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};
const CHILD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

type OperationalTab = "overview" | "financials" | "reports";

export function CeoCommandCenter() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [dailyFinancials, setDailyFinancials] = useState<DailyFinancial[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [staffCheckIns, setStaffCheckIns] = useState<StaffCheckIn[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");
  const [clinicFilterId, setClinicFilterId] = useState<string | null>(null);
  const [view, setView] = useState<DashboardView>("operational");
  const [dataError, setDataError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [operationalTab, setOperationalTab] = useState<OperationalTab>("overview");
  const [logoutOpen, setLogoutOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const clinicMap = new Map(clinics.map((c) => [c.id, c.name]));
  const clinicMapRef = useRef(clinicMap);
  clinicMapRef.current = clinicMap;

  const branchPulses: BranchPulse[] = clinics.map((clinic) => {
    const todayFin = dailyFinancials.find(
      (f) => f.clinic_id === clinic.id && f.date === today
    );
    return {
      clinic,
      revenueToday: todayFin?.gross_revenue ?? 0,
      isLive: clinic.status === "open",
    };
  });

  const totalRevenueToday = dailyFinancials
    .filter((f) => f.date === today)
    .reduce((sum, f) => sum + Number(f.gross_revenue), 0);

  const revenueByClinicToday = useMemo(() => {
    const m = new Map<string, number>();
    dailyFinancials
      .filter((f) => f.date === today)
      .forEach((f) => m.set(f.clinic_id, (m.get(f.clinic_id) ?? 0) + Number(f.gross_revenue)));
    return m;
  }, [dailyFinancials, today]);

  const last7DaysRevenue = useMemo(() => {
    const days: { date: string; revenue: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const rev = dailyFinancials
        .filter((f) => f.date === dateStr)
        .reduce((s, f) => s + Number(f.gross_revenue), 0);
      days.push({
        date: dateStr,
        revenue: rev,
        label: i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }
    return days;
  }, [dailyFinancials]);

  const staffCheckInsToday = useMemo(
    () => staffCheckIns.filter((c) => c.check_in_time.startsWith(today)),
    [staffCheckIns, today]
  );

  const ledgerFilters: LedgerFilters = useMemo(() => {
    const to = today;
    let dateFrom: string | undefined;
    if (dateRange === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (dateRange === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      dateFrom = d.toISOString().slice(0, 10);
    }
    return {
      dateFrom,
      dateTo: dateRange === "all" ? undefined : to,
      clinicId: clinicFilterId,
    };
  }, [dateRange, clinicFilterId, today]);

  const reportsWithMood: ReportWithMood[] = dailyFinancials
    .slice()
    .filter((r) => {
      if (clinicFilterId && r.clinic_id !== clinicFilterId) return false;
      if (dateRange === "7d") {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        if (r.date < from.toISOString().slice(0, 10)) return false;
      } else if (dateRange === "30d") {
        const from = new Date();
        from.setDate(from.getDate() - 29);
        if (r.date < from.toISOString().slice(0, 10)) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 50)
    .map((r) => {
      const moodEntries = staffCheckIns.filter(
        (s) =>
          s.clinic_id === r.clinic_id &&
          s.check_in_time.startsWith(r.date)
      );
      const avgMood =
        moodEntries.length > 0
          ? moodEntries.reduce((s, e) => s + e.mood_score, 0) / moodEntries.length
          : undefined;
      return {
        ...r,
        clinic_name: clinicMap.get(r.clinic_id) ?? "Unknown",
        avg_mood: avgMood,
      };
    });

  const fetchData = useCallback(async () => {
    setDataError(null);
    try {
      const supabase = createClient();
      const [clinicsRes, financialsRes, alertsRes, checkInsRes] = await Promise.all([
        supabase.from("clinics").select("*").order("name"),
        supabase
          .from("daily_financials")
          .select("*")
          .order("date", { ascending: false })
          .limit(500),
        supabase.from("operational_alerts").select("*").order("created_at", { ascending: false }),
        supabase.from("staff_check_ins").select("*").order("check_in_time", { ascending: false }).limit(500),
      ]);

      if (clinicsRes.data) setClinics(clinicsRes.data);
      if (financialsRes.data) setDailyFinancials(financialsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (checkInsRes.data) setStaffCheckIns(checkInsRes.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setDataError(msg.includes("Supabase") || msg.includes("env") ? "Missing Supabase URL or key. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local" : msg);
      toast.error("Could not load dashboard data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => {
        if (!r.ok) router.replace("/");
        else setAuthChecked(true);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetchData();
  }, [authChecked, fetchData]);

  useEffect(() => {
    const channel = subscribeAllDailyFinancials((newReport) => {
      setDailyFinancials((prev) => [newReport, ...prev]);
      const name = clinicMapRef.current.get(newReport.clinic_id) ?? "A branch";
      toast.success("New EOD report submitted", {
        description: `${name} · ${newReport.date}`,
      });
    });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("operational_alerts") as unknown as {
      update: (p: { resolved: boolean; updated_at: string }) => { eq: (k: string, v: string) => Promise<{ error: Error | null }> };
    })
      .update({ resolved: true, updated_at: new Date().toISOString() })
      .eq("id", alertId);
    if (error) {
      toast.error("Failed to resolve");
      return;
    }
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
    toast.success("Alert marked resolved");
  }, []);

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          {!authChecked ? "Checking access…" : "Loading Command Center…"}
        </motion.div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium text-amber-800 dark:text-amber-200">Could not load dashboard</p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{dataError}</p>
          <button
            type="button"
            onClick={() => { setDataError(null); setLoading(true); fetchData(); }}
            className="mt-4 cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex min-h-screen bg-slate-50 dark:bg-slate-900"
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      <CeoSidebar
        view={view}
        onViewChange={setView}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 dark:border-slate-700/80 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:hidden dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Select
                value={clinicFilterId ?? ""}
                onChange={(v) => setClinicFilterId(v || null)}
                options={[
                  { value: "", label: "All clinics" },
                  ...clinics.map((c) => ({ value: c.id, label: c.name })),
                ]}
                title="Filter by clinic"
                aria-label="Filter by clinic"
                className="min-w-[160px]"
              />
            </div>
            <div className="min-w-0 max-w-[200px] flex-1 sm:max-w-[280px]">
              <GlobalPatientSearch
                clinicNames={clinicMap}
                clinicFilterId={clinicFilterId}
              />
            </div>
            <TotalGroupHealth revenueToday={totalRevenueToday} clinicFilterId={clinicFilterId} />
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
          <LivePulseHeader branches={branchPulses} />
        </header>

        {logoutOpen && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <h2
                id="logout-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Sign out of Nerve Center?
              </h2>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Your current session will end and you&apos;ll be returned to the secure sign‑in
                screen.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLogoutOpen(false)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Stay here
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    setLogoutOpen(false);
                    router.push("/");
                    router.refresh();
                  }}
                  className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                >
                  Yes, log out
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5 sm:py-6">
          {view === "operational" && (
            <>
              <motion.div
                className="mb-6 flex flex-wrap items-center justify-between gap-4"
                variants={CHILD_VARIANTS}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10">
                    <LayoutDashboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Operational Pulse
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Live overview of your group performance
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 rounded-full bg-slate-100/70 p-1 text-xs font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                  {[
                    { id: "overview", label: "Snapshot" },
                    { id: "financials", label: "Financials" },
                    { id: "reports", label: "Reports" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOperationalTab(tab.id as OperationalTab)}
                      className={`cursor-pointer rounded-full px-3 py-1 transition ${
                        operationalTab === tab.id
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </motion.div>
              {operationalTab === "overview" && (
                <>
                  <motion.section className="mb-6" variants={CHILD_VARIANTS}>
                    <KpiCards
                      totalClinics={clinics.length}
                      openToday={clinics.filter((c) => c.status === "open").length}
                      revenueToday={totalRevenueToday}
                      unresolvedAlerts={alerts.filter((a) => !a.resolved).length}
                    />
                  </motion.section>
                  <section className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <motion.div variants={CHILD_VARIANTS}>
                      <RevenueGauge
                        revenue={totalRevenueToday}
                        target={REVENUE_TARGET}
                        label="Revenue vs Target (today)"
                      />
                    </motion.div>
                    <motion.div variants={CHILD_VARIANTS}>
                      <OperationalAlertsFeed
                        alerts={alerts}
                        clinicNames={clinicMap}
                        onResolve={handleResolveAlert}
                      />
                    </motion.div>
                    <motion.div className="sm:col-span-2 lg:col-span-1" variants={CHILD_VARIANTS}>
                      <RevenueTrend dailyRevenue={last7DaysRevenue} />
                    </motion.div>
                    <motion.div className="lg:col-span-3" variants={CHILD_VARIANTS}>
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Executive insights
                        </p>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Top clinic today
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              By gross revenue
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {(() => {
                                if (revenueByClinicToday.size === 0) return "No data yet";
                                let bestId: string | null = null;
                                let bestValue = -Infinity;
                                for (const [id, value] of revenueByClinicToday.entries()) {
                                  if (value > bestValue) {
                                    bestValue = value;
                                    bestId = id;
                                  }
                                }
                                const name = bestId ? clinicMap.get(bestId) ?? "Unknown clinic" : "Unknown clinic";
                                return `${name}`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Team mood today
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Average staff mood score
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {staffCheckInsToday.length === 0
                                ? "No check-ins"
                                : (
                                    staffCheckInsToday.reduce((s, e) => s + e.mood_score, 0) /
                                    staffCheckInsToday.length
                                  ).toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Hotspot clinic
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Most unresolved alerts
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {(() => {
                                const unresolved = alerts.filter((a) => !a.resolved);
                                if (unresolved.length === 0) return "No active alerts";
                                const counts = new Map<string, number>();
                                for (const a of unresolved) {
                                  counts.set(a.clinic_id, (counts.get(a.clinic_id) ?? 0) + 1);
                                }
                                let worstId: string | null = null;
                                let worstCount = -Infinity;
                                for (const [id, count] of counts.entries()) {
                                  if (count > worstCount) {
                                    worstCount = count;
                                    worstId = id;
                                  }
                                }
                                const name = worstId ? clinicMap.get(worstId) ?? "Unknown clinic" : "Unknown clinic";
                                return `${name}`;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </section>
                  <section className="mb-8 grid gap-6 sm:grid-cols-2">
                    <motion.div variants={CHILD_VARIANTS}>
                      <ClinicOverview
                        clinics={clinics}
                        revenueByClinicToday={revenueByClinicToday}
                      />
                    </motion.div>
                    <motion.div variants={CHILD_VARIANTS}>
                      <StaffCheckInsToday checkIns={staffCheckInsToday} clinicNames={clinicMap} />
                    </motion.div>
                  </section>
                </>
              )}

              {operationalTab === "financials" && (
                <>
                  <motion.section className="mb-4 flex flex-wrap items-center gap-4" variants={CHILD_VARIANTS}>
                    <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Date range:</span>
                    <Select
                      value={dateRange}
                      onChange={(v) => setDateRange(v as "7d" | "30d" | "all")}
                      options={DATE_RANGE_OPTIONS}
                      className="min-w-[140px]"
                    />
                  </motion.section>
                  <motion.section className="mb-8" variants={CHILD_VARIANTS}>
                    <MasterFinancialLedger filters={ledgerFilters} />
                  </motion.section>
                </>
              )}

              {operationalTab === "reports" && (
                <section>
                  <motion.h2
                    className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    variants={CHILD_VARIANTS}
                  >
                    WhatsApp Killer — Daily Reports
                  </motion.h2>
                  <ul className="space-y-3">
                    {reportsWithMood.map((report) => (
                      <li key={report.id}>
                        <DailyReportCard
                          report={report}
                          expandedId={expandedReportId}
                          onToggle={(id) =>
                            setExpandedReportId((prev) => (prev === id ? null : id))
                          }
                          layoutIdPrefix="ceo-report"
                        />
                      </li>
                    ))}
                  </ul>
                  {reportsWithMood.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                      No daily reports yet
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          {view === "ledger" && (
            <>
              <motion.div className="mb-6" variants={CHILD_VARIANTS}>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Financial Ledger
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Inline edit and export
                </p>
              </motion.div>
              <motion.section className="mb-4 flex flex-wrap items-center gap-4" variants={CHILD_VARIANTS}>
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Date range:</span>
                <Select
                  value={dateRange}
                  onChange={(v) => setDateRange(v as "7d" | "30d" | "all")}
                  options={DATE_RANGE_OPTIONS}
                  className="min-w-[140px]"
                />
              </motion.section>
              <motion.section variants={CHILD_VARIANTS}>
                <MasterFinancialLedger filters={ledgerFilters} />
              </motion.section>
            </>
          )}

          {view === "patients" && (
            <motion.div variants={CHILD_VARIANTS} className="mx-auto max-w-2xl">
              <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-200">
                Global Patient Hub
              </h1>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Search any patient across all branches. Select a result to open their profile and timeline.
              </p>
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <GlobalPatientSearch
                  clinicNames={clinicMap}
                  clinicFilterId={clinicFilterId}
                  className="max-w-full"
                />
                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Results show &quot;Seen at&quot; branch history. Use the clinic filter above to limit by branch.
                </p>
              </div>
            </motion.div>
          )}

          {view === "retention" && (
            <motion.div variants={CHILD_VARIANTS}>
              <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-200">
                Revenue Recovery
              </h1>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Patients with last visit &gt; 30 days ago and no upcoming appointment.
              </p>
              <RetentionIntelligence clinicFilterId={clinicFilterId} />
            </motion.div>
          )}

          {view === "manage" && (
            <motion.div variants={CHILD_VARIANTS}>
              <ManageData />
            </motion.div>
          )}
        </main>
      </div>
    </motion.div>
  );
}
