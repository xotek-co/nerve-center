/**
 * Zod schemas for form validation — aligned with database types.
 */
import { z } from 'zod';

const clinicStatusEnum = z.enum(['open', 'closed']);
const alertSeverityEnum = z.enum(['low', 'high', 'critical']);
const moodScoreSchema = z.number().int().min(1).max(5);

export const clinicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  status: clinicStatusEnum.default('closed'),
});

export const dailyFinancialSchema = z.object({
  clinic_id: z.string().uuid('Invalid clinic ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gross_revenue: z.number().min(0).default(0),
  cash_collected: z.number().min(0).default(0),
  card_collected: z.number().min(0).default(0),
  insurance_claims: z.number().min(0).default(0),
  total_expenses: z.number().min(0).default(0),
  manager_notes: z.string().nullable().optional(),
});

export const staffCheckInSchema = z.object({
  profile_id: z.string().uuid('Invalid profile ID'),
  clinic_id: z.string().uuid('Invalid clinic ID'),
  check_in_time: z.string().datetime({ message: 'Invalid check-in time' }),
  check_out_time: z.string().datetime().nullable().optional(),
  mood_score: moodScoreSchema,
});

export const operationalAlertSchema = z.object({
  clinic_id: z.string().uuid('Invalid clinic ID'),
  severity: alertSeverityEnum,
  message: z.string().min(1, 'Message is required'),
  resolved: z.boolean().default(false),
});

export type ClinicFormInput = z.infer<typeof clinicSchema>;
export type DailyFinancialFormInput = z.infer<typeof dailyFinancialSchema>;
export type StaffCheckInFormInput = z.infer<typeof staffCheckInSchema>;
export type OperationalAlertFormInput = z.infer<typeof operationalAlertSchema>;
