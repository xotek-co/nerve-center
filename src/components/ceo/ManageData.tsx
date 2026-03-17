"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, AlertTriangle, User, Stethoscope, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Clinic, OperationalAlert, Patient, Practitioner } from "@/types/database";
import { Select } from "@/components/ui/Select";

type DataTab = "clinics" | "alerts" | "patients" | "practitioners" | "appointments" | "financials";

const TAB_CONFIG: { id: DataTab; label: string; icon: React.ElementType }[] = [
  { id: "clinics", label: "Clinics", icon: Building2 },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "patients", label: "Patients", icon: User },
  { id: "practitioners", label: "Practitioners", icon: Stethoscope },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "financials", label: "Daily financials", icon: DollarSign },
];

// Create a single Supabase client instance for this module
const supabase = createClient();

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { name?: string; message?: unknown };
  const msg = typeof anyErr.message === "string" ? anyErr.message : "";
  return anyErr.name === "AbortError" || msg.includes("Lock broken by another request with the 'steal' option");
}

export function ManageData() {
  const [tab, setTab] = useState<DataTab>("clinics");
  const [activeFormTab, setActiveFormTab] = useState<DataTab | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClinics = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("clinics").select("*").order("name");
      if (error) throw error;
      setClinics((data as Clinic[]) ?? []);
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load clinics", err);
      toast.error("Failed to load clinics");
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("operational_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setAlerts((data as OperationalAlert[]) ?? []);
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load alerts", err);
      toast.error("Failed to load alerts");
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("patients").select("*").order("full_name");
      if (error) throw error;
      setPatients((data as Patient[]) ?? []);
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load patients", err);
      toast.error("Failed to load patients");
    }
  }, []);

  const fetchPractitioners = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("practitioners").select("*").order("full_name");
      if (error) throw error;
      setPractitioners((data as Practitioner[]) ?? []);
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load practitioners", err);
      toast.error("Failed to load practitioners");
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchClinics(), fetchAlerts(), fetchPatients(), fetchPractitioners()]);
    } finally {
      setLoading(false);
    }
  }, [fetchClinics, fetchAlerts, fetchPatients, fetchPractitioners]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Manage data</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add and view clinics, alerts, patients, practitioners, appointments, and daily financials.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setActiveFormTab(null); }}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "clinics" && (
        <ClinicsSection
          clinics={clinics}
          onRefresh={fetchClinics}
          showForm={activeFormTab === "clinics"}
          onShowForm={(v) => setActiveFormTab(v ? "clinics" : null)}
          loading={loading}
        />
      )}
      {tab === "alerts" && (
        <AlertsSection
          alerts={alerts}
          clinics={clinics}
          onRefresh={fetchAlerts}
          showForm={activeFormTab === "alerts"}
          onShowForm={(v) => setActiveFormTab(v ? "alerts" : null)}
          loading={loading}
        />
      )}
      {tab === "patients" && (
        <PatientsSection
          patients={patients}
          clinics={clinics}
          onRefresh={fetchPatients}
          showForm={activeFormTab === "patients"}
          onShowForm={(v) => setActiveFormTab(v ? "patients" : null)}
          loading={loading}
        />
      )}
      {tab === "practitioners" && (
        <PractitionersSection
          practitioners={practitioners}
          clinics={clinics}
          onRefresh={fetchPractitioners}
          showForm={activeFormTab === "practitioners"}
          onShowForm={(v) => setActiveFormTab(v ? "practitioners" : null)}
          loading={loading}
        />
      )}
      {tab === "appointments" && (
        <AppointmentsSection
          clinics={clinics}
          patients={patients}
          practitioners={practitioners}
          onRefresh={loadAll}
          showForm={activeFormTab === "appointments"}
          onShowForm={(v) => setActiveFormTab(v ? "appointments" : null)}
        />
      )}
      {tab === "financials" && (
        <FinancialsSection
          clinics={clinics}
          onRefresh={loadAll}
          showForm={activeFormTab === "financials"}
          onShowForm={(v) => setActiveFormTab(v ? "financials" : null)}
        />
      )}
    </motion.div>
  );
}

