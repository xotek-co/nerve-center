"use client";

import { motion } from "framer-motion";

type DayRow = { date: string; revenue: number; label: string };

export function RevenueTrend({ dailyRevenue }: { dailyRevenue: DayRow[] }) {
  const maxRev = Math.max(1, ...dailyRevenue.map((d) => d.revenue));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Revenue trend
      </h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        Last 7 days
      </p>
      <div className="mt-4 space-y-2">
        {dailyRevenue.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No data for the last 7 days
          </p>
        ) : (
          dailyRevenue.map((day, i) => (
            <div key={day.date} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                {day.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-6 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(day.revenue / maxRev) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="h-full rounded-md bg-emerald-500 dark:bg-emerald-600"
                  />
                </div>
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                ${day.revenue.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
