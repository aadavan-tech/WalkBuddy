import React, { useState } from "react";
import { Flame, Sparkles, Footprints, Compass, Zap } from "lucide-react";
import { ActivityLog } from "../types";
import { ActivityMode } from "../data/badges";
import AchievementsRoadmap from "./AchievementsRoadmap";

interface WeeklyProgressProps {
  logs: ActivityLog[];
  onStartSuggestedSession: () => void;
}

// Baseline lifetime distance per mode so the roadmap reads as "lived-in";
// fresh session logs are added on top of these.
const BASE_DISTANCE: Record<ActivityMode, number> = {
  Walking: 118.6,
  Jogging: 71.4,
  Sprinting: 24.8,
};

const MODE_META: {
  mode: ActivityMode;
  accent: string;
  soft: string;
  icon: React.ReactNode;
}[] = [
  { mode: "Walking", accent: "#00ffc8", soft: "rgba(0,255,200,0.12)", icon: <Footprints className="w-5 h-5" /> },
  { mode: "Jogging", accent: "#00e5ff", soft: "rgba(0,229,255,0.12)", icon: <Compass className="w-5 h-5" /> },
  { mode: "Sprinting", accent: "#adff2f", soft: "rgba(173,255,47,0.12)", icon: <Zap className="w-5 h-5" /> },
];

export default function WeeklyProgress({
  logs,
  onStartSuggestedSession,
}: WeeklyProgressProps) {
  const [targetKm, setTargetKm] = useState(45);
  const currentKm = 38.5;
  const progressPercent = Math.min(100, Math.round((currentKm / targetKm) * 100));

  const radius = 70;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Cumulative distance per mode (baseline + logged sessions).
  const distancesByMode: Record<ActivityMode, number> = {
    Walking: BASE_DISTANCE.Walking,
    Jogging: BASE_DISTANCE.Jogging,
    Sprinting: BASE_DISTANCE.Sprinting,
  };
  logs.forEach((log) => {
    if (log.type === "Walking" || log.type === "Jogging" || log.type === "Sprinting") {
      distancesByMode[log.type] += log.distanceKm;
    }
  });
  const totalDistance =
    distancesByMode.Walking + distancesByMode.Jogging + distancesByMode.Sprinting;

  return (
    <div className="w-full space-y-8 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-black text-white italic tracking-tight uppercase leading-none">
          Weekly Progress
        </h2>
        <p className="text-xs text-emerald-200/80 uppercase tracking-widest font-black">
          Track active streak days, distance targets, and fitness milestones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Ring Card — percentage only */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border-[#00ffc8]/25">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#00ffc8]/10 rounded-full blur-3xl group-hover:bg-[#00ffc8]/15 transition-all duration-500" />

          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 border border-[#00ffc8]/30 rounded-full px-3 py-1 text-[10px] text-emerald-100">
            <span>Weekly Target:</span>
            <input
              type="number"
              value={targetKm}
              onChange={(e) => setTargetKm(Math.max(1, parseInt(e.target.value) || 45))}
              className="w-8 bg-transparent text-[#00ffc8] font-black text-center focus:outline-none"
            />
            <span>km</span>
          </div>

          <div className="relative w-44 h-44 my-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-white/10"
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                className="text-[#00ffc8] transition-all duration-1000 ease-out"
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 5px rgba(0,255,200,0.55))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-4xl font-black text-[#00ffc8]">{progressPercent}%</span>
              <span className="text-[10px] text-emerald-200/70 uppercase tracking-widest font-black">Weekly Goal</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-emerald-200/80 font-medium">
              {currentKm} km of {targetKm} km weekly target completed
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-[#041a14] to-black border-[#00ffc8]/25">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-[#00ffc8] uppercase font-black tracking-widest block mb-1">
                Active Workout Streak
              </span>
              <div className="font-headline text-3xl font-black text-white italic uppercase tracking-tight">
                14 Days Active
              </div>
            </div>
            <div className="w-14 h-14 bg-[#00ffc8]/15 rounded-full flex items-center justify-center border border-[#00ffc8]/30 group-hover:scale-110 transition-transform">
              <Flame className="w-7 h-7 text-[#00ffc8] fill-current" />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between gap-2.5">
              {[true, true, true, true, true, false, false].map((active, i) => (
                <div
                  key={i}
                  className={`flex-1 h-12 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-t from-[#00ffc8] to-[#00e5ff]"
                      : "bg-white/5 border border-white/5"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 px-1 text-[10px] text-emerald-200/80 font-black tracking-wider">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Distance by Mode — its own dedicated card */}
      <div className="glass-panel p-6 rounded-2xl border-[#00ffc8]/25">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h3 className="font-headline text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00ffc8]" />
              <span>Total Distance Travelled</span>
            </h3>
            <p className="text-[11px] text-emerald-200/70 font-bold uppercase tracking-widest mt-0.5">
              Across walking, jogging &amp; sprinting
            </p>
          </div>
          <div className="text-right">
            <div className="font-headline text-2xl font-black text-white leading-none">
              {totalDistance.toFixed(1)}
              <span className="text-sm font-medium text-emerald-200/60 ml-1">km</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wider">
              All-time
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODE_META.map(({ mode, accent, soft, icon }) => (
            <div
              key={mode}
              className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: soft, borderColor: `${accent}55`, color: accent }}
                >
                  {icon}
                </div>
                <span
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: accent }}
                >
                  {mode}
                </span>
              </div>
              <div>
                <div className="font-headline text-3xl font-black text-white tracking-tight leading-none">
                  {distancesByMode[mode].toFixed(1)}
                  <span className="text-sm font-medium text-emerald-200/60 ml-1">km</span>
                </div>
                <div className="text-[10px] text-emerald-200/60 font-bold uppercase tracking-wider mt-1">
                  {totalDistance > 0
                    ? Math.round((distancesByMode[mode] / totalDistance) * 100)
                    : 0}
                  % of total
                </div>
              </div>
              {/* Proportion bar */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${totalDistance > 0 ? (distancesByMode[mode] / totalDistance) * 100 : 0}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Roadmap (replaces the old big badges) */}
      <AchievementsRoadmap distancesByMode={distancesByMode} />

      {/* Suggested Session CTA */}
      <section className="relative h-60 w-full rounded-2xl overflow-hidden glass-panel border-[#00ffc8]/30 group">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-8767610419ea?auto=format&fit=crop&w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041a14] via-[#041a14]/90 to-transparent" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#00ffc8]/20 text-[#00ffc8] border border-[#00ffc8]/30 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-3">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Recommended Route Walk</span>
            </div>
            <h3 className="font-headline text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">
              LAKESIDE SUNSET LOOP
            </h3>
            <p className="text-xs text-emerald-100/80 max-w-xs md:max-w-md leading-relaxed mt-2.5">
              Experience the scenic 5.2km loop along lakeside tree avenues with flat paving. Complete 5.2km to earn your Gold Explorer Badge!
            </p>
          </div>
          <button
            onClick={onStartSuggestedSession}
            className="bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline text-[11px] uppercase font-black tracking-wider px-6 py-2.5 rounded-full self-start active:scale-95 transition-transform shadow-[0_3px_16px_rgba(0,255,200,0.25)]"
          >
            Start Suggested Session
          </button>
        </div>
      </section>
    </div>
  );
}
