"use client";

import { motion } from "framer-motion";
import { Calendar, Stethoscope } from "lucide-react";
import type { AppointmentWithDetails, ClinicalNoteWithAppointment } from "./PatientProfile";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

export function PatientTimeline({
  appointments,
  notes,
  onSelectAppointment,
}: {
  appointments: AppointmentWithDetails[];
  notes: ClinicalNoteWithAppointment[];
  onSelectAppointment: (app: AppointmentWithDetails) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        No appointments yet.
      </div>
    );
  }

  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative space-y-0"
    >
      {/* vertical line */}
      <div
        className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-600"
        aria-hidden
      />
      {appointments.map((app) => {
        const note = notes.find((n) => n.appointment_id === app.id);
        const dateStr = new Date(app.appointment_date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return (
          <motion.li
            key={app.id}
            variants={item}
            className="relative flex gap-4 pl-2"
          >
            <div
              className={`relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 ${
                note ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => onSelectAppointment(app)}
              className={`mb-4 flex flex-1 cursor-pointer flex-col rounded-xl border-l-4 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-slate-800 ${app.clinic_color} border border-slate-200 dark:border-slate-700`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {app.clinic_name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    app.status === "completed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : app.status === "no_show"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {dateStr}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                <Stethoscope className="h-3.5 w-3.5" />
                {app.practitioner_name}
              </p>
              {app.cost != null && (
                <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  ${Number(app.cost).toLocaleString()}
                </p>
              )}
              {note && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  SOAP note on file
                </p>
              )}
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
