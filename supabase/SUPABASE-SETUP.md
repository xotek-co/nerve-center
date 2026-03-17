# Supabase setup for Nerve Center

Your app uses the **anon** key (custom login, not Supabase Auth). Do these steps in order.

---

## 1. Run database migrations

In the Supabase Dashboard: **SQL Editor** → New query.

**Step 1a – Core schema (clinics, financials, alerts, staff):**

- Open `supabase/migrations/20240315000000_healthcare_schema.sql`
- Copy its full contents, paste into the SQL Editor, and **Run**

**Step 1b – Patient & clinical schema:**

- Open `supabase/migrations/20240316000000_patient_clinical_schema.sql`
- Copy its full contents, paste into the SQL Editor, and **Run**

This creates:

- Tables: `clinics`, `daily_financials`, `staff_check_ins`, `operational_alerts`, `practitioners`, `patients`, `appointments`, `clinical_notes`, `patient_files`
- Realtime enabled on `daily_financials` and `operational_alerts`
- RLS enabled with policies for `authenticated` (see step 4 if you use anon key)

---

## 2. Allow anon access (required for your app)

Your app uses the **anon** key and custom auth, so Supabase treats all requests as **anon**, not **authenticated**. The migrations only add policies for `authenticated`, so you must add policies for **anon**.

**Recommended – Anon SELECT + INSERT + UPDATE (for dashboard and Manage Data UI):**

In **SQL Editor**, open and run this migration file:

- **File:** `supabase/migrations/20240317000000_anon_insert_policies.sql`

Copy its full contents into the SQL Editor and **Run**. This adds anon policies so the app can:

- **Read** all app data (dashboard, patient search, ledger, etc.)
- **Insert** and **Update** from the **Manage data** section (clinics, patients, practitioners, appointments, alerts, daily financials, SOAP notes, Digital Vault uploads)

If you see *policy "anon_select_..." already exists*, you may have run this before; you can skip or drop those policies first.

**Alternative – Manual policies:**

**Option A – Allow anon for all app tables (simplest for dev/single-tenant):**

```sql
-- Allow anon to read/write all app tables (use only if you control who can log in via your app)
CREATE POLICY "Anon read clinics" ON clinics FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read daily_financials" ON daily_financials FOR ALL TO anon USING (true);
CREATE POLICY "Anon read staff_check_ins" ON staff_check_ins FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read operational_alerts" ON operational_alerts FOR ALL TO anon USING (true);

CREATE POLICY "Anon read practitioners" ON practitioners FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read patients" ON patients FOR ALL TO anon USING (true);
CREATE POLICY "Anon read appointments" ON appointments FOR ALL TO anon USING (true);
CREATE POLICY "Anon read clinical_notes" ON clinical_notes FOR ALL TO anon USING (true);
CREATE POLICY "Anon read patient_files" ON patient_files FOR ALL TO anon USING (true);
```

**Option B – Only allow anon SELECT (read-only from frontend):**

If you prefer anon to only read data and do writes via a backend/API:

```sql
CREATE POLICY "Anon read clinics" ON clinics FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read daily_financials" ON daily_financials FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read staff_check_ins" ON staff_check_ins FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read operational_alerts" ON operational_alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read practitioners" ON practitioners FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read patients" ON patients FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read appointments" ON appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read clinical_notes" ON clinical_notes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read patient_files" ON patient_files FOR SELECT TO anon USING (true);
```

(Then implement inserts/updates in your Next.js API routes using the **service_role** key so they bypass RLS.)

---

## 3. Create the Storage bucket (Digital Vault)

1. In the Dashboard go to **Storage**.
2. Click **New bucket**.
3. Set:
   - **Name:** `patient-vault`
   - **Public bucket:** **Off**
   - **File size limit:** e.g. **50** MB
   - **Allowed MIME types:** (optional) e.g. `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
4. Click **Create bucket**.

---

## 4. Storage policies for `patient-vault`

Because the app uses the **anon** key, add policies for **anon** so uploads and reads work.

In **SQL Editor**, run:

```sql
-- Anon: allow insert (upload) and select (read) for patient-vault
CREATE POLICY "Anon can upload to patient-vault"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'patient-vault');

CREATE POLICY "Anon can read patient-vault"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'patient-vault');

CREATE POLICY "Anon can update patient-vault"
ON storage.objects FOR UPDATE TO anon
USING (bucket_id = 'patient-vault');

CREATE POLICY "Anon can delete from patient-vault"
ON storage.objects FOR DELETE TO anon
USING (bucket_id = 'patient-vault');
```

If you prefer to use the existing `patient-vault-setup.sql` (which uses `authenticated`), run that file **and** add the four policies above with `anon` instead of `authenticated` so the current app (anon key) can access the bucket.

---

## 5. Realtime (already in migration)

Realtime for `daily_financials` and `operational_alerts` is enabled in the first migration (step 1a). No extra step unless you turned it off.

To confirm: **Database** → **Replication** — `daily_financials` and `operational_alerts` should be in the publication.

---

## 6. Environment variables

In your project (e.g. `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL (Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key (Settings → API)

---

## Summary checklist

| Step | Where | What |
|------|--------|------|
| 1a   | SQL Editor | Run `20240315000000_healthcare_schema.sql` |
| 1b   | SQL Editor | Run `20240316000000_patient_clinical_schema.sql` |
| 2    | SQL Editor | Run `20240317000000_anon_insert_policies.sql` (recommended) or Option A/B above |
| 3    | Storage     | Create bucket `patient-vault` (private, 50 MB) |
| 4    | SQL Editor | Run storage policies for anon (see section 4) |
| 5    | —           | Realtime already enabled by migration |
| 6    | .env.local  | Set Supabase URL and anon key |

After this, the dashboard, **Manage data** (add clinics, patients, appointments, etc.), patient search, patient profile, retention view, and Digital Vault uploads should work with your current Supabase + anon setup.
