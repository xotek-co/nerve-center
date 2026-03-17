-- Patient and Clinical infrastructure
-- Run after 20240315000000_healthcare_schema.sql

-- Enum for appointment status
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'no_show');

-- Practitioners (referenced by appointments)
CREATE TABLE practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_practitioners_clinic ON practitioners(clinic_id);

-- Patients (can have appointments across different clinics)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  primary_clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_primary_clinic ON patients(primary_clinic_id);
CREATE INDEX idx_patients_email ON patients(email);

-- Appointments: patient can have many across clinics; links to practitioner
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE RESTRICT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  cost NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_practitioner ON appointments(practitioner_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Clinical notes (SOAP: Subjective, Objective, Assessment, Plan)
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  soap_data JSONB NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_clinic ON clinical_notes(clinic_id);

-- Patient files (references storage via file_url)
CREATE TABLE patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by_clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_files_patient ON patient_files(patient_id);
CREATE INDEX idx_patient_files_clinic ON patient_files(uploaded_by_clinic_id);

-- RLS
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON practitioners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON clinical_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON patient_files FOR SELECT TO authenticated USING (true);
