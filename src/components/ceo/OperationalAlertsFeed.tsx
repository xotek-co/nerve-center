"use client";

import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, Check } from "lucide-react";
import type { OperationalAlert } from "@/types/database";

const iconBySeverity = {
  critical: AlertTriangle,
  high: AlertCircle,
  low: Info,
};

const severityStyles = {
  critical:
    "border-red-200 bg-red-50/80 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse dark:border-red-900/50 dark:bg-red-950/50",
  high: "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30",
  low: "border-slate-200 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/50",
};

export function OperationalAlertsFeed({
  alerts,
  clinicNames,
  onResolve,
}: {
  alerts: OperationalAlert[];
  clinicNames: Map<string, string>;
  onResolve?: (alertId: string) => void;
}) {
  const unresolved = alerts.filter((a) => !a.resolved);
  const visible = unresolved.slice(0, 3);
  const remainingCount = Math.max(unresolved.length - visible.length, 0);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Operational Alerts
        </h2>
      </div>
      <div className="p-3">
        {unresolved.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No active alerts
          </p>
        ) : (
          <>
            <ul className="space-y-2">
            {visible.map((alert, i) => (
              <motion.li
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-lg border p-3 text-sm ${severityStyles[alert.severity]}`}
              >
                <div className="flex items-start gap-2">
                  {(() => {
                    const Icon = iconBySeverity[alert.severity];
                    return (
                      <Icon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          alert.severity === "critical"
                            ? "text-red-600 dark:text-red-400"
                            : alert.severity === "high"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-500"
                        }`}
                      />
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium capitalize text-slate-700 dark:text-slate-300">
                      {alert.severity}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      · {clinicNames.get(alert.clinic_id) ?? "Unknown"}
                    </span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {alert.message}
                    </p>
                    {onResolve && (
                      <button
                        type="button"
                        onClick={() => onResolve(alert.id)}
                        className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-200/80 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300/80 dark:bg-slate-600/50 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <Check className="h-3 w-3" />
                        Mark resolved
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
            </ul>
            {remainingCount > 0 && (
              <p className="mt-3 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {remainingCount} more alert{remainingCount === 1 ? "" : "s"} in the Reports tab.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
