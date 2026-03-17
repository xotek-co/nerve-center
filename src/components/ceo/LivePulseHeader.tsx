"use client";

import { motion } from "framer-motion";
import { Building2, DollarSign } from "lucide-react";
import type { Clinic } from "@/types/database";

export type BranchPulse = {
  clinic: Clinic;
  revenueToday: number;
  isLive: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06 },
  }),
};

export function LivePulseHeader({ branches }: { branches: BranchPulse[] }) {
  return (
    <div className="border-t border-slate-200/80 dark:border-slate-700/50">
      <div className="px-5 py-4">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          Live Pulse
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {branches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              No branches yet. Add clinics in Supabase to see them here.
            </p>
          ) : (
            branches.map((branch, i) => (
              <motion.div
                key={branch.clinic.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="flex min-w-[220px] shrink-0 items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {branch.clinic.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <LiveDot isLive={branch.isLive} />
                    <span>{branch.isLive ? "Live" : "Closed"}</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-900/20">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    {formatRevenue(branch.revenueToday)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LiveDot({ isLive }: { isLive: boolean }) {
  return (
    <motion.span
      className={`h-2 w-2 rounded-full ${
        isLive ? "bg-emerald-500" : "bg-red-500"
      }`}
      animate={{
        scale: isLive ? [1, 1.2, 1] : 1,
        opacity: isLive ? [1, 0.8, 1] : 1,
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    />
  );
}

function formatRevenue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}
