"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, DollarSign, Mail, Phone, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Patient, Appointment, ClinicalNote, Practitioner } from "@/types/database";
import { PatientTimeline } from "./PatientTimeline";
import { SoapSheet } from "./SoapSheet";
import { DigitalVaultTab } from "./DigitalVaultTab";

export type AppointmentWithDetails = Appointment & {
  clinic_name: string;
  practitioner_name: string;
  clinic_color: string;
};
export type ClinicalNoteWithAppointment = ClinicalNote & { appointment_date?: string };

const CLINIC_COLORS = [
  "border-l-indigo-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-violet-500",
  "border-l-sky-500",
];

export function PatientProfile({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [notes, setNotes] = useState<ClinicalNoteWithAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "vault">("timeline");
  const [sheetAppointment, setSheetAppointment] = useState<AppointmentWithDetails | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [patientRes, appointmentsRes, notesRes, clinicsRes, practitionersRes] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).single(),
      supabase.from("appointments").select("*").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
      supabase.from("clinical_notes").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("clinics").select("id, name"),
      supabase.from("practitioners").select("id, full_name, clinic_id"),
    ]);

    const patientData = patientRes.data as Patient | null;
    const clinicsData = (clinicsRes.data ?? []) as { id: string; name: string }[];
    const practitionersData = (practitionersRes.data ?? []) as Practitioner[];
    const appointmentsData = (appointmentsRes.data ?? []) as Appointment[];
    const notesData = (notesRes.data ?? []) as ClinicalNoteWithAppointment[];

    if (patientRes.error || !patientData) {
      setPatient(null);
      setLoading(false);
      return;
    }
    setPatient(patientData);

    const clinicMap = new Map(clinicsData.map((c) => [c.id, c.name]));
    const practitionerMap = new Map(practitionersData.map((p) => [p.id, p.full_name]));
    const clinicIds = Array.from(new Set(appointmentsData.map((a) => a.clinic_id)));
    const colorByClinic = new Map<string, string>();
    clinicIds.forEach((id, i) => colorByClinic.set(id, CLINIC_COLORS[i % CLINIC_COLORS.length]));

    setAppointments(
      appointmentsData.map((a) => ({
        ...a,
        clinic_name: clinicMap.get(a.clinic_id) ?? "Unknown",
        practitioner_name: practitionerMap.get(a.practitioner_id) ?? "Unknown",
        clinic_color: colorByClinic.get(a.clinic_id) ?? "border-l-slate-400",
      }))
    );

    const notesWithDate = notesData.map((n) => {
      const app = appointmentsData.find((a) => a.id === n.appointment_id);
      return { ...n, appointment_date: app?.appointment_date };
    });
    setNotes(notesWithDate);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lifetimeValue = appointments
    .filter((a) => a.status === "completed" && a.cost != null)
    .reduce((sum, a) => sum + Number(a.cost ?? 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <motion.p animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-slate-500">
          Loading patient…
        </motion.p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Patient not found</p>
        <Link
          href="/ceo-command-center"
          className="inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/ceo-command-center"
            className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {patient.full_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {patient.email}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {patient.phone}
                  </span>
                )}
                {patient.dob && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    DOB: {patient.dob}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Lifetime Value
                </p>
                <p className="text-xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                  ${lifetimeValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "timeline"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
            }`}
          >
            Timeline & Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "vault"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
            }`}
          >
            Digital Vault
          </button>
        </div>

        {activeTab === "timeline" && (
          <PatientTimeline
            appointments={appointments}
            notes={notes}
            onSelectAppointment={(app) => {
              setSheetAppointment(app);
              setSheetOpen(true);
            }}
          />
        )}
        {activeTab === "vault" && (
          <DigitalVaultTab patientId={patientId} onUploadComplete={fetchData} />
        )}
      </div>

      <SoapSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetAppointment(null);
        }}
        appointment={sheetAppointment}
        notes={notes}
        patientId={patientId}
        onSave={fetchData}
      />
    </div>
  );
}
