import React, { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Trees,
  Check,
  User,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  Footprints,
  Compass,
  Flame,
  Sparkles,
  MapPin,
  Clock,
  Users,
  Music,
  Target,
  Eye,
  Siren,
  Sun,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Gauge,
  Zap,
} from "lucide-react";
import FirefliesCanvas from "./FirefliesCanvas";
import FogTransition from "./FogTransition";
import { DEFAULT_AVATARS } from "../types";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  ProfileRow,
  ProfilePreferencesRow,
  SafetySettingsRow,
  ensureProfile,
  fetchProfilePreferences,
  fetchSafetySettings,
  saveProfile,
  saveProfilePreferences,
  saveSafetySettings,
  signInWithGoogle,
  signOut,
} from "../lib/db";

/* ==================================================================== */
/*  SHARED SHELL — matches the dashboard: bioluminescent forest theme,   */
/*  firefly canvas, fog page transitions, glass panels, Montserrat.      */
/* ==================================================================== */

export type OnboardingStep = "signin" | "personal" | "survey" | "terms";

const STEP_ORDER: OnboardingStep[] = ["signin", "personal", "survey", "terms"];

const STEP_META: Record<OnboardingStep, { label: string; blurb: string }> = {
  signin: { label: "Sign In", blurb: "Enter the grove" },
  personal: { label: "Profile", blurb: "Who's walking" },
  survey: { label: "Preferences", blurb: "How you move" },
  terms: { label: "Terms", blurb: "The trail rules" },
};

interface OnboardingFlowProps {
  /** Null until Google sign-in completes. */
  session: Session | null;
  /** Existing profile row, if the user is resuming a half-finished onboarding. */
  profile: ProfileRow | null;
  /** Fired once every step is saved and `onboarding_completed` is true. */
  onComplete: (profile: ProfileRow) => void;
}

