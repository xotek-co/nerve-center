"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { SoapData } from "@/types/database";
import type { AppointmentWithDetails } from "./PatientProfile";
import type { ClinicalNoteWithAppointment } from "./PatientProfile";

export function SoapSheet({
  open,
  onClose,
  appointment,
  notes,
  patientId,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentWithDetails | null;
  notes: ClinicalNoteWithAppointment[];
  patientId: string;
  onSave: () => void;
}) {
  const existingNote = appointment ? notes.find((n) => n.appointment_id === appointment.id) : null;
  const [soap, setSoap] = useState<SoapData>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"read" | "create">("read");

  useEffect(() => {
    if (!open || !appointment) return;
    if (existingNote) {
      const data = (existingNote.soap_data as SoapData) ?? {};
      setSoap({
        subjective: data.subjective ?? "",
        objective: data.objective ?? "",
        assessment: data.assessment ?? "",
        plan: data.plan ?? "",
      });
      setAuthorName(existingNote.author_name);
      setMode("read");
    } else {
      setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
      setAuthorName("");
      setMode("create");
    }
  }, [open, appointment, existingNote]);

  const handleCreateNote = async () => {
    if (!appointment) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        patient_id: patientId,
        appointment_id: appointment.id,
        clinic_id: appointment.clinic_id,
        soap_data: soap as unknown as Record<string, unknown>,
        author_name: authorName || "Staff",
      };
      const { error } = await (supabase.from("clinical_notes") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("SOAP note saved");
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save note");
    }
    setSaving(false);
  };

  const hasContent = existingNote && mode === "read";
  const isEmpty = !soap.subjective && !soap.objective && !soap.assessment && !soap.plan;

  return (
    <AnimatePresence>
      {open && appointment && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 cursor-pointer bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            aria-label="Close"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <FileText className="h-5 w-5 text-indigo-500" />
                {appointment.clinic_name} · {new Date(appointment.appointment_date).toLocaleDateString()}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {mode === "read" && hasContent ? (
                <div className="space-y-6">
                  {soap.subjective && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Subjective
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                        {soap.subjective}
                      </p>
                    </section>
                  )}
                  {soap.objective && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Objective
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                        {soap.objective}
                      </p>
                    </section>
                  )}
                  {soap.assessment && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Assessment
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                        {soap.assessment}
                      </p>
                    </section>
                  )}
                  {soap.plan && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Plan
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
                        {soap.plan}
                      </p>
                    </section>
                  )}
                  {isEmpty && <p className="text-sm text-slate-500">No SOAP content recorded.</p>}
                  <p className="text-xs text-slate-400">Author: {authorName}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {existingNote ? "Edit or view SOAP note." : "Create a SOAP note for this visit."}
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Author name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Dr. Smith"
                    />
                  </div>
                  {(
                    [
                      ["Subjective", "subjective"],
                      ["Objective", "objective"],
                      ["Assessment", "assessment"],
                      ["Plan", "plan"],
                    ] as const
                  ).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        {label}
                      </label>
                      <textarea
                        value={soap[key] ?? ""}
                        onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        placeholder={`${label}…`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    disabled={saving}
                    className="w-full cursor-pointer rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save SOAP note"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
