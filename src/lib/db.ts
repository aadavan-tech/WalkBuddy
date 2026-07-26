import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Row shapes — mirror supabase/schema.sql                            */
/* ------------------------------------------------------------------ */

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  date_of_birth: string | null; // YYYY-MM-DD; source of truth for age
  age: number | null; // derived from date_of_birth, kept in sync for convenience
  gender: string | null;
  phone: string | null;
  avatar_url: string | null;
  weight_kg: number | null;
  daily_steps_goal: number | null;
  city: string | null;
  onboarding_completed: boolean;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  marketing_opt_in: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfilePreferencesRow {
  /** FK to profiles.id — the pre-existing tables key on profile_id, not user_id. */
  profile_id: string;
  preferred_activities: string[];
  experience_level: string | null;
  preferred_times: string[];
  weekly_goal_km: number | null;
  daily_steps_goal: number | null;
  typical_pace: string | null;
  terrain_preferences: string[];
  /** INTEGER in the DB — a head-count, not a label. See GROUP_SIZE_TO_COUNT. */
  group_size_preference: number | null;
  buddy_gender_preference: string | null;
  audio_preference: string | null;
  motivations: string[];
  max_buddy_distance_km: number | null;
  ai_coach_opt_in: boolean;
  push_notifications: boolean;
}

export interface SafetySettingsRow {
  /** FK to profiles.id — the pre-existing tables key on profile_id, not user_id. */
  profile_id: string;
  share_live_location: boolean;
  daylight_hours_only: boolean;
  verified_buddies_only: boolean;
  women_only_matching: boolean;
  profile_visibility: string;
  share_route_history: boolean;
  auto_checkin_minutes: number | null;
  sos_shortcut_enabled: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

/* ------------------------------------------------------------------ */
/*  profiles                                                           */
/* ------------------------------------------------------------------ */

/**
 * Reads the signed-in user's profile row. Returns null when the row does not
 * exist yet (fresh Google sign-in that has not reached the personal-info step).
 */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRow) ?? null;
}

/** Creates the profile row immediately after a successful Google sign-in. */
export async function ensureProfile(user: {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<ProfileRow> {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: user.fullName ?? null,
      avatar_url: user.avatarUrl ?? null,
      onboarding_completed: false,
      terms_accepted: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

/** Upserts any subset of the profile columns (used by every onboarding step). */
export async function saveProfile(
  userId: string,
  patch: Partial<Omit<ProfileRow, "id">>
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

/* ------------------------------------------------------------------ */
/*  profile_preferences                                                */
/* ------------------------------------------------------------------ */

export async function saveProfilePreferences(
  userId: string,
  prefs: Omit<ProfilePreferencesRow, "profile_id">
): Promise<ProfilePreferencesRow> {
  const { data, error } = await supabase
    .from("profile_preferences")
    .upsert(
      { profile_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "profile_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ProfilePreferencesRow;
}

export async function fetchProfilePreferences(
  userId: string
): Promise<ProfilePreferencesRow | null> {
  const { data, error } = await supabase
    .from("profile_preferences")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfilePreferencesRow) ?? null;
}

/* ------------------------------------------------------------------ */
/*  safety_settings                                                    */
/* ------------------------------------------------------------------ */

export async function saveSafetySettings(
  userId: string,
  settings: Omit<SafetySettingsRow, "profile_id">
): Promise<SafetySettingsRow> {
  const { data, error } = await supabase
    .from("safety_settings")
    .upsert(
      { profile_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: "profile_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as SafetySettingsRow;
}

export async function fetchSafetySettings(
  userId: string
): Promise<SafetySettingsRow | null> {
  const { data, error } = await supabase
    .from("safety_settings")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as SafetySettingsRow) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
