import React, { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Trees, Loader2, AlertTriangle, Database, Zap } from "lucide-react";
import App from "./App";
import OnboardingFlow from "./components/OnboardingFlow";
import FirefliesCanvas from "./components/FirefliesCanvas";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { ProfileRow, ensureProfile, fetchProfile, signOut } from "./lib/db";
import { DEFAULT_AVATARS } from "./types";

export const DEV_PRASSANNA_PROFILE: ProfileRow = {
  id: "usr_nsprassanna3",
  email: "nsprassanna3@gmail.com",
  full_name: "Prassanna",
  username: "prassanna",
  age: 26,
  gender: "male",
  phone: "9876543210",
  country_code: "+91",
  phone_number: "+919876543210",
  avatar_url: DEFAULT_AVATARS[0].url,
  weight_kg: 70,
  daily_steps_goal: 10000,
  city: "Bengaluru",
  bio: "WalkBuddy enthusiast and outdoor explorer.",
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
    return localStorage.getItem("walkbuddy_dev_skip_nsprassanna3") === "true";
  });

  const handleSkipForUser = () => {
    localStorage.setItem("walkbuddy_dev_skip_nsprassanna3", "true");
    setProfile(DEV_PRASSANNA_PROFILE);
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
      console.error("[WalkBuddy] Failed to load profile:", err);
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
            <div className="w-10 h-10 rounded-xl bg-[#adff2f]/15 border border-[#adff2f]/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#adff2f]" />
            </div>
            <h2 className="font-headline text-base font-extrabold text-white uppercase tracking-wider">
              Connect Supabase
            </h2>
          </div>
          <p className="text-[11px] text-amber-100/75 leading-relaxed">
            WalkBuddy needs your Supabase keys before sign-in can work. Create{" "}
            <code className="text-[#d2a649]">.env.local</code> in the project
            root with:
          </p>
          <pre className="bg-[#0c130f] border border-white/10 rounded-xl p-3.5 text-[10px] text-[#d2a649] overflow-x-auto font-mono leading-relaxed">
{`VITE_SUPABASE_URL=https://hawpplpfychvjahaywum.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>`}
          </pre>
          <p className="text-[11px] text-amber-100/75 leading-relaxed">
            The anon key is in your Supabase dashboard under{" "}
            <span className="text-white font-bold">Project Settings → API</span>.
            Then run <code className="text-[#d2a649]">supabase/schema.sql</code>{" "}
            in the SQL Editor, enable the Google provider under{" "}
            <span className="text-white font-bold">Authentication → Providers</span>
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
          <div className="w-16 h-16 rounded-3xl bg-[#d2a649]/15 border border-[#d2a649]/30 flex items-center justify-center shadow-[0_0_35px_rgba(210,166,73,0.3)]">
            <Trees className="w-8 h-8 text-[#d2a649]" />
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase font-black tracking-wider text-amber-200/70">
            <Loader2 className="w-4 h-4 animate-spin text-[#d2a649]" />
            <span>Waking the fireflies…</span>
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
            <h2 className="font-headline text-base font-extrabold text-white uppercase tracking-wider">
              Database Not Ready
            </h2>
          </div>
          <p className="text-[11px] text-amber-100/75 leading-relaxed">{loadError}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#d2a649] text-black font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider"
            >
              Retry
            </button>
            <button
              onClick={async () => {
                await signOut();
                window.location.reload();
              }}
              className="bg-white/5 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ Onboarding ------------------------------ */
  const activeProfile = profile || (devSkip ? DEV_PRASSANNA_PROFILE : null);
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
      profile={activeProfile || DEV_PRASSANNA_PROFILE}
      onSignOut={async () => {
        localStorage.removeItem("walkbuddy_dev_skip_nsprassanna3");
        await signOut();
        window.location.reload();
      }}
    />
  );
}

/** Themed full-screen container reused by the gate's own status screens. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c130f] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <FirefliesCanvas density="calm" />
      <div className="relative z-20 w-full flex justify-center">{children}</div>
    </div>
  );
}
