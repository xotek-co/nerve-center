-- Anon INSERT (and UPDATE) policies for Manage Data UI
-- Your app uses the anon key with custom login. Run this after the schema migrations.
-- Run in Supabase Dashboard → SQL Editor (paste and Run).
-- If you already have anon SELECT policies (e.g. from SUPABASE-SETUP.md Option A), that's fine;
-- these add INSERT and UPDATE so the frontend can create and edit records.

-- Clinics: anon can read, insert, update
CREATE POLICY "anon_select_clinics" ON clinics FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_clinics" ON clinics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_clinics" ON clinics FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Daily financials: anon can read, insert, update
CREATE POLICY "anon_select_daily_financials" ON daily_financials FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_daily_financials" ON daily_financials FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_daily_financials" ON daily_financials FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Staff check-ins: anon can read (no insert from Manage Data yet)
CREATE POLICY "anon_select_staff_check_ins" ON staff_check_ins FOR SELECT TO anon USING (true);

-- Operational alerts: anon can read, insert, update
CREATE POLICY "anon_select_operational_alerts" ON operational_alerts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_operational_alerts" ON operational_alerts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_operational_alerts" ON operational_alerts FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Practitioners: anon can read, insert, update
CREATE POLICY "anon_select_practitioners" ON practitioners FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_practitioners" ON practitioners FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_practitioners" ON practitioners FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Patients: anon can read, insert, update
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Appointments: anon can read, insert, update
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Clinical notes: anon can read, insert, update (SOAP notes)
CREATE POLICY "anon_select_clinical_notes" ON clinical_notes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_clinical_notes" ON clinical_notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_clinical_notes" ON clinical_notes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Patient files: anon can read, insert, update (Digital Vault uploads)
CREATE POLICY "anon_select_patient_files" ON patient_files FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_patient_files" ON patient_files FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_patient_files" ON patient_files FOR UPDATE TO anon USING (true) WITH CHECK (true);
