"use client";

import { motion } from "framer-motion";
import { Building2, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

const cardConfig = [
  {
    key: "clinics",
    label: "Total clinics",
    icon: Building2,
    value: (v: number) => v.toString(),
    className: "text-slate-700 dark:text-slate-300",
  },
  {
    key: "open",
    label: "Open today",
    icon: TrendingUp,
    value: (v: number) => v.toString(),
    className: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "revenue",
    label: "Revenue today",
    icon: DollarSign,
    value: (v: number) =>
      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${v.toLocaleString()}`,
    className: "text-slate-800 dark:text-slate-200",
  },
  {
    key: "alerts",
    label: "Unresolved alerts",
    icon: AlertTriangle,
    value: (v: number) => v.toString(),
    className: (v: number) => (v > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"),
  },
];

export function KpiCards({
  totalClinics,
  openToday,
  revenueToday,
  unresolvedAlerts,
}: {
  totalClinics: number;
  openToday: number;
  revenueToday: number;
  unresolvedAlerts: number;
}) {
  const values = {
    clinics: totalClinics,
    open: openToday,
    revenue: revenueToday,
    alerts: unresolvedAlerts,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cardConfig.map((config, i) => {
        const Icon = config.icon;
        const val = values[config.key as keyof typeof values];
        const valueClass =
          typeof config.className === "function" ? config.className(val) : config.className;
        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {config.label}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <p className={`mt-3 text-2xl font-bold tabular-nums ${valueClass}`}>
              {config.value(val)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
