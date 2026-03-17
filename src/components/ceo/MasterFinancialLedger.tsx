"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { DailyFinancial } from "@/types/database";

export type LedgerRow = DailyFinancial & { clinic_name: string };

type EditingCell = { rowId: string; field: "gross_revenue" | "total_expenses" } | null;

function netProfit(row: DailyFinancial): number {
  return Number(row.gross_revenue) - Number(row.total_expenses);
}

function marginPct(row: DailyFinancial): number {
  const rev = Number(row.gross_revenue);
  if (rev <= 0) return 0;
  return (netProfit(row) / rev) * 100;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export type LedgerFilters = {
  dateFrom?: string;
  dateTo?: string;
  clinicId?: string | null;
};

export function MasterFinancialLedger({ filters }: { filters?: LedgerFilters }) {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingCell>(null);
  const [showReport, setShowReport] = useState(false);

  const filteredRows = useMemo(() => {
    if (!filters?.dateFrom && !filters?.dateTo && !filters?.clinicId) return rows;
    return rows.filter((r) => {
      if (filters.clinicId && r.clinic_id !== filters.clinicId) return false;
      if (filters.dateFrom && r.date < filters.dateFrom) return false;
      if (filters.dateTo && r.date > filters.dateTo) return false;
      return true;
    });
  }, [rows, filters]);

  const fetchLedger = useCallback(async () => {
    const supabase = createClient();
    const [finRes, clinicsRes] = await Promise.all([
      supabase
        .from("daily_financials")
        .select("*")
        .order("date", { ascending: false })
        .limit(1000),
      supabase.from("clinics").select("id, name"),
    ]);

    if (finRes.error || clinicsRes.error) {
      toast.error("Failed to load ledger");
      setLoading(false);
      return;
    }

    const clinicList = (clinicsRes.data ?? []) as { id: string; name: string }[];
    const clinicMap = new Map(clinicList.map((c) => [c.id, c.name]));
    const financials = (finRes.data ?? []) as DailyFinancial[];
    const ledger: LedgerRow[] = financials.map((r) => ({
      ...r,
      clinic_name: clinicMap.get(r.clinic_id) ?? "—",
    }));
    setRows(ledger);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const saveCell = useCallback(
    async (
      rowId: string,
      field: "gross_revenue" | "total_expenses",
      value: string
    ) => {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
      if (Number.isNaN(num) || num < 0) {
        toast.error("Enter a valid number");
        setEditing(null);
        return;
      }

      const supabase = createClient();
      const updatePayload =
        field === "gross_revenue"
          ? { gross_revenue: num, updated_at: new Date().toISOString() }
          : { total_expenses: num, updated_at: new Date().toISOString() };
      const fromTable = supabase.from("daily_financials") as unknown as {
        update: (p: typeof updatePayload) => { eq: (_col: string, _id: string) => Promise<{ error: Error | null }> };
      };
      const { error } = await fromTable.update(updatePayload).eq("id", rowId);

      if (error) {
        toast.error("Failed to save");
        setEditing(null);
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, [field]: num } : r
        )
      );
      toast.success("Saved");
      setEditing(null);
    },
    []
  );

  const handlePrint = useCallback(() => {
    requestAnimationFrame(() => window.print());
  }, []);

  const handleExportCsv = useCallback(() => {
    const headers = ["Clinic", "Date", "Gross Revenue", "Expenses", "Net Profit", "Margin %"];
    const rows = filteredRows.map((r) => [
      r.clinic_name,
      r.date,
      Number(r.gross_revenue),
      Number(r.total_expenses),
      netProfit(r),
      `${marginPct(r).toFixed(1)}%`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading ledger…
        </span>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-700/50">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Master Financial Ledger
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600/50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:border-slate-300/80 dark:border-slate-600/50 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Investor Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Clinic
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gross Revenue
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expenses
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Net Profit
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Margin %
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-slate-700/30 dark:hover:bg-slate-700/20"
                >
                  <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {row.clinic_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {row.date}
                  </td>
                  <EditableCell
                    rowId={row.id}
                    field="gross_revenue"
                    value={row.gross_revenue}
                    editing={editing}
                    onEdit={setEditing}
                    onBlur={saveCell}
                    format={formatCurrency}
                  />
                  <EditableCell
                    rowId={row.id}
                    field="total_expenses"
                    value={row.total_expenses}
                    editing={editing}
                    onEdit={setEditing}
                    onBlur={saveCell}
                    format={formatCurrency}
                  />
                  <td className="px-5 py-3 text-right font-mono text-sm tabular-nums">
                    <span
                      className={
                        netProfit(row) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {formatCurrency(netProfit(row))}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {formatPct(marginPct(row))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {rows.length === 0
              ? "No financial records yet. Add daily reports to see the ledger."
              : "No records match the current filters. Try a different date range or clinic."}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showReport && (
          <InvestorReportOverlay
            rows={filteredRows}
            onClose={() => setShowReport(false)}
            onPrint={handlePrint}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EditableCell({
  rowId,
  field,
  value,
  editing,
  onEdit,
  onBlur,
  format,
}: {
  rowId: string;
  field: "gross_revenue" | "total_expenses";
  value: number;
  editing: EditingCell;
  onEdit: (cell: EditingCell) => void;
  onBlur: (rowId: string, field: "gross_revenue" | "total_expenses", value: string) => void;
  format: (n: number) => string;
}) {
  const isEditing =
    editing?.rowId === rowId && editing?.field === field;
  const [localValue, setLocalValue] = useState(() => format(Number(value)));

  useEffect(() => {
    if (isEditing) setLocalValue(String(Number(value)));
    else setLocalValue(format(Number(value)));
  }, [isEditing, value, format]);

  if (isEditing) {
    return (
      <td className="px-5 py-2">
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onBlur(rowId, field, localValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-mono text-sm tabular-nums outline-none ring-2 ring-blue-500/30 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-400"
        />
      </td>
    );
  }

  return (
    <td
      role="button"
      tabIndex={0}
      onClick={() => onEdit({ rowId, field })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit({ rowId, field });
      }}
      className="cursor-pointer px-5 py-3 text-right font-mono text-sm tabular-nums text-slate-800 transition-colors hover:bg-slate-100/80 hover:rounded-md dark:text-slate-200 dark:hover:bg-slate-700/50"
    >
      {format(Number(value))}
    </td>
  );
}

function InvestorReportOverlay({
  rows,
  onClose,
  onPrint,
}: {
  rows: LedgerRow[];
  onClose: () => void;
  onPrint: () => void;
}) {
  const totalRevenue = rows.reduce((s, r) => s + Number(r.gross_revenue), 0);
  const totalExpenses = rows.reduce((s, r) => s + Number(r.total_expenses), 0);
  const totalNet = totalRevenue - totalExpenses;
  const overallMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      aria-label="Close"
    >
      <motion.div
        id="investor-report-print"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl cursor-default overflow-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/50 dark:bg-slate-800 print:max-h-none print:shadow-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800 print:static">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Investor Report — Financial Summary
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Generated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={onPrint}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600/50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/50 dark:bg-slate-700/20">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Expenses
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Profit · Margin
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalNet)} · {formatPct(overallMargin)}
              </p>
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Clinic
                </th>
                <th className="py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gross Revenue
                </th>
                <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expenses
                </th>
                <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Net Profit
                </th>
                <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Margin %
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-700/30"
                >
                  <td className="py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {row.clinic_name}
                  </td>
                  <td className="py-3 text-sm text-slate-600 dark:text-slate-400">
                    {row.date}
                  </td>
                  <td className="py-3 text-right font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(Number(row.gross_revenue))}
                  </td>
                  <td className="py-3 text-right font-mono text-sm tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(Number(row.total_expenses))}
                  </td>
                  <td className="py-3 text-right font-mono text-sm tabular-nums">
                    <span
                      className={
                        netProfit(row) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {formatCurrency(netProfit(row))}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {formatPct(marginPct(row))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