function StepProgress({ current }: { current: OnboardingStep }) {
  const currentIndex = STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-1.5 md:gap-3 w-full max-w-xl mx-auto">
      {STEP_ORDER.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  done
                    ? "bg-[#00ffc8] border-[#00ffc8] text-black shadow-[0_0_15px_rgba(0,255,200,0.5)]"
                    : active
                    ? "bg-[#00ffc8]/15 border-[#00ffc8] text-[#00ffc8] shadow-[0_0_18px_rgba(0,255,200,0.35)] scale-110"
                    : "bg-white/5 border-white/10 text-emerald-200/40"
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-[11px] font-black">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[8px] md:text-[9px] uppercase font-black tracking-wider transition-colors ${
                  active ? "text-[#00ffc8]" : done ? "text-emerald-200/70" : "text-emerald-200/35"
                }`}
              >
                {STEP_META[step].label}
              </span>
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full bg-white/10 overflow-hidden -mt-5">
                <div
                  className={`h-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] transition-all duration-700 ${
                    i < currentIndex ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Dashboard-style section card. */
function Panel({
  icon,
  title,
  subtitle,
  accent = "#00ffc8",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-5 md:p-6 rounded-2xl space-y-4 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${accent}1a` }}
      />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
          style={{
            background: `${accent}26`,
            borderColor: `${accent}4d`,
            color: accent,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-headline text-sm font-extrabold text-white uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-emerald-200/70 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="relative z-10 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="text-[10px] text-emerald-200/80 uppercase font-black mb-1.5 flex items-center gap-1.5">
      {icon}
      <span>{children}</span>
    </label>
  );
}

/**
 * The pre-existing `profile_preferences.group_size_preference` column is an
 * INTEGER head-count rather than a label, so the UI options map to
 * representative party sizes on the way in and back to labels on the way out.
 */
const GROUP_SIZE_OPTIONS = ["Solo", "One buddy", "Small group", "Large group"];

const GROUP_SIZE_TO_COUNT: Record<string, number> = {
  Solo: 1,
  "One buddy": 2,
  "Small group": 5,
  "Large group": 12,
};

function countToGroupSize(count: number | null | undefined): string {
  if (count == null) return "One buddy";
  if (count <= 1) return "Solo";
  if (count <= 2) return "One buddy";
  if (count <= 6) return "Small group";
  return "Large group";
}

/** Whole years between a YYYY-MM-DD birth date and today. null if unparseable. */
function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** The furthest-back and most-recent DOBs allowed (ages 120 and 13). */
const DOB_MIN = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0];
})();
const DOB_MAX = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split("T")[0];
})();

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-200/30 focus:outline-none focus:border-[#00ffc8] transition-colors";

const selectClass =
  "w-full bg-[#041812] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors";

/** Multi- or single-select pill group. */
function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
  accent = "#00ffc8",
}: {
  options: string[];
  value: string[] | string | null;
  onChange: (next: any) => void;
  multi?: boolean;
  accent?: string;
}) {
  const selected = (v: string) => (multi ? (value as string[]).includes(v) : value === v);

  const toggle = (v: string) => {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3.5 py-2 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
              isOn
                ? "text-black"
                : "bg-white/5 border-white/10 text-emerald-100/80 hover:bg-white/10 hover:text-white"
            }`}
            style={
              isOn
                ? {
                    background: accent,
                    borderColor: accent,
                    boxShadow: `0 0 15px ${accent}66`,
                  }
                : undefined
            }
          >
            {isOn && <Check className="w-3 h-3 inline mr-1 -mt-0.5 stroke-[3]" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Safety toggle row. */
function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  accent = "#00ffc8",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
        checked
          ? "bg-[#00ffc8]/8 border-[#00ffc8]/35"
          : "bg-white/5 border-white/10 hover:bg-white/8"
      }`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
        style={{
          background: checked ? `${accent}26` : "rgba(255,255,255,0.05)",
          borderColor: checked ? `${accent}4d` : "rgba(255,255,255,0.1)",
          color: checked ? accent : "rgba(167, 243, 208, 0.5)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold text-white">{title}</div>
        <div className="text-[10px] text-emerald-200/60 font-medium leading-snug">
          {description}
        </div>
      </div>
      <div
        className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-all ${
          checked ? "bg-[#00ffc8] shadow-[0_0_12px_rgba(0,255,200,0.5)]" : "bg-white/15"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-400/35 text-red-200 text-[11px] font-semibold leading-relaxed">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  busy,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-[0_4px_25px_rgba(0,255,200,0.4)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/* ==================================================================== */
/*  MAIN FLOW CONTROLLER                                                */
/* ==================================================================== */

export default function OnboardingFlow({ session, profile, onComplete }: OnboardingFlowProps) {
  const user = session?.user ?? null;

  /* --- Which step are we on? Derived once, then user-driven. --- */
  const initialStep = useMemo<OnboardingStep>(() => {
    if (!session) return "signin";
    if (!profile?.full_name || !profile?.date_of_birth) return "personal";
    if (!profile?.terms_accepted) return "survey";
    return "terms";
  }, [session, profile]);

  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Jump forward as soon as a session appears after the OAuth redirect.
  useEffect(() => {
    if (session && step === "signin") setStep(initialStep === "signin" ? "personal" : initialStep);
  }, [session, step, initialStep]);

  /* ---------------- SECTION 2 state — personal info ---------------- */
  const [fullName, setFullName] = useState("");
  // Date of birth is the source of truth; age is derived from it (see ageFromDob).
  const [dob, setDob] = useState("");
  const age = useMemo(() => {
    const a = ageFromDob(dob);
    return a == null ? "" : String(a);
  }, [dob]);
  const [gender, setGender] = useState("Prefer not to say");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0].url);

  /* ---------------- SECTION 3 state — survey ----------------------- */
  const [preferredActivities, setPreferredActivities] = useState<string[]>(["Walking"]);
  const [experienceLevel, setExperienceLevel] = useState<string>("Beginner");
  const [preferredTimes, setPreferredTimes] = useState<string[]>(["Morning"]);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState("15");
  const [dailyStepsGoal, setDailyStepsGoal] = useState("10000");
  const [typicalPace, setTypicalPace] = useState("Steady");
  const [terrainPreferences, setTerrainPreferences] = useState<string[]>(["Park trail"]);
  const [groupSize, setGroupSize] = useState("One buddy");
  const [buddyGenderPreference, setBuddyGenderPreference] = useState("Any");
  const [audioPreference, setAudioPreference] = useState("Music");
  const [motivations, setMotivations] = useState<string[]>(["Stay active"]);
  const [maxBuddyDistanceKm, setMaxBuddyDistanceKm] = useState("5");
  const [aiCoachOptIn, setAiCoachOptIn] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const [shareLiveLocation, setShareLiveLocation] = useState(true);
  const [daylightHoursOnly, setDaylightHoursOnly] = useState(false);
  const [verifiedBuddiesOnly, setVerifiedBuddiesOnly] = useState(true);
  const [womenOnlyMatching, setWomenOnlyMatching] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("Buddies only");
  const [shareRouteHistory, setShareRouteHistory] = useState(false);
  const [autoCheckinMinutes, setAutoCheckinMinutes] = useState("30");
  const [sosShortcutEnabled, setSosShortcutEnabled] = useState(true);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  /* ---------------- SECTION 4 state — terms ------------------------ */
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSafety, setAcceptedSafety] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  /* --- Prefill from Google metadata + any rows already in Supabase --- */
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata || {}) as Record<string, string>;

    setFullName((prev) => prev || profile?.full_name || meta.full_name || meta.name || "");
    setDob((prev) => prev || profile?.date_of_birth || "");
    setGender((prev) => profile?.gender || prev);
    setPhone((prev) => prev || profile?.phone || "");
    setCity((prev) => profile?.city || prev);
    setAvatarUrl(
      (prev) => profile?.avatar_url || meta.avatar_url || meta.picture || prev
    );
    setMarketingOptIn((prev) => profile?.marketing_opt_in ?? prev);
  }, [user, profile]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      try {
        const [prefs, safety] = await Promise.all([
          fetchProfilePreferences(user.id),
          fetchSafetySettings(user.id),
        ]);
        if (cancelled) return;

        if (prefs) {
          if (prefs.preferred_activities?.length) setPreferredActivities(prefs.preferred_activities);
          if (prefs.experience_level) setExperienceLevel(prefs.experience_level);
          if (prefs.preferred_times?.length) setPreferredTimes(prefs.preferred_times);
          if (prefs.weekly_goal_km != null) setWeeklyGoalKm(String(prefs.weekly_goal_km));
          if (prefs.daily_steps_goal != null) setDailyStepsGoal(String(prefs.daily_steps_goal));
          if (prefs.typical_pace) setTypicalPace(prefs.typical_pace);
          if (prefs.terrain_preferences?.length) setTerrainPreferences(prefs.terrain_preferences);
          if (prefs.group_size_preference != null)
            setGroupSize(countToGroupSize(prefs.group_size_preference));
          if (prefs.buddy_gender_preference) setBuddyGenderPreference(prefs.buddy_gender_preference);
          if (prefs.audio_preference) setAudioPreference(prefs.audio_preference);
          if (prefs.motivations?.length) setMotivations(prefs.motivations);
          if (prefs.max_buddy_distance_km != null)
            setMaxBuddyDistanceKm(String(prefs.max_buddy_distance_km));
          setAiCoachOptIn(prefs.ai_coach_opt_in);
          setPushNotifications(prefs.push_notifications);
        }

        if (safety) {
          setShareLiveLocation(safety.share_live_location);
          setDaylightHoursOnly(safety.daylight_hours_only);
          setVerifiedBuddiesOnly(safety.verified_buddies_only);
          setWomenOnlyMatching(safety.women_only_matching);
          if (safety.profile_visibility) setProfileVisibility(safety.profile_visibility);
          setShareRouteHistory(safety.share_route_history);
          if (safety.auto_checkin_minutes != null)
            setAutoCheckinMinutes(String(safety.auto_checkin_minutes));
          setSosShortcutEnabled(safety.sos_shortcut_enabled);
          setEmergencyContactName(safety.emergency_contact_name || "");
          setEmergencyContactPhone(safety.emergency_contact_phone || "");
        }
      } catch (err) {
        // Non-fatal: the user can still fill the survey from scratch.
        console.warn("[WalkBuddy] Could not prefill onboarding answers:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ================================================================ */
  /*  SECTION 1 — GOOGLE SIGN-IN                                      */
  /* ================================================================ */

  const handleGoogleSignIn = async () => {
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server."
      );
      return;
    }

    setBusy(true);
    try {
      // Redirects the browser to Google; the app reloads with a session.
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  const renderSignIn = () => (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#00ffc8]/15 border border-[#00ffc8]/30 flex items-center justify-center shadow-[0_0_35px_rgba(0,255,200,0.3)]">
          <Trees className="w-10 h-10 text-[#00ffc8]" />
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-black bioluminescent-text italic tracking-tighter">
          WalkBuddy
        </h1>
        <p className="text-sm text-emerald-100/80 font-medium leading-relaxed max-w-xs mx-auto">
          Find scenic routes, track every step, and walk with buddies who move
          like you do.
        </p>
      </div>

      {/* Feature strip — same tile language as the dashboard metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Footprints className="w-4.5 h-4.5" />, label: "Track Steps", color: "#00ffc8" },
          { icon: <Compass className="w-4.5 h-4.5" />, label: "Scenic Routes", color: "#00e5ff" },
          { icon: <Flame className="w-4.5 h-4.5" />, label: "AI Coaching", color: "#adff2f" },
        ].map((f) => (
          <div
            key={f.label}
            className="glass-panel p-3.5 rounded-2xl flex flex-col items-center gap-2 text-center"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{ background: `${f.color}26`, borderColor: `${f.color}4d`, color: f.color }}
            >
              {f.icon}
            </div>
            <span className="text-[9px] uppercase font-black tracking-wider text-emerald-100/80">
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* Sign-in card */}
      <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-headline text-base font-extrabold text-white uppercase tracking-wider">
            Enter The Grove
          </h2>
          <p className="text-[11px] text-emerald-200/70 font-medium">
            Sign in with Google to sync your trails across devices
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full bg-white hover:bg-emerald-50 text-[#041812] font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-[0_4px_25px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <svg className="w-4.5 h-4.5" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          )}
          <span>{busy ? "Opening Google…" : "Continue with Google"}</span>
        </button>

        <div className="flex items-center gap-2 text-emerald-200/50 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex-1 h-px bg-white/10" />
          <span>Secure OAuth</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <p className="text-[10px] text-emerald-200/55 text-center leading-relaxed">
          We only read your name, email and profile photo. By continuing you
          agree to our Terms of Service and Privacy Policy — the full text is on
          the last step.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-200/50 font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00ffc8]" />
        <span>Location is only shared during an active walk</span>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  SECTION 2 — PERSONAL INFO (name, date of birth) → profiles      */
  /* ================================================================ */

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const derivedAge = ageFromDob(dob);

    if (trimmedName.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }
    if (derivedAge == null || derivedAge < 13 || derivedAge > 120) {
      setError("You must be between 13 and 120 years old. Please check your date of birth.");
      return;
    }
    if (!user) {
      setError("Your session expired. Please sign in with Google again.");
      setStep("signin");
      return;
    }

    setBusy(true);
    try {
      // Make sure the row exists (covers projects without the signup trigger).
      await ensureProfile({
        id: user.id,
        email: user.email,
        fullName: trimmedName,
        avatarUrl,
      });

      await saveProfile(user.id, {
        email: user.email ?? null,
        full_name: trimmedName,
        date_of_birth: dob,
        age: derivedAge, // kept in sync so the dashboard can read age directly
        gender,
        phone: phone.trim() || null,
        city: city.trim() || null,
        avatar_url: avatarUrl,
      });

      setStep("survey");
    } catch (err: any) {
      setError(err?.message || "Could not save your personal info. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const renderPersonalInfo = () => (
    <form onSubmit={handleSavePersonalInfo} className="w-full max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="font-headline text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">
          Personal Info
        </h2>
        <p className="text-xs text-emerald-200/70 font-medium">
          This is what your walking buddies will see on the trail
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Identity card — mirrors the dashboard profile drawer header */}
      <Panel icon={<User className="w-5 h-5" />} title="Your Identity" subtitle="Name and date of birth are required">
        <div className="flex items-center gap-4 bg-[#06241b] p-4 rounded-2xl border border-[#00ffc8]/30">
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt={fullName || "WalkBuddy user"}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#00ffc8] shadow-[0_0_20px_rgba(0,255,200,0.4)]"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#00ffc8] p-1 rounded-full text-black">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          <div className="overflow-hidden">
            <h4 className="font-headline text-lg font-black text-white truncate">
              {fullName || "WalkBuddy User"}
            </h4>
            <p className="text-xs text-emerald-200/70 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#00ffc8]" />
              <span>{user?.email || "user@walkbuddy.io"}</span>
            </p>
            <span className="inline-block mt-1 bg-[#00ffc8]/15 border border-[#00ffc8]/30 text-[#00ffc8] text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
              {gender} • {age || "--"} yrs
            </span>
          </div>
        </div>

        <div>
          <FieldLabel icon={<User className="w-3 h-3 text-[#00ffc8]" />}>Full Name *</FieldLabel>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<Calendar className="w-3 h-3 text-[#00ffc8]" />}>
              Date of Birth *
            </FieldLabel>
            <input
              type="date"
              min={DOB_MIN}
              max={DOB_MAX}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
            />
            {age && (
              <p className="text-[10px] text-[#00ffc8]/80 font-bold mt-1">{age} years old</p>
            )}
          </div>
          <div>
            <FieldLabel icon={<ShieldCheck className="w-3 h-3 text-[#00ffc8]" />}>Gender</FieldLabel>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={selectClass}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<Phone className="w-3 h-3 text-[#00ffc8]" />}>Phone (optional)</FieldLabel>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel icon={<MapPin className="w-3 h-3 text-[#00ffc8]" />}>Home City</FieldLabel>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
              className={inputClass}
            />
          </div>
        </div>
      </Panel>

      {/* Avatar picker — same 20 nature avatars as the dashboard drawer */}
      <Panel
        icon={<Sparkles className="w-5 h-5" />}
        title="Pick Your Trail Avatar"
        subtitle="20 bioluminescent forest entities"
        accent="#00e5ff"
      >
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5 bg-[#020b08] p-3 rounded-2xl border border-white/10 max-h-44 overflow-y-auto">
          {DEFAULT_AVATARS.map((avatar) => {
            const isSelected = avatarUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setAvatarUrl(avatar.url)}
                title={avatar.label}
                className={`relative rounded-full aspect-square overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-[#00ffc8] ring-offset-2 ring-offset-[#020b08] scale-105 shadow-[0_0_12px_#00ffc8]"
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
              >
                <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#00ffc8]/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <PrimaryButton type="submit" busy={busy}>
        <span>Save &amp; Continue</span>
        {!busy && <ArrowRight className="w-4 h-4" />}
      </PrimaryButton>
    </form>
  );

  /* ================================================================ */
  /*  SECTION 3 — SURVEY → profile_preferences + safety_settings      */
  /* ================================================================ */

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (preferredActivities.length === 0) {
      setError("Pick at least one activity you enjoy.");
      return;
    }
    if (preferredTimes.length === 0) {
      setError("Pick at least one time of day you like to head out.");
      return;
    }
    if (terrainPreferences.length === 0) {
      setError("Pick at least one kind of terrain.");
      return;
    }
    if (motivations.length === 0) {
      setError("Tell us what keeps you moving — pick at least one motivation.");
      return;
    }
    if (sosShortcutEnabled && !emergencyContactPhone.trim()) {
      setError(
        "An emergency contact number is required while the SOS shortcut is on. Add one, or switch SOS off."
      );
      return;
    }
    if (!user) {
      setError("Your session expired. Please sign in with Google again.");
      setStep("signin");
      return;
    }

    setBusy(true);
    try {
      const prefs: Omit<ProfilePreferencesRow, "profile_id"> = {
        preferred_activities: preferredActivities,
        experience_level: experienceLevel,
        preferred_times: preferredTimes,
        weekly_goal_km: parseFloat(weeklyGoalKm) || null,
        daily_steps_goal: parseInt(dailyStepsGoal, 10) || null,
        typical_pace: typicalPace,
        terrain_preferences: terrainPreferences,
        group_size_preference: GROUP_SIZE_TO_COUNT[groupSize] ?? null,
        buddy_gender_preference: buddyGenderPreference,
        audio_preference: audioPreference,
        motivations,
        max_buddy_distance_km: parseFloat(maxBuddyDistanceKm) || null,
        ai_coach_opt_in: aiCoachOptIn,
        push_notifications: pushNotifications,
      };

      const safety: Omit<SafetySettingsRow, "profile_id"> = {
        share_live_location: shareLiveLocation,
        daylight_hours_only: daylightHoursOnly,
        verified_buddies_only: verifiedBuddiesOnly,
        women_only_matching: womenOnlyMatching,
        profile_visibility: profileVisibility,
        share_route_history: shareRouteHistory,
        auto_checkin_minutes: parseInt(autoCheckinMinutes, 10) || null,
        sos_shortcut_enabled: sosShortcutEnabled,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
      };

      await Promise.all([
        saveProfilePreferences(user.id, prefs),
        saveSafetySettings(user.id, safety),
        // Keep the step goal on the profile too — the dashboard reads it there.
        saveProfile(user.id, { daily_steps_goal: parseInt(dailyStepsGoal, 10) || 10000 }),
      ]);

      setStep("terms");
    } catch (err: any) {
      setError(err?.message || "Could not save your preferences. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const renderSurvey = () => (
    <form onSubmit={handleSaveSurvey} className="w-full max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="font-headline text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">
          How You Move
        </h2>
        <p className="text-xs text-emerald-200/70 font-medium">
          Your answers tune route suggestions, buddy matching and the AI coach
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ---- profile_preferences ---- */}
      <Panel
        icon={<Footprints className="w-5 h-5" />}
        title="Activities You Enjoy"
        subtitle="Select every activity that applies"
      >
        <ChipGroup
          multi
          options={["Walking", "Jogging", "Sprinting", "Hiking", "Trail running"]}
          value={preferredActivities}
          onChange={setPreferredActivities}
        />
        <div>
          <FieldLabel icon={<Gauge className="w-3 h-3 text-[#00ffc8]" />}>Experience Level</FieldLabel>
          <ChipGroup
            options={["Beginner", "Intermediate", "Advanced", "Athlete"]}
            value={experienceLevel}
            onChange={setExperienceLevel}
          />
        </div>
        <div>
          <FieldLabel icon={<Zap className="w-3 h-3 text-[#00ffc8]" />}>Typical Pace</FieldLabel>
          <ChipGroup
            options={["Relaxed", "Steady", "Brisk", "Race pace"]}
            value={typicalPace}
            onChange={setTypicalPace}
          />
        </div>
      </Panel>

      <Panel
        icon={<Clock className="w-5 h-5" />}
        title="When & Where"
        subtitle="Time of day and terrain you prefer"
        accent="#00e5ff"
      >
        <div>
          <FieldLabel icon={<Sun className="w-3 h-3 text-[#00e5ff]" />}>Preferred Times</FieldLabel>
          <ChipGroup
            multi
            accent="#00e5ff"
            options={["Sunrise", "Morning", "Afternoon", "Evening", "Night"]}
            value={preferredTimes}
            onChange={setPreferredTimes}
          />
        </div>
        <div>
          <FieldLabel icon={<MapPin className="w-3 h-3 text-[#00e5ff]" />}>Terrain</FieldLabel>
          <ChipGroup
            multi
            accent="#00e5ff"
            options={["Park trail", "Lakeside", "City street", "Hills", "Forest path", "Track"]}
            value={terrainPreferences}
            onChange={setTerrainPreferences}
          />
        </div>
        <div>
          <FieldLabel icon={<Music className="w-3 h-3 text-[#00e5ff]" />}>While You Walk</FieldLabel>
          <ChipGroup
            accent="#00e5ff"
            options={["Music", "Podcast", "Nature sounds", "Silence"]}
            value={audioPreference}
            onChange={setAudioPreference}
          />
        </div>
      </Panel>

      <Panel
        icon={<Target className="w-5 h-5" />}
        title="Your Goals"
        subtitle="We'll track progress against these"
        accent="#adff2f"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<Compass className="w-3 h-3 text-[#adff2f]" />}>Weekly Goal (km)</FieldLabel>
            <input
              type="number"
              step="0.5"
              min="0"
              value={weeklyGoalKm}
              onChange={(e) => setWeeklyGoalKm(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel icon={<Footprints className="w-3 h-3 text-[#adff2f]" />}>Daily Step Goal</FieldLabel>
            <input
              type="number"
              step="500"
              min="0"
              value={dailyStepsGoal}
              onChange={(e) => setDailyStepsGoal(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <FieldLabel icon={<Flame className="w-3 h-3 text-[#adff2f]" />}>What Keeps You Moving</FieldLabel>
          <ChipGroup
            multi
            accent="#adff2f"
            options={[
              "Stay active",
              "Weight loss",
              "Build endurance",
              "Mental health",
              "Meet people",
              "Train for an event",
            ]}
            value={motivations}
            onChange={setMotivations}
          />
        </div>
      </Panel>

      <Panel
        icon={<Users className="w-5 h-5" />}
        title="Buddy Matching"
        subtitle="Who you'd like to walk with"
      >
        <div>
          <FieldLabel icon={<Users className="w-3 h-3 text-[#00ffc8]" />}>Group Size</FieldLabel>
          <ChipGroup
            options={GROUP_SIZE_OPTIONS}
            value={groupSize}
            onChange={setGroupSize}
          />
        </div>
        <div>
          <FieldLabel icon={<ShieldCheck className="w-3 h-3 text-[#00ffc8]" />}>Buddy Gender Preference</FieldLabel>
          <ChipGroup
            options={["Any", "Same gender as me", "No preference set"]}
            value={buddyGenderPreference}
            onChange={setBuddyGenderPreference}
          />
        </div>
        <div>
          <FieldLabel icon={<MapPin className="w-3 h-3 text-[#00ffc8]" />}>
            Match Buddies Within ({maxBuddyDistanceKm} km)
          </FieldLabel>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={maxBuddyDistanceKm}
            onChange={(e) => setMaxBuddyDistanceKm(e.target.value)}
            className="w-full accent-[#00ffc8] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-emerald-200/50 font-bold uppercase mt-1">
            <span>1 km</span>
            <span>25 km</span>
          </div>
        </div>
        <ToggleRow
          icon={<Sparkles className="w-4.5 h-4.5" />}
          title="Gemini AI Coach"
          description="Let the AI coach build personalised interval plans for you"
          checked={aiCoachOptIn}
          onChange={setAiCoachOptIn}
        />
        <ToggleRow
          icon={<Zap className="w-4.5 h-4.5" />}
          title="Push Notifications"
          description="Buddy pings, meetup invites and streak reminders"
          checked={pushNotifications}
          onChange={setPushNotifications}
        />
      </Panel>

      {/* ---- safety_settings ---- */}
      <Panel
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Safety & Privacy"
        subtitle="Saved to your safety settings — change any time"
        accent="#00e5ff"
      >
        <ToggleRow
          icon={<MapPin className="w-4.5 h-4.5" />}
          title="Share Live Location"
          description="Only with joined buddies, and only during an active walk"
          checked={shareLiveLocation}
          onChange={setShareLiveLocation}
        />
        <ToggleRow
          icon={<Sun className="w-4.5 h-4.5" />}
          title="Daylight Hours Only"
          description="Hide meetup pings that start after sunset"
          checked={daylightHoursOnly}
          onChange={setDaylightHoursOnly}
        />
        <ToggleRow
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          title="Verified Buddies Only"
          description="Match only with users who completed identity verification"
          checked={verifiedBuddiesOnly}
          onChange={setVerifiedBuddiesOnly}
        />
        <ToggleRow
          icon={<Users className="w-4.5 h-4.5" />}
          title="Women-Only Matching"
          description="Restrict buddy suggestions and meetups to women"
          checked={womenOnlyMatching}
          onChange={setWomenOnlyMatching}
        />
        <ToggleRow
          icon={<Eye className="w-4.5 h-4.5" />}
          title="Share Route History"
          description="Let buddies see the trails you've completed before"
          checked={shareRouteHistory}
          onChange={setShareRouteHistory}
        />
        <ToggleRow
          icon={<Siren className="w-4.5 h-4.5" />}
          title="SOS Shortcut"
          description="Triple-tap during a walk to alert your emergency contact"
          checked={sosShortcutEnabled}
          onChange={setSosShortcutEnabled}
        />

        <div>
          <FieldLabel icon={<Eye className="w-3 h-3 text-[#00e5ff]" />}>Profile Visibility</FieldLabel>
          <ChipGroup
            accent="#00e5ff"
            options={["Public", "Buddies only", "Private"]}
            value={profileVisibility}
            onChange={setProfileVisibility}
          />
        </div>

        <div>
          <FieldLabel icon={<Clock className="w-3 h-3 text-[#00e5ff]" />}>
            Auto Check-In Reminder
          </FieldLabel>
          <select
            value={autoCheckinMinutes}
            onChange={(e) => setAutoCheckinMinutes(e.target.value)}
            className={selectClass}
          >
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="45">Every 45 minutes</option>
            <option value="60">Every 60 minutes</option>
            <option value="0">Off</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<User className="w-3 h-3 text-[#00e5ff]" />}>Emergency Contact</FieldLabel>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Contact name"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel icon={<Phone className="w-3 h-3 text-[#00e5ff]" />}>
              Contact Number {sosShortcutEnabled && "*"}
            </FieldLabel>
            <input
              type="tel"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("personal");
          }}
          className="col-span-1 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="col-span-2">
          <PrimaryButton type="submit" busy={busy}>
            <span>Save Preferences</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );

  /* ================================================================ */
  /*  SECTION 4 — TERMS & CONDITIONS → completes onboarding           */
  /* ================================================================ */

  const handleAcceptTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    if (!acceptedSafety) {
      setError("Please confirm you've read the trail safety guidelines.");
      return;
    }
    if (!user) {
      setError("Your session expired. Please sign in with Google again.");
      setStep("signin");
      return;
    }

    setBusy(true);
    try {
      const updated = await saveProfile(user.id, {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        marketing_opt_in: marketingOptIn,
        onboarding_completed: true,
      });
      onComplete(updated);
    } catch (err: any) {
      setError(err?.message || "Could not record your acceptance. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const renderTerms = () => (
    <form onSubmit={handleAcceptTerms} className="w-full max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="font-headline text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">
          Trail Rules
        </h2>
        <p className="text-xs text-emerald-200/70 font-medium">
          One last step before the grove opens up
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <Panel
        icon={<FileText className="w-5 h-5" />}
        title="Terms of Service & Privacy"
        subtitle="Last updated 24 July 2026"
      >
        <div className="max-h-72 overflow-y-auto pr-2 space-y-4 text-[11px] text-emerald-100/75 leading-relaxed bg-[#020b08] p-4 rounded-2xl border border-white/10">
          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              1. Your Account
            </h4>
            <p>
              You sign in with Google, and you're responsible for keeping that
              account secure. You must be at least 13 years old to use
              WalkBuddy. Everything you tell us during onboarding — your name,
              age, preferences and safety settings — is stored against your
              account so we can personalise routes, buddy matches and coaching.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              2. Health & Physical Activity
            </h4>
            <p>
              WalkBuddy is a fitness companion, not a medical service. Workout
              plans, pace targets and AI coaching suggestions are general
              guidance only. Talk to a qualified healthcare professional before
              starting a new exercise programme, and stop immediately if you
              feel unwell. You take part in every walk, jog and sprint at your
              own risk.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              3. Meeting Other Users
            </h4>
            <p>
              Meetup pings connect you with people you may not know. Always meet
              in public places, tell someone where you're going, and use the
              in-app safety tools. WalkBuddy does not perform background checks
              and is not responsible for the conduct of other users. Report
              anyone who makes you uncomfortable.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              4. Location & Privacy
            </h4>
            <p>
              Live location is shared only while a walk session is active, and
              only with the buddies who joined it — exactly as you configured on
              the previous step. Your activity logs stay private unless you turn
              on route-history sharing. You can change any safety setting, or
              delete your account and all associated data, at any time from your
              profile.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              5. Your Content
            </h4>
            <p>
              Routes, reviews and photos you post stay yours. By posting them
              you give WalkBuddy a licence to display them to other users in the
              feed and on the map. Don't post anything unlawful, harassing, or
              that isn't yours to share.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              6. AI Features
            </h4>
            <p>
              The Gemini-powered coach generates plans from the parameters you
              submit. Generated content can be inaccurate — treat it as a
              suggestion, never as a medical or safety instruction.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[11px] font-black text-[#00ffc8] uppercase tracking-wider mb-1">
              7. Changes
            </h4>
            <p>
              We'll let you know in-app if these terms change materially.
              Continuing to use WalkBuddy after an update means you accept the
              revised terms.
            </p>
          </section>
        </div>
      </Panel>

      <Panel
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Confirm & Continue"
        subtitle="Both boxes are required"
        accent="#adff2f"
      >
        <button
          type="button"
          onClick={() => setAcceptedTerms(!acceptedTerms)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            acceptedTerms
              ? "bg-[#00ffc8]/8 border-[#00ffc8]/35"
              : "bg-white/5 border-white/10 hover:bg-white/8"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              acceptedTerms
                ? "bg-[#00ffc8] border-[#00ffc8] shadow-[0_0_10px_rgba(0,255,200,0.5)]"
                : "bg-transparent border-white/25"
            }`}
          >
            {acceptedTerms && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
          </div>
          <span className="text-[11px] text-emerald-100/85 font-semibold leading-relaxed">
            I have read and accept the WalkBuddy{" "}
            <span className="text-[#00ffc8]">Terms of Service</span> and{" "}
            <span className="text-[#00ffc8]">Privacy Policy</span>, and I confirm
            I am at least 13 years old.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAcceptedSafety(!acceptedSafety)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            acceptedSafety
              ? "bg-[#00ffc8]/8 border-[#00ffc8]/35"
              : "bg-white/5 border-white/10 hover:bg-white/8"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              acceptedSafety
                ? "bg-[#00ffc8] border-[#00ffc8] shadow-[0_0_10px_rgba(0,255,200,0.5)]"
                : "bg-transparent border-white/25"
            }`}
          >
            {acceptedSafety && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
          </div>
          <span className="text-[11px] text-emerald-100/85 font-semibold leading-relaxed">
            I understand WalkBuddy is not a medical service, that I walk at my
            own risk, and that I should meet other users in public places.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMarketingOptIn(!marketingOptIn)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            marketingOptIn
              ? "bg-[#adff2f]/8 border-[#adff2f]/35"
              : "bg-white/5 border-white/10 hover:bg-white/8"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              marketingOptIn
                ? "bg-[#adff2f] border-[#adff2f] shadow-[0_0_10px_rgba(173,255,47,0.5)]"
                : "bg-transparent border-white/25"
            }`}
          >
            {marketingOptIn && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
          </div>
          <span className="text-[11px] text-emerald-100/85 font-semibold leading-relaxed">
            Optional — send me weekly trail highlights and streak nudges.
          </span>
        </button>
      </Panel>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("survey");
          }}
          className="col-span-1 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="col-span-2">
          <PrimaryButton type="submit" busy={busy} disabled={!acceptedTerms || !acceptedSafety}>
            <span>Enter WalkBuddy</span>
            {!busy && <Trees className="w-4 h-4" />}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );

  /* ================================================================ */
  /*  SHELL                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-[#020b08] text-white flex flex-col relative font-sans overflow-x-hidden">
      <FirefliesCanvas density="magical" />

      {/* Header — identical language to the dashboard header */}
      <header className="sticky top-0 z-[100] bg-[#04120e]/90 backdrop-blur-2xl border-b border-[#00ffc8]/20 px-4 md:px-10 py-3.5 flex justify-between items-center shadow-lg">
        <div className="font-headline text-[22px] md:text-[28px] font-black bioluminescent-text italic tracking-tighter flex items-center gap-2">
          <Trees className="w-6 h-6 text-[#00ffc8]" />
          <span>WalkBuddy</span>
        </div>

        {session ? (
          <button
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
            className="text-[10px] uppercase font-black tracking-wider text-emerald-200/70 hover:text-white px-3 py-2 rounded-xl bg-[#041d16] border border-[#00ffc8]/30 transition-colors"
          >
            Sign Out
          </button>
        ) : (
          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200/50">
            Getting Started
          </span>
        )}
      </header>

      {/* Progress stepper */}
      <div className="relative z-20 px-4 md:px-10 pt-6 pb-2">
        <StepProgress current={step} />
      </div>

      {/* Step content with the app's signature fog transition */}
      <main className="flex-1 w-full px-4 md:px-10 py-6 z-20">
        <FogTransition currentTab={step}>
          {step === "signin" && renderSignIn()}
          {step === "personal" && renderPersonalInfo()}
          {step === "survey" && renderSurvey()}
          {step === "terms" && renderTerms()}
        </FogTransition>
      </main>

      <footer className="relative z-20 text-center text-[10px] text-emerald-200/40 font-bold uppercase tracking-wider pb-6">
        {STEP_META[step].blurb} • Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}
      </footer>
    </div>
  );
}
