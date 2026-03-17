"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, DollarSign, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function TotalGroupHealth({
  revenueToday,
  clinicFilterId,
}: {
  revenueToday: number;
  clinicFilterId: string | null;
}) {
  const [retentionRate, setRetentionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("patient_id, appointment_date, status, clinic_id");
      if (cancelled || !appointments?.length) {
        setRetentionRate(null);
        setLoading(false);
        return;
      }

      let filtered = appointments as { patient_id: string; appointment_date: string; status: string; clinic_id: string }[];
      if (clinicFilterId) {
        filtered = filtered.filter((a) => a.clinic_id === clinicFilterId);
      }
      const uniquePatients = new Set(filtered.map((a) => a.patient_id));
      const total = uniquePatients.size;
      const active = new Set<string>();
      filtered.forEach((a) => {
        const d = new Date(a.appointment_date);
        if (a.status === "scheduled" && d >= now) active.add(a.patient_id);
        else if ((a.status === "completed" || a.status === "no_show") && d >= thirtyDaysAgo) active.add(a.patient_id);
      });
      const rate = total > 0 ? Math.round((active.size / total) * 100) : null;
      if (!cancelled) {
        setRetentionRate(rate);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [clinicFilterId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 items-center gap-4 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-indigo-50/40 px-4 py-2.5 dark:border-slate-700/80 dark:from-slate-800 dark:to-indigo-900/20"
    >
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Heart className="h-4 w-4 text-indigo-500" />
        <span className="text-xs font-semibold uppercase tracking-wider">Group Health</span>
      </div>
      <div className="flex items-center gap-4 border-l border-slate-200 pl-4 dark:border-slate-600">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
            ${revenueToday.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {loading ? "—" : retentionRate != null ? `${retentionRate}%` : "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">retention</span>
        </div>
      </div>
    </motion.div>
  );
}
