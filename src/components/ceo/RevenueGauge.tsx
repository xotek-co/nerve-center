"use client";

import { motion } from "framer-motion";

const SIZE = 140;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function RevenueGauge({
  revenue,
  target,
  label = "Revenue vs Target",
}: {
  revenue: number;
  target: number;
  label?: string;
}) {
  const ratio = target > 0 ? Math.min(revenue / target, 1) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - ratio);

  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <span className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-slate-200 dark:text-slate-600"
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="text-emerald-500"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-slate-800 dark:text-slate-200">
            {target > 0 ? Math.round((ratio * 100)) : 0}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            of target
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        ${revenue.toLocaleString()} / ${target.toLocaleString()}
      </p>
    </div>
  );
}
