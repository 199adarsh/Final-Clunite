import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { Database } from "./supabase"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin: SupabaseClient<Database> | null = serviceKey
  ? createClient<Database>(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null


