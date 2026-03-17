"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Patient, Appointment, Clinic, Practitioner } from "@/types/database";

const AVERAGE_VISIT_FEE = 150;
const AT_RISK_DAYS = 30;
const HIGH_RISK_DAYS = 60;

export type AtRiskPatient = {
  patient: Patient;
  lastAppointment: Appointment;
  lastClinicName: string;
  lastPractitionerName: string;
  daysSinceLastVisit: number;
};

export function RetentionIntelligence({ clinicFilterId }: { clinicFilterId: string | null }) {
  const router = useRouter();
  const [atRisk, setAtRisk] = useState<AtRiskPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAtRisk = useCallback(async () => {
    const supabase = createClient();
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - AT_RISK_DAYS);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false });

    const { data: upcoming } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("status", "scheduled")
      .gte("appointment_date", now.toISOString());
    const hasUpcoming = new Set((upcoming ?? []).map((a: { patient_id: string }) => a.patient_id));

    const lastByPatient = new Map<string, Appointment>();
    (appointments ?? []).forEach((a: Appointment) => {
      if (a.status !== "completed" && a.status !== "no_show") return;
      if (hasUpcoming.has(a.patient_id)) return;
      const dt = new Date(a.appointment_date);
      if (dt >= cutoff) return;
      if (!lastByPatient.has(a.patient_id) || new Date(lastByPatient.get(a.patient_id)!.appointment_date) < dt) {
        lastByPatient.set(a.patient_id, a);
      }
    });

    const patientIds = Array.from(lastByPatient.keys());
    if (patientIds.length === 0) {
      setAtRisk([]);
      setLoading(false);
      return;
    }

    const { data: patients } = await supabase.from("patients").select("*").in("id", patientIds);
    const clinicIds = Array.from(new Set((appointments ?? []).map((a: Appointment) => a.clinic_id)));
    const practitionerIds = Array.from(new Set((appointments ?? []).map((a: Appointment) => a.practitioner_id)));
    const [clinicsRes, practitionersRes] = await Promise.all([
      supabase.from("clinics").select("id, name").in("id", clinicIds),
      supabase.from("practitioners").select("id, full_name").in("id", practitionerIds),
    ]);
    const clinicMap = new Map((clinicsRes.data ?? []).map((c: Clinic) => [c.id, c.name]));
    const practitionerMap = new Map((practitionersRes.data ?? []).map((p: Practitioner) => [p.id, p.full_name]));

    const list: AtRiskPatient[] = [];
    (patients ?? []).forEach((p: Patient) => {
      const last = lastByPatient.get(p.id);
      if (!last) return;
      if (clinicFilterId && last.clinic_id !== clinicFilterId) return;
      const days = Math.floor((now.getTime() - new Date(last.appointment_date).getTime()) / (1000 * 60 * 60 * 24));
      list.push({
        patient: p,
        lastAppointment: last,
        lastClinicName: clinicMap.get(last.clinic_id) ?? "Unknown",
        lastPractitionerName: practitionerMap.get(last.practitioner_id) ?? "Unknown",
        daysSinceLastVisit: days,
      });
    });
    list.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
    setAtRisk(list);
    setLoading(false);
  }, [clinicFilterId]);

  useEffect(() => {
    fetchAtRisk();
  }, [fetchAtRisk]);

  const atRiskRevenue = atRisk.length * AVERAGE_VISIT_FEE;

  const handleFollowUp = (row: AtRiskPatient) => {
    toast.success("Follow-up drafted", {
      description: `Drafted follow-up email for ${row.patient.full_name} based on last visit at ${row.lastClinicName}.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        Loading retention data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">At-risk patients</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {atRisk.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last visit &gt; {AT_RISK_DAYS} days ago, no upcoming appointment
            </p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
              At-risk revenue
            </p>
            <p className="text-xl font-bold tabular-nums text-amber-800 dark:text-amber-300">
              ${atRiskRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              ~${AVERAGE_VISIT_FEE}/visit × {atRisk.length} patients
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Action list</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            One-click re-engage with patients who haven’t returned
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Patient</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Last clinic</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Last practitioner</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Days since visit</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map((row) => (
                <tr
                  key={row.patient.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/patients/${row.patient.id}`)}
                      className="cursor-pointer font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {row.patient.full_name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.lastClinicName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.lastPractitionerName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.daysSinceLastVisit > HIGH_RISK_DAYS
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      }`}
                    >
                      {row.daysSinceLastVisit} days
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleFollowUp(row)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Generate follow-up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {atRisk.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Users className="mb-2 h-10 w-10 opacity-50" />
            <p>No at-risk patients in this view.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
