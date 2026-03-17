"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { PatientFile } from "@/types/database";

export function DigitalVaultTab({
  patientId,
  onUploadComplete,
}: {
  patientId: string;
  onUploadComplete?: () => void;
}) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [clinicNames, setClinicNames] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const supabase = createClient();

  const loadFiles = useCallback(async () => {
    const { data } = await supabase
      .from("patient_files")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setFiles((data as PatientFile[]) ?? []);
    const clinicIds = Array.from(new Set((data ?? []).map((f: PatientFile) => f.uploaded_by_clinic_id)));
    if (clinicIds.length > 0) {
      const { data: clinics } = await supabase.from("clinics").select("id, name").in("id", clinicIds);
      const map = new Map((clinics ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
      setClinicNames(map);
    }
    setLoading(false);
  }, [patientId, supabase]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const processFiles = useCallback(
    async (acceptedFiles: FileList | File[]) => {
      const list = Array.from(acceptedFiles);
      if (!list.length) return;
      setUploadProgress(0);
      const total = list.length;
      let done = 0;
      let clinicId = "";
      try {
        const { data } = await supabase.from("clinics").select("id").limit(1).single();
        clinicId = (data as { id: string } | null)?.id ?? "";
      } catch {
        // ignore
      }
      for (const file of list) {
        try {
          const path = `${patientId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const { error: uploadError } = await supabase.storage.from("patient-vault").upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("patient-vault").getPublicUrl(path);
          const insertPayload = {
            patient_id: patientId,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_type: file.type || file.name.split(".").pop() || null,
            uploaded_by_clinic_id: clinicId,
          };
          const insertResult = await (supabase.from("patient_files") as unknown as { insert: (p: typeof insertPayload) => Promise<{ error: Error | null }> }).insert(insertPayload);
          if (insertResult.error) throw insertResult.error;
        } catch (err) {
          console.error(err);
          toast.error(`Failed to upload ${file.name}`);
        }
        done += 1;
        setUploadProgress(Math.round((done / total) * 100));
      }
      setUploadProgress(null);
      toast.success("Document synced across all locations.");
      loadFiles();
      onUploadComplete?.();
    },
    [patientId, supabase, loadFiles, onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);
  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files;
      if (f?.length) processFiles(f);
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById("vault-file-input")?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20"
            : "border-slate-200 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/30"
        }`}
      >
        <input
          id="vault-file-input"
          type="file"
          multiple
          className="hidden"
          onChange={onFileInput}
          disabled={uploadProgress !== null}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {dragActive ? "Drop files here" : "Drag and drop files here, or click to select"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Documents, X-rays, results (max 20MB)</p>
        </div>
      </motion.div>

      {uploadProgress !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700"
        >
          <motion.div
            className="h-2 bg-indigo-600 dark:bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <motion.a
            key={f.id}
            href={f.file_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50 dark:hover:border-slate-600"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900 dark:text-slate-100">{f.file_name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {clinicNames.get(f.uploaded_by_clinic_id) ?? "Unknown clinic"}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
      {files.length === 0 && !loading && (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No documents yet.</p>
      )}
    </div>
  );
}
