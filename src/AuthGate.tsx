import React, { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Trees, Loader2, AlertTriangle, Database, Zap } from "lucide-react";
import App from "./App";
import OnboardingFlow from "./components/OnboardingFlow";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { ProfileRow, ensureProfile, fetchProfile, signOut } from "./lib/db";
import { DEFAULT_AVATARS } from "./types";

export const DEV_GUEST_PROFILE: ProfileRow = {
  id: "usr_guest_dev",
  email: "guest@loop.dev",
  full_name: "Guest User",
  username: "guest",
  age: 26,
  gender: "male",
  phone: "9876543210",
  country_code: "+91",
  phone_number: "+919876543210",
  avatar_url: DEFAULT_AVATARS[0].url,
  weight_kg: 70,
  daily_steps_goal: 10000,
  city: "Bengaluru",
  bio: "Loop enthusiast and outdoor explorer.",
  onboarding_completed: true,
  terms_accepted: true,
  terms_accepted_at: new Date().toISOString(),
  marketing_opt_in: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Gates the whole app behind Google sign-in + onboarding.
 *
 *   no session                 -> OnboardingFlow (sign-in screen)
 *   session, incomplete profile-> OnboardingFlow (resumes at the right step)
 *   session, onboarded         -> App (the dashboard)
 */
export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [devSkip, setDevSkip] = useState<boolean>(() => {
    return localStorage.getItem("walkbuddy_dev_skip_guest") === "true";
  });

  const handleSkipForUser = () => {
    localStorage.setItem("walkbuddy_dev_skip_guest", "true");
    setProfile(DEV_GUEST_PROFILE);
    setDevSkip(true);
  };

  const loadProfile = useCallback(async (activeSession: Session) => {
    const user = activeSession.user;
    const meta = (user.user_metadata || {}) as Record<string, string>;
    try {
      const row =
        (await fetchProfile(user.id)) ??
        (await ensureProfile({
          id: user.id,
          email: user.email,
          fullName: meta.full_name || meta.name || null,
          avatarUrl: meta.avatar_url || meta.picture || null,
        }));
      setProfile(row);
      setLoadError(null);
    } catch (err: any) {
      console.error("[Loop] Failed to load profile:", err);
      setProfile(null);
      setLoadError(
        err?.message ||
          "Could not reach the profiles table. Make sure supabase/schema.sql has been run on this project."
      );
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // 1. Restore an existing session (also picks up the Google OAuth redirect).
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session);
      if (!cancelled) setLoading(false);
    });

    // 2. Keep reacting to sign-in / sign-out / token refresh.
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      setSession(newSession);

      if (newSession && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        await loadProfile(newSession);
      }
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  /* ----------------------------- Setup notice ----------------------------- */
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <div className="glass-panel-glow p-6 rounded-2xl max-w-lg w-full space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/15 flex items-center justify-center">
              <Database className="w-5 h-5 text-black" />
            </div>
            <h2 className="font-headline text-base font-extrabold text-black uppercase tracking-wider">
              Connect Supabase
            </h2>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Loop needs your Supabase keys before sign-in can work. Create{" "}
            <code className="text-black font-bold">.env.local</code> in the project
            root with:
          </p>
          <pre className="bg-black/5 border border-black/30 rounded-xl p-3.5 text-[10px] text-black overflow-x-auto font-mono leading-relaxed">
{`VITE_SUPABASE_URL=https://hawpplpfychvjahaywum.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>`}
          </pre>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            The anon key is in your Supabase dashboard under{" "}
            <span className="text-black font-bold">Project Settings → API</span>.
            Then run <code className="text-black font-bold">supabase/schema.sql</code>{" "}
            in the SQL Editor, enable the Google provider under{" "}
            <span className="text-black font-bold">Authentication → Providers</span>
            , and restart the dev server.
          </p>
        </div>
      </Shell>
    );
  }

  /* ------------------------------- Loading -------------------------------- */
  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-black/5 border border-black/15 flex items-center justify-center">
            <Trees className="w-8 h-8 text-black" />
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase font-black tracking-wider text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Loading…</span>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------- Profile load failure ------------------------- */
  if (session && loadError) {
    return (
      <Shell>
        <div className="glass-panel-glow p-6 rounded-2xl max-w-lg w-full space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-400/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-300" />
            </div>
            <h2 className="font-headline text-base font-extrabold text-black uppercase tracking-wider">
              Database Not Ready
            </h2>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">{loadError}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider"
            >
              Retry
            </button>
            <button
              onClick={async () => {
                await signOut();
                window.location.reload();
              }}
              className="bg-black/5 border border-black/30 text-black font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider hover:bg-black/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ Onboarding ------------------------------ */
  const activeProfile = profile || (devSkip ? DEV_GUEST_PROFILE : null);
  const needsOnboarding = !devSkip && (!session || !profile?.onboarding_completed);

  if (needsOnboarding) {
    return (
      <OnboardingFlow
        session={session}
        profile={profile}
        onComplete={(completed) => setProfile(completed)}
        onSkipForUser={handleSkipForUser}
      />
    );
  }

  /* -------------------------------- The app ------------------------------- */
  return (
    <App
      profile={activeProfile || DEV_GUEST_PROFILE}
      onSignOut={async () => {
        localStorage.removeItem("walkbuddy_dev_skip_guest");
        await signOut();
        window.location.reload();
      }}
    />
  );
}

/** Themed full-screen container reused by the gate's own status screens. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f1e3] text-black font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <div className="relative z-20 w-full flex justify-center">{children}</div>
    </div>
  );
}
