"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, MessageSquare } from "lucide-react";
import type { DailyFinancial } from "@/types/database";

export type ReportWithMood = DailyFinancial & {
  clinic_name: string;
  avg_mood?: number;
};

export function DailyReportCard({
  report,
  expandedId,
  onToggle,
  layoutIdPrefix,
}: {
  report: ReportWithMood;
  expandedId: string | null;
  onToggle: (id: string) => void;
  layoutIdPrefix: string;
}) {
  const isExpanded = expandedId === report.id;
  const summary =
    report.manager_notes?.slice(0, 80) +
    (report.manager_notes && report.manager_notes.length > 80 ? "…" : "");

  return (
    <motion.article
      layout
      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={() => onToggle(report.id)}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
      >
        <motion.div
          layoutId={`${layoutIdPrefix}-icon-${report.id}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50"
        >
          <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {report.clinic_name} · {report.date}
            </span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </motion.span>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
            {report.manager_notes ? summary : "No notes"}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Revenue: ${Number(report.gross_revenue).toLocaleString()}</span>
            {report.avg_mood != null && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Mood: {report.avg_mood.toFixed(1)}/5
              </span>
            )}
          </div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-slate-200/80 dark:border-slate-700/50"
          >
            <div className="space-y-3 p-4 pt-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Manager notes
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {report.manager_notes || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                  Cash: ${Number(report.cash_collected).toLocaleString()}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                  Card: ${Number(report.card_collected).toLocaleString()}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                  Insurance: ${Number(report.insurance_claims).toLocaleString()}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                  Expenses: ${Number(report.total_expenses).toLocaleString()}
                </span>
                {report.avg_mood != null && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/50">
                    Staff mood: {report.avg_mood.toFixed(1)}/5
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
