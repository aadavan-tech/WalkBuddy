import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Images,
  Upload,
} from "lucide-react";
import FogTransition from "./FogTransition";
import LoopLogo from "./LoopLogo";
import DatePicker from "./DatePicker";
import { DEFAULT_AVATARS } from "../types";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  ProfileRow,
  ProfilePreferencesRow,
  SafetySettingsRow,
  ensureProfile,
  fetchProfilePreferences,
  fetchSafetySettings,
  isUsernameAvailable,
  isPhoneNumberAvailable,
  normalizeUsername,
  normalizePhoneNumber,
  saveProfile,
  saveProfilePreferences,
  saveSafetySettings,
  signInWithGoogle,
  signOut,
  validateUsername,
  validatePhoneNumber,
} from "../lib/db";

/* ==================================================================== */
/*  SHARED SHELL — matches the dashboard: bioluminescent forest theme,   */
/*  firefly canvas, fog page transitions, glass panels, Montserrat.      */
/* ==================================================================== */

export type OnboardingStep =
  | "signin"
  | "personal"
  | "activities"
  | "whenwhere"
  | "goals"
  | "buddy"
  | "safety"
  | "terms";

/**
 * The preferences survey is deliberately split into small checkpoints rather
 * than one long scroll — each screen asks about a single theme.
 */
const STEP_ORDER: OnboardingStep[] = [
  "signin",
  "personal",
  "activities",
  "whenwhere",
  "goals",
  "buddy",
  "safety",
  "terms",
];

const STEP_META: Record<OnboardingStep, { label: string; blurb: string }> = {
  signin: { label: "Sign In", blurb: "Enter the grove" },
  personal: { label: "Profile", blurb: "Who's walking" },
  activities: { label: "Activities", blurb: "What you enjoy" },
  whenwhere: { label: "When", blurb: "Time and terrain" },
  goals: { label: "Goals", blurb: "What you're chasing" },
  buddy: { label: "Buddies", blurb: "Who you walk with" },
  safety: { label: "Safety", blurb: "Staying safe out there" },
  terms: { label: "Terms", blurb: "The trail rules" },
};

interface OnboardingFlowProps {
  /** Null until Google sign-in completes. */
  session: Session | null;
  /** Existing profile row, if the user is resuming a half-finished onboarding. */
  profile: ProfileRow | null;
  /** Fired once every step is saved and `onboarding_completed` is true. */
  onComplete: (profile: ProfileRow) => void;
  /** Direct bypass callback for local development */
  onSkipForUser?: () => void;
}

/**
 * Reveals progress step by step — only steps already reached get a dot, and
 * only the current step's name is shown, so the full 8-step roadmap never
 * spoils itself upfront.
 */
