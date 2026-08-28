import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client for WalkBuddy.
 *
 * Config resolution order:
 *   1. VITE_-prefixed env vars from `.env.local` (local development)
 *   2. The literal defaults below (Google AI Studio / any deploy where
 *      secrets are injected server-side only)
 *
 * The defaults are checked in on purpose. `sb_publishable_*` is the anon
 * publishable key: it is designed to ship in client code, is sent to the
 * browser on every request anyway, and grants no access on its own — Row
 * Level Security is what protects the data (see supabase/migration_onboarding.sql).
 *
 * NEVER put the service_role / secret key here. That one bypasses RLS.
 */
const DEFAULT_SUPABASE_URL = "https://hawpplpfychvjahaywum.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_1CBVQaqeCmoLG80zx1YvXw_G8Migp4i";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Picks the session out of the URL hash after the Google OAuth redirect.
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "walkbuddy-auth",
    },
  }
);

if (!isSupabaseConfigured) {
  // Only reachable if the defaults above are blanked out deliberately.
  console.warn(
    "[WalkBuddy] Supabase has no URL/anon key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or restore the defaults in this file."
  );
}
