"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types/database";

export type PatientSearchResult = Patient & {
  branch_names: string[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0 },
};

export function GlobalPatientSearch({
  clinicNames,
  clinicFilterId,
  className = "",
}: {
  clinicNames: Map<string, string>;
  clinicFilterId?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const supabase = createClient();
        let patientsQuery = supabase
          .from("patients")
          .select("id, full_name, email, phone, dob, primary_clinic_id, created_at, updated_at")
          .or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
        if (clinicFilterId) {
          patientsQuery = patientsQuery.eq("primary_clinic_id", clinicFilterId);
        }
        const { data: patientsData, error: patientsError } = await patientsQuery.limit(20);
        if (patientsError) throw patientsError;
        const patients = (patientsData ?? []) as Patient[];
        if (!patients.length) {
          setResults([]);
          setLoading(false);
          toast.error("Patient not found", { description: `No results for "${q.trim()}"` });
          return;
        }
        const ids = patients.map((p) => p.id);
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("patient_id, clinic_id")
          .in("patient_id", ids);
        const appointments = (appointmentsData ?? []) as { patient_id: string; clinic_id: string }[];
        const branchByPatient = new Map<string, Set<string>>();
        appointments.forEach((a) => {
          if (!branchByPatient.has(a.patient_id)) branchByPatient.set(a.patient_id, new Set());
          branchByPatient.get(a.patient_id)!.add(a.clinic_id);
        });
        const branchNames = (pid: string) =>
          Array.from(branchByPatient.get(pid) ?? [])
            .map((cid) => clinicNames.get(cid) ?? cid)
            .filter(Boolean);
        setResults(
          patients.map((p) => ({
            ...p,
            branch_names: branchNames(p.id),
          }))
        );
      } catch (err) {
        console.error(err);
        setResults([]);
        toast.error("Search failed");
      }
      setLoading(false);
    },
    [clinicNames, clinicFilterId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    if (!query.trim()) setResults([]);
  }, [query]);

  const handleSelect = (patient: PatientSearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/patients/${patient.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search patients across all branches…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-indigo-400"
        />
      </div>
      <AnimatePresence>
        {open && (query.trim() || results.length > 0) && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-pointer"
              aria-hidden
              onClick={() => setOpen(false)}
              role="button"
              tabIndex={-1}
              aria-label="Close search"
            />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-slate-900/5 scrollbar-thin dark:border-slate-600 dark:bg-slate-800 dark:ring-slate-100/5"
            >
              {loading ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                  Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {query.trim() ? (
                    "No patient found. Try a different name or email."
                  ) : (
                    "Type to search across all clinics"
                  )}
                </div>
              ) : (
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="py-2"
                >
                  {results.map((patient) => (
                    <motion.li
                      key={patient.id}
                      variants={itemVariants}
                      className="cursor-pointer px-4 py-3 transition-colors hover:bg-indigo-50/80 active:bg-indigo-100/80 dark:hover:bg-indigo-500/10 dark:active:bg-indigo-500/20"
                      onClick={() => handleSelect(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                          <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {patient.full_name}
                          </p>
                          {patient.branch_names.length > 0 && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>Seen at: {patient.branch_names.join(", ")}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