function StepProgress({ current }: { current: OnboardingStep }) {
  const currentIndex = STEP_ORDER.indexOf(current);
  const total = STEP_ORDER.length;
  const percent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-headline text-sm font-extrabold text-black uppercase tracking-wide">
          {STEP_META[current].label}
        </span>
        <span className="text-[11px] uppercase font-black tracking-wider text-gray-500">
          Step {currentIndex + 1} of {total}
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Only steps reached so far get a dot — nothing ahead is revealed. */}
      <div className="flex items-center gap-1.5">
        {STEP_ORDER.slice(0, currentIndex + 1).map((step, i) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? "w-6 bg-black" : "w-1.5 bg-black/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Dashboard-style section card. */
function Panel({
  icon,
  title,
  subtitle,
  accent = "#21190f",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 pt-6 border-t border-black/20 first:pt-0 first:border-t-0">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="font-headline text-base md:text-lg font-extrabold text-black uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[13px] text-gray-500 font-medium mt-0.5 text-accent-serif">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="text-[12px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1.5">
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

const inputClass =
  "w-full bg-black/5 border border-black/30 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors";

/**
 * Native <select> restyled to match the app: light surface, black focus
 * ring, and a custom chevron (the default one ignores our palette).
 */
const selectClass =
  "wb-select w-full bg-[#f0e4cc] border border-black/30 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-black focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer";

/** Multi- or single-select pill group. */
function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
  accent = "#21190f",
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
            className={`px-4 py-2.5 rounded-full text-[13px] font-bold border transition-all active:scale-95 ${
              isOn
                ? "bg-black border-black text-white"
                : "bg-[#f0e4cc] border-black/30 text-gray-600 hover:bg-[#ecdfc4] hover:text-black"
            }`}
          >
            {isOn && <Check className="w-3 h-3 inline mr-1 -mt-0.5 stroke-[3] text-white" />}
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
  accent = "#21190f",
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
          ? "bg-black/5 border-black/40"
          : "bg-[#f8f1e3] border-black/30 hover:bg-[#f0e4cc]"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
          checked ? "bg-black/10 border-black/40" : "bg-[#f0e4cc] border-black/30"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-extrabold text-black">{title}</div>
        <div className="text-[12px] text-gray-500 font-medium leading-snug mt-0.5">
          {description}
        </div>
      </div>
      <div
        className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-all ${
          checked ? "bg-black" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-[#f8f1e3] transition-transform duration-300 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold leading-relaxed">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-black" />
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
      className="w-full bg-black text-white font-headline font-black text-sm py-4 rounded-xl uppercase tracking-wider shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
      {children}
    </button>
  );
}

/* ==================================================================== */
/*  MAIN FLOW CONTROLLER                                                */
/* ==================================================================== */

export default function OnboardingFlow({
  session,
  profile,
  onComplete,
  onSkipForUser,
}: OnboardingFlowProps) {
  const user = session?.user ?? null;

  /* --- Which step are we on? Derived once, then user-driven. --- */
  const initialStep = useMemo<OnboardingStep>(() => {
    if (!session) return "signin";
    if (!profile?.full_name || !profile?.age) return "personal";
    if (!profile?.terms_accepted) return "activities";
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
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  /** Date of birth (YYYY-MM-DD). Age is derived from it for the `age` column. */
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [city, setCity] = useState("Bengaluru");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0].url);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarUploadRef = useRef<HTMLInputElement | null>(null);

  /** Reads a chosen image file and stores it inline as the avatar. */
  const handleAvatarUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
    setUsername((prev) => prev || profile?.username || "");
    setDob((prev) => prev || localStorage.getItem("walkbuddy_dob") || "");
    setGender((prev) => profile?.gender || prev);
    setPhoneNumber((prev) => prev || profile?.phone_number || profile?.phone?.replace(/^\+\d+\s*/, "") || "");
    setCountryCode((prev) => prev || profile?.country_code || "+91");
    setCity((prev) => profile?.city || prev);
    setAvatarUrl((prev) => profile?.avatar_url || meta.avatar_url || meta.picture || prev);
    setMarketingOptIn((prev) => profile?.marketing_opt_in ?? prev);
  }, [user, profile]);

  useEffect(() => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }

    const validationError = validateUsername(normalized);
    if (validationError) {
      setUsernameStatus("invalid");
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    const timeout = window.setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(normalized, user?.id);
        if (!cancelled) {
          setUsernameStatus(available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) setUsernameStatus("idle");
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [username, user?.id]);

  useEffect(() => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      setPhoneStatus("idle");
      return;
    }

    const validationError = validatePhoneNumber(normalizedPhone);
    if (validationError) {
      setPhoneStatus("invalid");
      return;
    }

    let cancelled = false;
    setPhoneStatus("checking");

    const timeout = window.setTimeout(async () => {
      try {
        const available = await isPhoneNumberAvailable(normalizedPhone, user?.id);
        if (!cancelled) {
          setPhoneStatus(available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) setPhoneStatus("idle");
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [phoneNumber, user?.id]);

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
        console.warn("[Loop] Could not prefill onboarding answers:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Whole years between the entered DOB and today ("" when unset/invalid). */
  const derivedAge = useMemo(() => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const now = new Date();
    let a = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
    return a >= 0 && a < 130 ? String(a) : "";
  }, [dob]);

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
    <div className="w-full max-w-lg mx-auto space-y-7">
      {/* Hero */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <div className="p-3.5 rounded-3xl bg-[#f0e4cc] border border-black/30">
          <LoopLogo size={64} glow={true} />
        </div>
        <div className="font-logo text-4xl md:text-5xl font-semibold bioluminescent-text italic tracking-tighter">
          Loop
        </div>
        <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed max-w-sm mx-auto text-accent-serif">
          Find scenic routes, track every step, and walk with buddies who move
          like you do.
        </p>
      </div>

      {/* Feature strip — same tile language as the dashboard metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Footprints className="w-4.5 h-4.5 text-black" />, label: "Track Steps" },
          { icon: <Compass className="w-4.5 h-4.5 text-black" />, label: "Scenic Routes" },
          { icon: <Users className="w-4.5 h-4.5 text-black" />, label: "Buddy Meetups" },
        ].map((f) => (
          <div
            key={f.label}
            className="glass-panel p-3.5 rounded-2xl flex flex-col items-center gap-2 text-center"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-[#f0e4cc] border-black/30">
              {f.icon}
            </div>
            <span className="text-[11px] uppercase font-black tracking-wider text-gray-600">
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* Sign-in card */}
      <div className="glass-panel-glow p-6 rounded-2xl space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-headline text-xl font-extrabold text-black uppercase tracking-wider">
            Enter The Grove
          </h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed text-accent-serif">
            Sign in with Google to sync your trails across devices
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full bg-[#f8f1e3] hover:bg-[#f8f1e3] border border-black/30 text-black font-headline font-black text-sm py-4 rounded-xl uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin text-black" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
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

        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
          <div className="flex-1 h-px bg-[#ecdfc4]" />
          <span>Secure OAuth</span>
          <div className="flex-1 h-px bg-[#ecdfc4]" />
        </div>

        <p className="text-[13px] text-gray-500 text-center leading-relaxed">
          We only read your name, email and profile photo. By continuing you
          agree to our Terms of Service and Privacy Policy — the full text is on
          the last step.
        </p>

        {onSkipForUser && (
          <div className="pt-3 border-t border-black/30 space-y-2">
            <button
              type="button"
              onClick={onSkipForUser}
              className="w-full bg-black text-white font-headline font-black text-xs py-3.5 px-4 rounded-xl uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4.5 h-4.5 fill-white text-white" />
              <span>Skip Onboarding & Go to Landing Page</span>
            </button>
            <p className="text-[11px] text-gray-500 text-center font-bold tracking-wide">
              Direct Access Mode for guest@loop.dev
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[12px] text-gray-500 font-bold">
        <ShieldCheck className="w-4 h-4 text-black" />
        <span>Location is only shared during an active walk</span>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  SECTION 2 — PERSONAL INFO (name, age) → profiles                */
  /* ================================================================ */

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const normalizedUsername = normalizeUsername(username);
    const trimmedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const parsedAge = parseInt(derivedAge, 10);

    if (trimmedName.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    const usernameValidationError = validateUsername(normalizedUsername);
    if (usernameValidationError) {
      setError(usernameValidationError);
      return;
    }
    if (usernameStatus !== "available") {
      setError("Username must be validated as available before you can continue.");
      return;
    }
    if (trimmedPhoneNumber) {
      const phoneValidationError = validatePhoneNumber(trimmedPhoneNumber);
      if (phoneValidationError) {
        setError(phoneValidationError);
        return;
      }
      if (phoneStatus !== "available") {
        setError("Phone number must be validated as available before you can continue.");
        return;
      }
    }
    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      setError("You must be at least 13 years old to use Loop.");
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
        username: normalizedUsername,
        age: parsedAge,
        gender,
        phone: trimmedPhoneNumber ? `${countryCode}${trimmedPhoneNumber}` : null,
        country_code: countryCode || null,
        phone_number: trimmedPhoneNumber || null,
        city: city.trim() || null,
        avatar_url: avatarUrl,
      });

      localStorage.setItem("walkbuddy_dob", dob);
      setStep("activities");
    } catch (err: any) {
      setError(err?.message || "Could not save your personal info. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const renderPersonalInfo = () => (
    <form onSubmit={handleSavePersonalInfo} className="w-full max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <h1 className="font-headline text-3xl md:text-4xl font-black text-black italic uppercase tracking-tight">
          Personal Info
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-medium text-accent-serif">
          This is what your walking buddies will see on the trail
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Avatar block — big preview on top, picker collapsed underneath */}
      <Panel
        icon={<Sparkles className="w-5 h-5 text-black" />}
        title="Your Trail Avatar"
        subtitle="Pick a forest entity or upload your own photo"
        accent="#21190f"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={fullName || "Loop user"}
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-full object-cover border-4 border-black/40 shadow-md"
            />
            <div className="absolute bottom-1 right-1 bg-black p-1.5 rounded-full text-white">
              <Check className="w-4 h-4 stroke-[3] text-white" />
            </div>
          </div>

          <div className="text-center">
            <h4 className="font-headline text-xl font-black text-black truncate max-w-xs">
              {fullName || "Loop User"}
            </h4>
            <p className="text-sm text-gray-500 truncate flex items-center justify-center gap-1.5 mt-1">
              <Mail className="w-4 h-4 text-black shrink-0" />
              <span>{user?.email || "user@walkbuddy.io"}</span>
            </p>
            <span className="inline-block mt-2 bg-[#f0e4cc] border border-black/30 text-gray-700 text-[11px] font-black uppercase px-3 py-1 rounded-full">
              {gender}
              {derivedAge ? ` \u2022 ${derivedAge} yrs` : ""}
            </span>
          </div>

          <input
            ref={avatarUploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleAvatarUpload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setShowAvatarPicker((v) => !v)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                showAvatarPicker
                  ? "bg-black text-white border-black"
                  : "bg-[#f0e4cc] text-gray-700 border-black/30 hover:bg-[#ecdfc4]"
              }`}
            >
              <Images className={`w-4 h-4 ${showAvatarPicker ? "text-white" : "text-black"}`} />
              <span>{showAvatarPicker ? "Hide" : "Choose"}</span>
            </button>
            <button
              type="button"
              onClick={() => avatarUploadRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-black uppercase tracking-wider border bg-[#f0e4cc] text-gray-700 border-black/30 hover:bg-[#ecdfc4] transition-all active:scale-95"
            >
              <Upload className="w-4 h-4 text-black" />
              <span>Upload</span>
            </button>
          </div>

          {showAvatarPicker && (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5 bg-[#f0e4cc] p-3 rounded-2xl border border-black/30 max-h-44 overflow-y-auto w-full animate-fadeIn">
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
                        ? "ring-2 ring-black ring-offset-2 ring-offset-gray-100 scale-105"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={avatar.url} alt={avatar.label} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Panel>

      {/* Identity fields */}
      <Panel icon={<User className="w-5 h-5 text-black" />} title="Your Identity" subtitle="Username, name, and date of birth are required">
        <div>
          <FieldLabel icon={<User className="w-3.5 h-3.5 text-black" />}>Username *</FieldLabel>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="john_doe"
            autoComplete="username"
            className={inputClass}
          />
          {username && (
            <div className="mt-1.5 text-[11px] font-bold">
              {usernameStatus === "checking" && <span className="text-gray-500">Checking availability…</span>}
              {usernameStatus === "available" && <span className="text-black">✔ Username available</span>}
              {usernameStatus === "taken" && <span className="text-red-600">❌ Username already taken</span>}
              {usernameStatus === "invalid" && <span className="text-red-600">❌ Username must be 3-20 chars, letters/numbers/underscores only, and cannot start with "_".</span>}
            </div>
          )}
        </div>

        <div>
          <FieldLabel icon={<User className="w-3.5 h-3.5 text-black" />}>Full Name *</FieldLabel>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={<Calendar className="w-3.5 h-3.5 text-black" />}>Date of Birth *</FieldLabel>
            <DatePicker
              value={dob}
              maxDate={new Date().toISOString().split("T")[0]}
              onChange={setDob}
            />
            {derivedAge && (
              <span className="block mt-1.5 text-[12px] text-gray-500 font-bold">
                Age: {derivedAge} yrs
              </span>
            )}
          </div>
          <div>
            <FieldLabel icon={<ShieldCheck className="w-3.5 h-3.5 text-black" />}>Gender</FieldLabel>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={<Phone className="w-3.5 h-3.5 text-black" />}>Phone *</FieldLabel>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-32 bg-black/5 border border-black/30 rounded-xl px-3 py-3 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+65">🇸🇬 +65</option>
              </select>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={15}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="9876543210"
                autoComplete="tel"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={<MapPin className="w-3.5 h-3.5 text-black" />}>Home City</FieldLabel>
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
      setStep("activities");
      return;
    }
    if (preferredTimes.length === 0) {
      setError("Pick at least one time of day you like to head out.");
      setStep("whenwhere");
      return;
    }
    if (terrainPreferences.length === 0) {
      setError("Pick at least one kind of terrain.");
      setStep("whenwhere");
      return;
    }
    if (motivations.length === 0) {
      setError("Tell us what keeps you moving — pick at least one motivation.");
      setStep("goals");
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
        ai_coach_opt_in: false,
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

  /* ---- Shared checkpoint chrome ---------------------------------- */

  /** One survey checkpoint: heading, panels, and Back / Continue nav. */
  const Checkpoint = ({
    title,
    blurb,
    back,
    next,
    submit = false,
    nextLabel = "Continue",
    children,
  }: {
    title: string;
    blurb: string;
    back: OnboardingStep;
    next?: OnboardingStep;
    submit?: boolean;
    nextLabel?: string;
    children: React.ReactNode;
  }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (submit) {
          handleSaveSurvey(e);
        } else if (next) {
          setError(null);
          setStep(next);
        }
      }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      <div className="text-center space-y-2">
        <h1 className="font-headline text-3xl md:text-4xl font-black text-black italic uppercase tracking-tight">
          {title}
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-medium max-w-lg mx-auto leading-relaxed text-accent-serif">
          {blurb}
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {children}

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep(back);
          }}
          className="col-span-1 bg-[#f0e4cc] hover:bg-[#ecdfc4] border border-black/30 text-gray-700 font-headline font-black text-sm py-4 rounded-xl uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
          <span>Back</span>
        </button>
        <div className="col-span-2">
          <PrimaryButton type="submit" busy={submit ? busy : false}>
            <span>{nextLabel}</span>
            {!(submit && busy) && <ArrowRight className="w-4 h-4 text-black" />}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );

  /* ---- Checkpoint 1: activities ---------------------------------- */
  const renderActivities = () => (
    <Checkpoint
      title="What You Enjoy"
      blurb="Pick the activities you actually do — this tunes your route suggestions."
      back="personal"
      next="whenwhere"
    >
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
          <FieldLabel icon={<Gauge className="w-3.5 h-3.5 text-black" />}>Experience Level</FieldLabel>
          <ChipGroup
            options={["Beginner", "Intermediate", "Advanced", "Athlete"]}
            value={experienceLevel}
            onChange={setExperienceLevel}
          />
        </div>
        <div>
          <FieldLabel icon={<Zap className="w-3.5 h-3.5 text-black" />}>Typical Pace</FieldLabel>
          <ChipGroup
            options={["Relaxed", "Steady", "Brisk", "Race pace"]}
            value={typicalPace}
            onChange={setTypicalPace}
          />
        </div>
      </Panel>
    </Checkpoint>
  );

  /* ---- Checkpoint 2: when & where -------------------------------- */
  const renderWhenWhere = () => (
    <Checkpoint
      title="When & Where"
      blurb="Tell us when you like to head out and what ground you prefer underfoot."
      back="activities"
      next="goals"
    >
      <Panel
        icon={<Clock className="w-5 h-5" />}
        title="When & Where"
        subtitle="Time of day and terrain you prefer"
        accent="#21190f"
      >
        <div>
          <FieldLabel icon={<Sun className="w-3.5 h-3.5 text-black" />}>Preferred Times</FieldLabel>
          <ChipGroup
            multi
            accent="#21190f"
            options={["Sunrise", "Morning", "Afternoon", "Evening", "Night"]}
            value={preferredTimes}
            onChange={setPreferredTimes}
          />
        </div>
        <div>
          <FieldLabel icon={<MapPin className="w-3.5 h-3.5 text-black" />}>Terrain</FieldLabel>
          <ChipGroup
            multi
            accent="#21190f"
            options={["Park trail", "Lakeside", "City street", "Hills", "Forest path", "Track"]}
            value={terrainPreferences}
            onChange={setTerrainPreferences}
          />
        </div>
        <div>
          <FieldLabel icon={<Music className="w-3.5 h-3.5 text-black" />}>While You Walk</FieldLabel>
          <ChipGroup
            accent="#21190f"
            options={["Music", "Podcast", "Nature sounds", "Silence"]}
            value={audioPreference}
            onChange={setAudioPreference}
          />
        </div>
      </Panel>
    </Checkpoint>
  );

  /* ---- Checkpoint 3: goals --------------------------------------- */
  const renderGoals = () => (
    <Checkpoint
      title="Your Goals"
      blurb="We'll track your progress against these targets on the dashboard."
      back="whenwhere"
      next="buddy"
    >
      <Panel
        icon={<Target className="w-5 h-5" />}
        title="Your Goals"
        subtitle="We'll track progress against these"
        accent="#21190f"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={<Compass className="w-3.5 h-3.5 text-black" />}>Weekly Goal (km)</FieldLabel>
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
            <FieldLabel icon={<Footprints className="w-3.5 h-3.5 text-black" />}>Daily Step Goal</FieldLabel>
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
          <FieldLabel icon={<Flame className="w-3.5 h-3.5 text-black" />}>What Keeps You Moving</FieldLabel>
          <ChipGroup
            multi
            accent="#21190f"
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
    </Checkpoint>
  );

  /* ---- Checkpoint 4: buddy matching ------------------------------ */
  const renderBuddy = () => (
    <Checkpoint
      title="Buddy Matching"
      blurb="Who you'd like to share the trail with, and how far you'll travel to meet."
      back="goals"
      next="safety"
    >
      <Panel
        icon={<Users className="w-5 h-5" />}
        title="Buddy Matching"
        subtitle="Who you'd like to walk with"
      >
        <div>
          <FieldLabel icon={<Users className="w-3.5 h-3.5 text-black" />}>Group Size</FieldLabel>
          <ChipGroup options={GROUP_SIZE_OPTIONS} value={groupSize} onChange={setGroupSize} />
        </div>
        <div>
          <FieldLabel icon={<ShieldCheck className="w-3.5 h-3.5 text-black" />}>Buddy Gender Preference</FieldLabel>
          <ChipGroup
            options={["Any", "Same gender as me", "No preference set"]}
            value={buddyGenderPreference}
            onChange={setBuddyGenderPreference}
          />
        </div>
        <div>
          <FieldLabel icon={<MapPin className="w-3.5 h-3.5 text-black" />}>
            Match Buddies Within ({maxBuddyDistanceKm} km)
          </FieldLabel>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={maxBuddyDistanceKm}
            onChange={(e) => setMaxBuddyDistanceKm(e.target.value)}
            className="w-full accent-black cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase mt-1">
            <span>1 km</span>
            <span>25 km</span>
          </div>
        </div>
        <ToggleRow
          icon={<Zap className="w-4.5 h-4.5 text-black" />}
          title="Push Notifications"
          description="Buddy pings, meetup invites and streak reminders"
          checked={pushNotifications}
          onChange={setPushNotifications}
        />
      </Panel>
    </Checkpoint>
  );

  /* ---- Checkpoint 5: safety (saves everything) ------------------- */
  const renderSafety = () => (
    <Checkpoint
      title="Safety & Privacy"
      blurb="Control what you share and who can reach you. Change any of this later."
      back="buddy"
      submit
      nextLabel="Save Preferences"
    >
      <Panel
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Safety & Privacy"
        subtitle="Saved to your safety settings — change any time"
        accent="#21190f"
      >
        <ToggleRow
          icon={<MapPin className="w-4.5 h-4.5 text-black" />}
          title="Share Live Location"
          description="Only with joined buddies, and only during an active walk"
          checked={shareLiveLocation}
          onChange={setShareLiveLocation}
        />
        <ToggleRow
          icon={<Sun className="w-4.5 h-4.5 text-black" />}
          title="Daylight Hours Only"
          description="Hide meetup pings that start after sunset"
          checked={daylightHoursOnly}
          onChange={setDaylightHoursOnly}
        />
        <ToggleRow
          icon={<ShieldCheck className="w-4.5 h-4.5 text-black" />}
          title="Verified Buddies Only"
          description="Match only with users who completed identity verification"
          checked={verifiedBuddiesOnly}
          onChange={setVerifiedBuddiesOnly}
        />
        <ToggleRow
          icon={<Users className="w-4.5 h-4.5 text-black" />}
          title="Women-Only Matching"
          description="Restrict buddy suggestions and meetups to women"
          checked={womenOnlyMatching}
          onChange={setWomenOnlyMatching}
        />
        <ToggleRow
          icon={<Eye className="w-4.5 h-4.5 text-black" />}
          title="Share Route History"
          description="Let buddies see the trails you've completed before"
          checked={shareRouteHistory}
          onChange={setShareRouteHistory}
        />
        <ToggleRow
          icon={<Siren className="w-4.5 h-4.5 text-black" />}
          title="SOS Shortcut"
          description="Triple-tap during a walk to alert your emergency contact"
          checked={sosShortcutEnabled}
          onChange={setSosShortcutEnabled}
        />

        <div>
          <FieldLabel icon={<Eye className="w-3.5 h-3.5 text-black" />}>Profile Visibility</FieldLabel>
          <ChipGroup
            accent="#21190f"
            options={["Public", "Buddies only", "Private"]}
            value={profileVisibility}
            onChange={setProfileVisibility}
          />
        </div>

        <div>
          <FieldLabel icon={<Clock className="w-3.5 h-3.5 text-black" />}>Auto Check-In Reminder</FieldLabel>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={<User className="w-3.5 h-3.5 text-black" />}>Emergency Contact</FieldLabel>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Contact name"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel icon={<Phone className="w-3.5 h-3.5 text-black" />}>
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
    </Checkpoint>
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
        <h1 className="font-headline text-3xl md:text-4xl font-black text-black italic uppercase tracking-tight">
          Trail Rules
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-medium text-accent-serif">
          One last step before the grove opens up
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <Panel
        icon={<FileText className="w-5 h-5" />}
        title="Terms of Service & Privacy"
        subtitle="Last updated 24 July 2026"
      >
        <div className="max-h-[26rem] overflow-y-auto pr-3 space-y-5 text-[15px] text-gray-700 leading-[1.7] bg-black/5 p-5 rounded-2xl border border-black/30">
          <section>
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
              1. Your Account
            </h4>
            <p>
              You sign in with Google, and you're responsible for keeping that
              account secure. You must be at least 13 years old to use
              Loop. Everything you tell us during onboarding — your name,
              age, preferences and safety settings — is stored against your
              account so we can personalise routes, buddy matches and coaching.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
              2. Health & Physical Activity
            </h4>
            <p>
              Loop is a fitness companion, not a medical service. Workout
              plans and pacing suggestions are general
              guidance only. Talk to a qualified healthcare professional before
              starting a new exercise programme, and stop immediately if you
              feel unwell. You take part in every walk, jog and sprint at your
              own risk.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
              3. Meeting Other Users
            </h4>
            <p>
              Meetup pings connect you with people you may not know. Always meet
              in public places, tell someone where you're going, and use the
              in-app safety tools. Loop does not perform background checks
              and is not responsible for the conduct of other users. Report
              anyone who makes you uncomfortable.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
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
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
              5. Your Content
            </h4>
            <p>
              Routes, reviews and photos you post stay yours. By posting them
              you give Loop a licence to display them to other users in the
              feed and on the map. Don't post anything unlawful, harassing, or
              that isn't yours to share.
            </p>
          </section>

          <section>
            <h4 className="font-headline text-[15px] font-black text-black uppercase tracking-wider mb-2">
              6. Changes
            </h4>
            <p>
              We'll let you know in-app if these terms change materially.
              Continuing to use Loop after an update means you accept the
              revised terms.
            </p>
          </section>
        </div>
      </Panel>

      <Panel
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Confirm & Continue"
        subtitle="Both boxes are required"
        accent="#21190f"
      >
        <button
          type="button"
          onClick={() => setAcceptedTerms(!acceptedTerms)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            acceptedTerms
              ? "bg-black/5 border-black/40"
              : "bg-[#f8f1e3] border-black/30 hover:bg-[#f0e4cc]"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              acceptedTerms
                ? "bg-black border-black"
                : "bg-transparent border-black/40"
            }`}
          >
            {acceptedTerms && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </div>
          <span className="text-[14px] text-gray-700 font-semibold leading-relaxed">
            I have read and accept the Loop{" "}
            <span className="text-black underline">Terms of Service</span> and{" "}
            <span className="text-black underline">Privacy Policy</span>, and I confirm
            I am at least 13 years old.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAcceptedSafety(!acceptedSafety)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            acceptedSafety
              ? "bg-black/5 border-black/40"
              : "bg-[#f8f1e3] border-black/30 hover:bg-[#f0e4cc]"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              acceptedSafety
                ? "bg-black border-black"
                : "bg-transparent border-black/40"
            }`}
          >
            {acceptedSafety && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </div>
          <span className="text-[14px] text-gray-700 font-semibold leading-relaxed">
            I understand Loop is not a medical service, that I walk at my
            own risk, and that I should meet other users in public places.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMarketingOptIn(!marketingOptIn)}
          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
            marketingOptIn
              ? "bg-black/5 border-black/40"
              : "bg-[#f8f1e3] border-black/30 hover:bg-[#f0e4cc]"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              marketingOptIn
                ? "bg-black border-black"
                : "bg-transparent border-black/40"
            }`}
          >
            {marketingOptIn && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </div>
          <span className="text-[14px] text-gray-700 font-semibold leading-relaxed">
            Optional — send me weekly trail highlights and streak nudges.
          </span>
        </button>
      </Panel>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("safety");
          }}
          className="col-span-1 bg-black/5 hover:bg-black/10 border border-black/30 text-black font-headline font-black text-sm py-4 rounded-xl uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="col-span-2">
          <PrimaryButton type="submit" busy={busy} disabled={!acceptedTerms || !acceptedSafety}>
            <span>Enter Loop</span>
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
    <div className="min-h-screen bg-[#f8f1e3] text-black flex flex-col relative font-sans overflow-x-hidden">
      {/* Header — identical language to the dashboard header */}
      <header className="sticky top-0 z-[100] bg-[#f8f1e3]/90 backdrop-blur-2xl border-b border-black/30 px-4 md:px-10 py-3.5 flex justify-between items-center shadow-lg">
        <div className="font-logo text-[22px] md:text-[28px] font-semibold text-[var(--wb-text)] italic tracking-tighter flex items-center gap-2">
          <Trees className="w-6 h-6 text-black" />
          <span>Loop</span>
        </div>

        <div className="flex items-center gap-2.5">
          {onSkipForUser && (
            <button
              type="button"
              onClick={onSkipForUser}
              className="text-[11px] md:text-[12px] uppercase font-headline font-black tracking-wider text-white bg-black px-3.5 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>Skip Onboarding (Dev)</span>
            </button>
          )}
          {session ? (
            <button
              onClick={async () => {
                await signOut();
                window.location.reload();
              }}
              className="text-[12px] uppercase font-black tracking-wider text-gray-600 hover:text-black px-3.5 py-2.5 rounded-xl bg-black/5 border border-black/30 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <span className="text-[12px] uppercase font-black tracking-wider text-gray-500">
              Getting Started
            </span>
          )}
        </div>
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
          {step === "activities" && renderActivities()}
          {step === "whenwhere" && renderWhenWhere()}
          {step === "goals" && renderGoals()}
          {step === "buddy" && renderBuddy()}
          {step === "safety" && renderSafety()}
          {step === "terms" && renderTerms()}
        </FogTransition>
      </main>

      <footer className="relative z-20 text-center text-[12px] text-gray-400 font-bold uppercase tracking-wider pb-6">
        {STEP_META[step].blurb} • Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}
      </footer>
    </div>
  );
}
