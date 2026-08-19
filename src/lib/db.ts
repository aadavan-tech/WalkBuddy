import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Row shapes — mirror supabase/schema.sql                            */
/* ------------------------------------------------------------------ */

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  age: number | null;
  gender: string | null;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  weight_kg: number | null;
  daily_steps_goal: number | null;
  city: string | null;
  bio: string | null;
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

export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
export const PHONE_DIGITS_PATTERN = /^\d{7,15}$/;

export function normalizeUsername(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

export function validateUsername(input: string): string | null {
  const normalized = normalizeUsername(input);
  if (!normalized) return "Username is required.";
  if (normalized.length < 3 || normalized.length > 20) {
    return "Username must be between 3 and 20 characters.";
  }
  if (normalized.startsWith("_")) {
    return "Username cannot start with an underscore.";
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export function normalizePhoneNumber(input: string): string {
  return input.replace(/\s+/g, "").replace(/[^\d]/g, "");
}

export function validatePhoneNumber(input: string): string | null {
  const normalized = normalizePhoneNumber(input);
  if (!normalized) return null;
  if (!PHONE_DIGITS_PATTERN.test(normalized)) {
    return "Phone number must contain only digits and be between 7 and 15 digits long.";
  }
  return null;
}

export async function isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", normalized)
    .limit(1);

  if (error) throw error;
  return !(data ?? []).some((row: { id: string }) => row.id !== currentUserId);
}

export async function isPhoneNumberAvailable(phoneNumber: string, currentUserId?: string): Promise<boolean> {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", normalized)
    .limit(1);

  if (error) throw error;
  return !(data ?? []).some((row: { id: string }) => row.id !== currentUserId);
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
      username: null,
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

/* ------------------------------------------------------------------ */
/*  trail_ratings                                                      */
/* ------------------------------------------------------------------ */

export interface TrailRatingSummary {
  route_id: string;
  average_rating: number;
  rating_count: number;
}

/** Community average + count per trail, keyed by route id. */
export async function fetchTrailRatingSummaries(): Promise<
  Record<string, { average: number; count: number }>
> {
  const { data, error } = await supabase
    .from("trail_rating_summary")
    .select("route_id, average_rating, rating_count");

  if (error) throw error;

  const out: Record<string, { average: number; count: number }> = {};
  (data as TrailRatingSummary[] | null)?.forEach((r) => {
    out[r.route_id] = {
      average: Number(r.average_rating) || 0,
      count: Number(r.rating_count) || 0,
    };
  });
  return out;
}

/** The signed-in user's own ratings, keyed by route id. */
export async function fetchMyTrailRatings(
  userId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("trail_ratings")
    .select("route_id, rating")
    .eq("profile_id", userId);

  if (error) throw error;

  const out: Record<string, number> = {};
  (data as { route_id: string; rating: number }[] | null)?.forEach((r) => {
    out[r.route_id] = r.rating;
  });
  return out;
}

/** Adds or updates this user's rating for a trail (1-5). */
export async function saveTrailRating(
  userId: string,
  routeId: string,
  rating: number
): Promise<void> {
  const { error } = await supabase
    .from("trail_ratings")
    .upsert(
      { profile_id: userId, route_id: routeId, rating },
      { onConflict: "route_id,profile_id" }
    );
  if (error) throw error;
}

/** Removes this user's rating for a trail (tapping the same star again). */
export async function deleteTrailRating(
  userId: string,
  routeId: string
): Promise<void> {
  const { error } = await supabase
    .from("trail_ratings")
    .delete()
    .eq("profile_id", userId)
    .eq("route_id", routeId);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Proximity buddy matching                                           */
/*                                                                     */
/*  Two users near each other tap "Find a buddy"; the Postgres matcher  */
/*  pairs them and hands both the SAME meeting point to walk to.        */
/*  See supabase/migration_buddy_matching.sql.                          */
/* ------------------------------------------------------------------ */

export type MatchCategory = "Walking" | "Jogging" | "Sprinting";

export interface MatchRow {
  id: string;
  user_a: string;
  user_b: string;
  category: MatchCategory;
  /** The shared spot both users walk to (midpoint between them). */
  meet_lat: number;
  meet_lng: number;
  /** How far apart the pair were when matched, in km. */
  apart_km: number | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

/**
 * Registers the caller's search and tries to pair them immediately.
 *
 * Returns the match when someone was waiting nearby, or `null` when the
 * search is live but unpaired — in that case the caller should wait on
 * subscribeToMatches(), which fires the moment another user matches them.
 */
export async function requestMatch(opts: {
  lat: number;
  lng: number;
  category?: MatchCategory;
  radiusKm?: number;
  userName?: string;
  userAvatar?: string;
}): Promise<MatchRow | null> {
  const { data, error } = await supabase.rpc("find_or_create_match", {
    p_lat: opts.lat,
    p_lng: opts.lng,
    p_category: opts.category ?? "Walking",
    p_radius_km: opts.radiusKm ?? 3,
    p_name: opts.userName ?? null,
    p_avatar: opts.userAvatar ?? null,
  });

  if (error) throw error;
  // The RPC returns a single row, or null while still waiting.
  const row = Array.isArray(data) ? data[0] : data;
  return (row as MatchRow) ?? null;
}

/** Stops the caller's active search. */
export async function cancelMatchRequest(): Promise<void> {
  const { error } = await supabase.rpc("cancel_match_request");
  if (error) throw error;
}

/** The caller's current active match, if any. */
export async function fetchActiveMatch(userId: string): Promise<MatchRow | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "active")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as MatchRow) ?? null;
}

/** Marks a match finished (both met up) or cancelled (someone bailed). */
export async function updateMatchStatus(
  matchId: string,
  status: "completed" | "cancelled"
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({ status })
    .eq("id", matchId);
  if (error) throw error;
}

/**
 * Live match notifications. Fires when a match involving `userId` is
 * created or changes — this is how the user who was *waiting* finds out
 * they've been paired, without polling.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToMatches(
  userId: string,
  onMatch: (match: MatchRow) => void
): () => void {
  const channel = supabase
    .channel(`walkbuddy-matches-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches" },
      (payload) => {
        const row = payload.new as MatchRow | undefined;
        if (!row) return;
        // Realtime has no per-user filter for OR conditions, so screen here.
        if (row.user_a === userId || row.user_b === userId) onMatch(row);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
