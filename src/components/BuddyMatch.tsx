import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  Loader2,
  MapPin,
  X,
  Navigation,
  Check,
  AlertTriangle,
  Radar,
} from "lucide-react";
import {
  MatchCategory,
  MatchRow,
  cancelMatchRequest,
  fetchActiveMatch,
  requestMatch,
  subscribeToMatches,
  updateMatchStatus,
} from "../lib/db";
import { distanceKm, formatDistance } from "../lib/geo";

interface BuddyMatchProps {
  /** Signed-in user's profile id. Matching is disabled without it. */
  userId?: string;
  userName?: string;
  userAvatar?: string;
  /** Activity to match on — only pairs with users wanting the same. */
  category?: MatchCategory;
  onNotify?: (message: string, tone?: "success" | "info" | "warn") => void;
}

type Phase = "idle" | "locating" | "searching" | "matched" | "error";

const RADIUS_OPTIONS = [1, 3, 5, 10];

export default function BuddyMatch({
  userId,
  userName,
  userAvatar,
  category = "Walking",
  onNotify,
}: BuddyMatchProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);
  /** Where we were when we searched — used to show distance to the spot. */
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [waitedSec, setWaitedSec] = useState(0);

  const unsubRef = useRef<(() => void) | null>(null);

  /** Adopt a match found either by our own RPC call or pushed by Realtime. */
  const adoptMatch = useCallback(
    (m: MatchRow) => {
      if (m.status !== "active") return;
      setMatch(m);
      setPhase("matched");
      onNotify?.("Buddy matched — head to the meeting point!", "success");
    },
    [onNotify]
  );

  // Restore an in-progress match on mount, so a refresh doesn't lose it.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchActiveMatch(userId)
      .then((m) => {
        if (!cancelled && m) {
          setMatch(m);
          setPhase("matched");
        }
      })
      .catch(() => {
        /* table not migrated yet — the button will surface it on use */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tick the "waiting" counter so the user can see it's still working.
  useEffect(() => {
    if (phase !== "searching") return;
    setWaitedSec(0);
    const t = setInterval(() => setWaitedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Drop the Realtime subscription when we leave the searching state.
  useEffect(() => {
    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, []);

  const handleFindBuddy = async () => {
    if (!userId) {
      setError("Sign in to find a walking buddy.");
      setPhase("error");
      return;
    }
    if (!navigator.geolocation) {
      setError("This browser can't share location, so we can't match you nearby.");
      setPhase("error");
      return;
    }

    setError(null);
    setPhase("locating");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMyPos({ lat, lng });
        try {
          // Listen first: another user could match us mid-request.
          unsubRef.current?.();
          unsubRef.current = subscribeToMatches(userId, adoptMatch);

          const found = await requestMatch({
            lat,
            lng,
            category,
            radiusKm,
            userName,
            userAvatar,
          });

          if (found) {
            adoptMatch(found);
          } else {
            setPhase("searching");
          }
        } catch (err: any) {
          setError(
            err?.message?.includes("find_or_create_match")
              ? "Matching isn't set up on the database yet — run supabase/migration_buddy_matching.sql."
              : err?.message || "Could not start matching."
          );
          setPhase("error");
        }
      },
      (geoErr) => {
        setError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? "Location permission denied — we need it to find buddies near you."
            : "Couldn't get your location. Try again outdoors or with GPS on."
        );
        setPhase("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleCancel = async () => {
    unsubRef.current?.();
    unsubRef.current = null;
    try {
      await cancelMatchRequest();
    } catch {
      /* best effort — the request expires on its own anyway */
    }
    setPhase("idle");
    setWaitedSec(0);
  };

  const handleFinish = async (status: "completed" | "cancelled") => {
    if (!match) return;
    try {
      await updateMatchStatus(match.id, status);
    } catch {
      /* non-fatal */
    }
    setMatch(null);
    setPhase("idle");
    onNotify?.(
      status === "completed" ? "Nice walk! Match closed." : "Match cancelled.",
      status === "completed" ? "success" : "info"
    );
  };

  /** How far the user is from the agreed meeting point. */
  const distanceToSpot =
    match && myPos
      ? distanceKm(myPos.lat, myPos.lng, match.meet_lat, match.meet_lng)
      : null;

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/15">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/15 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-black" />
        </div>
        <div className="min-w-0">
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-wide text-[var(--wb-text)]">
            Find a Walking Buddy
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            Match with someone nearby and meet in the middle
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/35 text-red-600 text-[11px] font-semibold leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------- IDLE / ERROR: choose radius and search ---------- */}
      {(phase === "idle" || phase === "error") && (
        <>
          <div>
            <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
              Search radius
            </span>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
                    radiusKm === r
                      ? "bg-black text-white shadow-md"
                      : "bg-black/5 text-slate-600 hover:bg-black/10"
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleFindBuddy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-headline font-black text-xs uppercase tracking-wider bg-black text-white shadow-md active:scale-[0.98] transition-all"
          >
            <Radar className="w-4 h-4" />
            <span>Find a buddy nearby</span>
          </button>
        </>
      )}

      {/* ---------- LOCATING / SEARCHING ---------- */}
      {(phase === "locating" || phase === "searching") && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-black/5 border border-black/15">
            <Loader2 className="w-5 h-5 animate-spin text-black shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[var(--wb-text)]">
                {phase === "locating"
                  ? "Getting your location…"
                  : `Looking for someone within ${radiusKm} km…`}
              </div>
              {phase === "searching" && (
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                  Waiting {waitedSec}s · you'll be matched automatically
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-black/5 text-slate-600 hover:bg-black/10 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel search</span>
          </button>
        </div>
      )}

      {/* ---------- MATCHED: the shared meeting point ---------- */}
      {phase === "matched" && match && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-black/5 border border-black/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Buddy matched
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              You were{" "}
              <strong className="text-[var(--wb-text)]">
                {match.apart_km != null ? formatDistance(match.apart_km) : "nearby"}
              </strong>{" "}
              apart. Meet in the middle for a {match.category.toLowerCase()}.
            </p>

            <div className="flex items-start gap-2 pt-1 border-t border-black/10">
              <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-black tracking-wider text-gray-500">
                  Meeting point
                </div>
                <div className="text-xs font-mono font-bold text-[var(--wb-text)]">
                  {match.meet_lat.toFixed(5)}, {match.meet_lng.toFixed(5)}
                </div>
                {distanceToSpot != null && (
                  <div className="text-[10px] text-black font-bold mt-0.5">
                    {formatDistance(distanceToSpot)} from where you started
                  </div>
                )}
              </div>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${match.meet_lat},${match.meet_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-headline font-black text-xs uppercase tracking-wider bg-black text-white shadow-md active:scale-[0.98] transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate to the spot</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFinish("completed")}
              className="py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-black/5 text-slate-600 hover:bg-black/10 transition-all"
            >
              We met up
            </button>
            <button
              type="button"
              onClick={() => handleFinish("cancelled")}
              className="py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-black/5 text-slate-600 hover:bg-black/10 transition-all"
            >
              Cancel match
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
