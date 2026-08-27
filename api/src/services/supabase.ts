/**
 * Supabase admin client.
 *
 * Uses the service-role key which bypasses Row Level Security — only use it
 * server-side for privileged operations (profile look-ups, webhook updates).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file."
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    // Disable automatic session persistence — this is a server-only client.
    persistSession: false,
    autoRefreshToken: false,
  },
});
