/**
 * TypeScript interfaces matching Supabase healthcare schema.
 * Keep in sync with supabase/migrations/*.sql
 */

export type ClinicStatus = 'open' | 'closed';
export type AlertSeverity = 'low' | 'high' | 'critical';
export type AppointmentStatus = 'scheduled' | 'completed' | 'no_show';

/** SOAP clinical note structure (Subjective, Objective, Assessment, Plan) */
export interface SoapData {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

/** Map view coords: [lat, lng] */
export type LocationCoords = {
  lat: number | null;
  lng: number | null;
};

export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  location_lat: number | null;
  location_lng: number | null;
  status: ClinicStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyFinancial {
  id: string;
  clinic_id: string;
  date: string; // ISO date YYYY-MM-DD
  gross_revenue: number;
  cash_collected: number;
  card_collected: number;
  insurance_claims: number;
  total_expenses: number;
  manager_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffCheckIn {
  id: string;
  profile_id: string;
  clinic_id: string;
  check_in_time: string; // ISO datetime
  check_out_time: string | null;
  mood_score: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  updated_at: string;
}

export interface OperationalAlert {
  id: string;
  clinic_id: string;
  severity: AlertSeverity;
  message: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Practitioner {
  id: string;
  full_name: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null; // ISO date YYYY-MM-DD
  primary_clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  practitioner_id: string;
  appointment_date: string; // ISO datetime
  status: AppointmentStatus;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  clinic_id: string;
  soap_data: SoapData;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface PatientFile {
  id: string;
  patient_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  uploaded_by_clinic_id: string;
  created_at: string;
  updated_at: string;
}

/** Supabase schema map for typed client */
export interface Database {
  public: {
    Tables: {
      clinics: { Row: Clinic; Insert: Omit<Clinic, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<Clinic, 'id'>> };
      daily_financials: { Row: DailyFinancial; Insert: Omit<DailyFinancial, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<DailyFinancial, 'id'>> };
      staff_check_ins: { Row: StaffCheckIn; Insert: Omit<StaffCheckIn, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<StaffCheckIn, 'id'>> };
      operational_alerts: { Row: OperationalAlert; Insert: Omit<OperationalAlert, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<OperationalAlert, 'id'>> };
      practitioners: { Row: Practitioner; Insert: Omit<Practitioner, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<Practitioner, 'id'>> };
      patients: { Row: Patient; Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<Patient, 'id'>> };
      appointments: { Row: Appointment; Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<Appointment, 'id'>> };
      clinical_notes: { Row: ClinicalNote; Insert: Omit<ClinicalNote, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<ClinicalNote, 'id'>> };
      patient_files: { Row: PatientFile; Insert: Omit<PatientFile, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Omit<PatientFile, 'id'>> };
    };
  };
}
