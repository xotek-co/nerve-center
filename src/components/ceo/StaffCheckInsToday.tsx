"use client";

import { motion } from "framer-motion";
import { UserCheck, Smile } from "lucide-react";
import type { StaffCheckIn } from "@/types/database";

function moodEmoji(score: number): string {
  if (score <= 1) return "😞";
  if (score <= 2) return "😐";
  if (score <= 3) return "🙂";
  if (score <= 4) return "😊";
  return "😄";
}

export function StaffCheckInsToday({
  checkIns,
  clinicNames,
}: {
  checkIns: StaffCheckIn[];
  clinicNames: Map<string, string>;
}) {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
  );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Staff check-ins today
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ul className="max-h-[200px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/30">
        {sorted.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No check-ins today
          </li>
        ) : (
          sorted.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50">
                  <UserCheck className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {clinicNames.get(c.clinic_id) ?? "Clinic"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(c.check_in_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                <Smile className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                  {c.mood_score}/5 {moodEmoji(c.mood_score)}
                </span>
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
