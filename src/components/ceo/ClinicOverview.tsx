"use client";

import { motion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";
import type { Clinic } from "@/types/database";

export function ClinicOverview({
  clinics,
  revenueByClinicToday,
}: {
  clinics: Clinic[];
  revenueByClinicToday: Map<string, number>;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Clinics overview
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          All branches · status & timezone
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/30">
        {clinics.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No clinics yet
          </li>
        ) : (
          clinics.map((clinic, i) => (
            <motion.li
              key={clinic.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                  <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {clinic.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{clinic.timezone}</span>
                    <span
                      className={`inline-flex rounded-full px-1.5 py-0.5 font-medium ${
                        clinic.status === "open"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {clinic.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Today</p>
                <p className="font-mono text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
                  ${(revenueByClinicToday.get(clinic.id) ?? 0).toLocaleString()}
                </p>
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
