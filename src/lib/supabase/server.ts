import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client. For cookie-based auth in server components,
 * install @supabase/ssr and use createServerClient from it.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createSupabaseClient<Database>(url, key);
}
