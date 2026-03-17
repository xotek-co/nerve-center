# Patient Vault – Supabase Storage for Medical Documents

## 1. Create the bucket in Supabase Dashboard

1. Open your project: [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Storage** in the left sidebar.
3. Click **New bucket**.
4. Set:
   - **Name:** `patient-vault`
   - **Public bucket:** **Off** (private; use RLS for access).
   - **File size limit:** e.g. `50` MB.
   - **Allowed MIME types:** (optional) e.g. `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
5. Click **Create bucket**.

## 2. Apply storage policies (SQL)

After the bucket exists, run the policies so authenticated users can read/write:

- Open **SQL Editor** in the Dashboard.
- Paste and run the contents of **`patient-vault-setup.sql`** in this folder.

Or run via CLI (from project root):

```bash
supabase db execute -f supabase/storage/patient-vault-setup.sql
```

## 3. Using the bucket in your app

- **Upload:** use Supabase client `storage.from('patient-vault').upload(path, file, options)`.
- **Public URL:** not available (bucket is private). Use `storage.from('patient-vault').createSignedUrl(path, expiresIn)` for temporary links.
- Store the returned path (or signed URL expiry) in **`patient_files.file_url`** (e.g. path like `{clinic_id}/{patient_id}/{filename}`).

## 4. Suggested object path layout

- `{clinic_id}/{patient_id}/{uuid}_{original_filename}`  
  so you can list by clinic/patient and avoid collisions.
