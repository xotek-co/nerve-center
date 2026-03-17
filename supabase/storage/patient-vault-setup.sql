-- Patient Vault: storage policies for bucket "patient-vault"
-- Run this AFTER creating the bucket (see PATIENT-VAULT-STORAGE.md).

-- Allow authenticated users to upload to patient-vault
CREATE POLICY "Authenticated can upload to patient-vault"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patient-vault');

-- Allow authenticated users to read from patient-vault
CREATE POLICY "Authenticated can read patient-vault"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'patient-vault');

-- Allow authenticated users to update objects
CREATE POLICY "Authenticated can update patient-vault"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'patient-vault');

-- Allow authenticated users to delete objects
CREATE POLICY "Authenticated can delete from patient-vault"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'patient-vault');