function ClinicsSection({
  clinics,
  onRefresh,
  showForm,
  onShowForm,
  loading,
}: {
  clinics: Clinic[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [status, setStatus] = useState<"open" | "closed">("closed");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter clinic name");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), timezone: timezone.trim() || "UTC", status };
      const { error } = await (supabase.from("clinics") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Clinic added");
      setName("");
      setTimezone("UTC");
      setStatus("closed");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add clinic");
    }
    setSaving(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clinics</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add clinic
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Branch"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
              <Select
                value={status}
                onChange={(v) => setStatus(v as "open" | "closed")}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => onShowForm(false)}
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : clinics.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No clinics yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {clinics.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{c.status} · {c.timezone}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AlertsSection({
  alerts,
  clinics,
  onRefresh,
  showForm,
  onShowForm,
  loading,
}: {
  alerts: OperationalAlert[];
  clinics: Clinic[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
  loading: boolean;
}) {
  const [clinicId, setClinicId] = useState("");
  const [severity, setSeverity] = useState<"low" | "high" | "critical">("low");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !message.trim()) {
      toast.error("Select a clinic and enter a message");
      return;
    }
    setSaving(true);
    try {
      const payload = { clinic_id: clinicId, severity, message: message.trim() };
      const { error } = await (supabase.from("operational_alerts") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Alert added");
      setClinicId("");
      setMessage("");
      setSeverity("low");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add alert");
    }
    setSaving(false);
  };

  const clinicOptions = [
    { value: "", label: "Select clinic" },
    ...clinics.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Operational alerts</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add alert
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={clinicId} onChange={setClinicId} options={clinicOptions} label="Clinic" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Severity</label>
              <Select
                value={severity}
                onChange={(v) => setSeverity(v as "low" | "high" | "critical")}
                options={[
                  { value: "low", label: "Low" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. A/C broken in waiting room"
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No alerts yet.</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <p className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">{a.message}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.severity === "critical" ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300" :
                  a.severity === "high" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {a.severity}
                </span>
                {a.resolved && <span className="text-xs text-slate-400">Resolved</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PatientsSection({
  patients,
  clinics,
  onRefresh,
  showForm,
  onShowForm,
  loading,
}: {
  patients: Patient[];
  clinics: Clinic[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [primaryClinicId, setPrimaryClinicId] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Enter patient name");
      return;
    }
    setSaving(true);
    try {
      const payload = { full_name: fullName.trim(), email: email.trim() || null, phone: phone.trim() || null, dob: dob || null, primary_clinic_id: primaryClinicId || null };
      const { error } = await (supabase.from("patients") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Patient added");
      setFullName("");
      setEmail("");
      setPhone("");
      setDob("");
      setPrimaryClinicId("");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add patient");
    }
    setSaving(false);
  };

  const clinicOptions = [
    { value: "", label: "No primary clinic" },
    ...clinics.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Patients</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add patient
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Full name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Date of birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <Select value={primaryClinicId} onChange={setPrimaryClinicId} options={clinicOptions} label="Primary clinic" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : patients.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No patients yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {patients.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-800 dark:text-slate-200">{p.full_name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{p.email || p.phone || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PractitionersSection({
  practitioners,
  clinics,
  onRefresh,
  showForm,
  onShowForm,
  loading,
}: {
  practitioners: Practitioner[];
  clinics: Clinic[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !clinicId) {
      toast.error("Enter name and select a clinic");
      return;
    }
    setSaving(true);
    try {
      const payload = { full_name: fullName.trim(), clinic_id: clinicId };
      const { error } = await (supabase.from("practitioners") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Practitioner added");
      setFullName("");
      setClinicId("");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add practitioner");
    }
    setSaving(false);
  };

  const clinicOptions = [
    { value: "", label: "Select clinic" },
    ...clinics.map((c) => ({ value: c.id, label: c.name })),
  ];

  const clinicMap = new Map(clinics.map((c) => [c.id, c.name]));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Practitioners</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add practitioner
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Full name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <Select value={clinicId} onChange={setClinicId} options={clinicOptions} label="Clinic *" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : practitioners.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No practitioners yet. Add clinics first, then add practitioners.</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {practitioners.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-800 dark:text-slate-200">{p.full_name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{clinicMap.get(p.clinic_id) ?? p.clinic_id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AppointmentsSection({
  clinics,
  patients,
  practitioners,
  onRefresh,
  showForm,
  onShowForm,
}: {
  clinics: Clinic[];
  patients: Patient[];
  practitioners: Practitioner[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [status, setStatus] = useState<"scheduled" | "completed" | "no_show">("scheduled");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const practitionersForClinic = clinicId
    ? practitioners.filter((p) => p.clinic_id === clinicId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !clinicId || !practitionerId || !appointmentDate) {
      toast.error("Fill required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = { patient_id: patientId, clinic_id: clinicId, practitioner_id: practitionerId, appointment_date: new Date(appointmentDate).toISOString(), status, cost: cost ? parseFloat(cost) : null };
      const { error } = await (supabase.from("appointments") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Appointment added");
      setPatientId("");
      setClinicId("");
      setPractitionerId("");
      setAppointmentDate("");
      setStatus("scheduled");
      setCost("");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add appointment");
    }
    setSaving(false);
  };

  const patientOptions = [
    { value: "", label: "Select patient" },
    ...patients.map((p) => ({ value: p.id, label: p.full_name })),
  ];
  const clinicOptions = [
    { value: "", label: "Select clinic" },
    ...clinics.map((c) => ({ value: c.id, label: c.name })),
  ];
  const practitionerOptions = [
    { value: "", label: clinicId ? "Select practitioner" : "Select clinic first" },
    ...practitionersForClinic.map((p) => ({ value: p.id, label: p.full_name })),
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Appointments</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add appointment
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={patientId} onChange={setPatientId} options={patientOptions} label="Patient *" />
            <Select value={clinicId} onChange={(v) => { setClinicId(v); setPractitionerId(""); }} options={clinicOptions} label="Clinic *" />
            <Select value={practitionerId} onChange={setPractitionerId} options={practitionerOptions} label="Practitioner *" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Date & time *</label>
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <Select
              value={status}
              onChange={(v) => setStatus(v as "scheduled" | "completed" | "no_show")}
              options={[
                { value: "scheduled", label: "Scheduled" },
                { value: "completed", label: "Completed" },
                { value: "no_show", label: "No show" },
              ]}
              label="Status"
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Add appointments here. View patient timelines on their profile (Global Patient Hub → search → open patient).
      </p>
    </section>
  );
}

function FinancialsSection({
  clinics,
  onRefresh,
  showForm,
  onShowForm,
}: {
  clinics: Clinic[];
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
}) {
  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [grossRevenue, setGrossRevenue] = useState("");
  const [cashCollected, setCashCollected] = useState("");
  const [cardCollected, setCardCollected] = useState("");
  const [insuranceClaims, setInsuranceClaims] = useState("");
  const [totalExpenses, setTotalExpenses] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !date) {
      toast.error("Select clinic and date");
      return;
    }
    const gross = parseFloat(grossRevenue) || 0;
    const cash = parseFloat(cashCollected) || 0;
    const card = parseFloat(cardCollected) || 0;
    const insurance = parseFloat(insuranceClaims) || 0;
    const expenses = parseFloat(totalExpenses) || 0;
    setSaving(true);
    try {
      const payload = { clinic_id: clinicId, date, gross_revenue: gross, cash_collected: cash, card_collected: card, insurance_claims: insurance, total_expenses: expenses, manager_notes: managerNotes.trim() || null };
      const { error } = await (supabase.from("daily_financials") as unknown as { insert: (p: typeof payload) => Promise<{ error: Error | null }> }).insert(payload);
      if (error) throw error;
      toast.success("Daily financials added");
      setGrossRevenue("");
      setCashCollected("");
      setCardCollected("");
      setInsuranceClaims("");
      setTotalExpenses("");
      setManagerNotes("");
      onShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add. Maybe this clinic already has an entry for this date?");
    }
    setSaving(false);
  };

  const clinicOptions = [
    { value: "", label: "Select clinic" },
    ...clinics.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Daily financials</h2>
        <button
          type="button"
          onClick={() => onShowForm(!showForm)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add day
        </button>
      </div>
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={clinicId} onChange={setClinicId} options={clinicOptions} label="Clinic *" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Gross revenue ($)</label>
              <input type="number" step="0.01" min="0" value={grossRevenue} onChange={(e) => setGrossRevenue(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Cash collected ($)</label>
              <input type="number" step="0.01" min="0" value={cashCollected} onChange={(e) => setCashCollected(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Card collected ($)</label>
              <input type="number" step="0.01" min="0" value={cardCollected} onChange={(e) => setCardCollected(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Insurance claims ($)</label>
              <input type="number" step="0.01" min="0" value={insuranceClaims} onChange={(e) => setInsuranceClaims(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Total expenses ($)</label>
              <input type="number" step="0.01" min="0" value={totalExpenses} onChange={(e) => setTotalExpenses(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Manager notes</label>
            <textarea value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder="Optional" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => onShowForm(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </motion.form>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        One row per clinic per day. If a day already exists for a clinic, use the Financial Ledger to edit it inline.
      </p>
    </section>
  );
}
