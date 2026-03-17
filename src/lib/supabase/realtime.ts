/**
 * Realtime is enabled on daily_financials and operational_alerts.
 * Example: subscribe to changes for a clinic's financials or alerts.
 */
import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DailyFinancial, OperationalAlert } from '@/types/database';

/** Subscribe to all new EOD reports (any clinic) — use for CEO toast notifications */
export function subscribeAllDailyFinancials(
  onInsert: (payload: DailyFinancial) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel('daily_financials:all')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'daily_financials' },
      ({ new: row }) => onInsert(row as DailyFinancial)
    )
    .subscribe();
}

export function subscribeDailyFinancials(
  clinicId: string,
  onInsert: (payload: DailyFinancial) => void,
  onUpdate?: (payload: DailyFinancial) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`daily_financials:${clinicId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'daily_financials',
        filter: `clinic_id=eq.${clinicId}`,
      },
      ({ new: row }) => onInsert(row as DailyFinancial)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'daily_financials',
        filter: `clinic_id=eq.${clinicId}`,
      },
      ({ new: row }) => onUpdate?.(row as DailyFinancial)
    )
    .subscribe();
}

export function subscribeOperationalAlerts(
  clinicId: string,
  onInsert: (payload: OperationalAlert) => void,
  onUpdate?: (payload: OperationalAlert) => void
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`operational_alerts:${clinicId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'operational_alerts',
        filter: `clinic_id=eq.${clinicId}`,
      },
      ({ new: row }) => onInsert(row as OperationalAlert)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'operational_alerts',
        filter: `clinic_id=eq.${clinicId}`,
      },
      ({ new: row }) => onUpdate?.(row as OperationalAlert)
    )
    .subscribe();
}
