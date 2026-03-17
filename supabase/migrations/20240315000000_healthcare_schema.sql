-- Multi-tenant healthcare schema
-- Run in Supabase SQL Editor or: supabase db push

-- Enum for clinic status
CREATE TYPE clinic_status AS ENUM ('open', 'closed');

-- Enum for alert severity
CREATE TYPE alert_severity AS ENUM ('low', 'high', 'critical');

-- Clinics table (tenants)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  status clinic_status NOT NULL DEFAULT 'closed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE clinics IS 'Multi-tenant clinics; location_lat/location_lng for map view';

-- Daily financials (per clinic, per day)
CREATE TABLE daily_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  gross_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cash_collected NUMERIC(14, 2) NOT NULL DEFAULT 0,
  card_collected NUMERIC(14, 2) NOT NULL DEFAULT 0,
  insurance_claims NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0,
  manager_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, date)
);

CREATE INDEX idx_daily_financials_clinic_date ON daily_financials(clinic_id, date);

-- Staff check-ins
CREATE TABLE staff_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  mood_score SMALLINT NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_check_ins_clinic ON staff_check_ins(clinic_id);
CREATE INDEX idx_staff_check_ins_profile ON staff_check_ins(profile_id);
CREATE INDEX idx_staff_check_ins_time ON staff_check_ins(check_in_time);

-- Operational alerts
CREATE TABLE operational_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  severity alert_severity NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_operational_alerts_clinic ON operational_alerts(clinic_id);
CREATE INDEX idx_operational_alerts_resolved ON operational_alerts(resolved);

-- Enable Realtime for daily_financials and operational_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE daily_financials;
ALTER PUBLICATION supabase_realtime ADD TABLE operational_alerts;

-- RLS (adjust policies to your auth model in production)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON clinics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON daily_financials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON staff_check_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON operational_alerts FOR SELECT TO authenticated USING (true);
