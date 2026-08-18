import React, { useMemo, useState } from "react";
import { Flame, Sparkles, Footprints, Compass, Zap, Target, Pencil, Check, CalendarDays } from "lucide-react";
import { ActivityLog } from "../types";
import { ActivityMode } from "../data/badges";
import AchievementsRoadmap from "./AchievementsRoadmap";

interface WeeklyProgressProps {
  logs: ActivityLog[];
  onStartSuggestedSession: () => void;
}

const MODE_META: {
  mode: ActivityMode;
  icon: React.ReactNode;
}[] = [
  { mode: "Walking", icon: <Footprints className="w-4 h-4 text-black" /> },
  { mode: "Jogging", icon: <Compass className="w-4 h-4 text-black" /> },
  { mode: "Sprinting", icon: <Zap className="w-4 h-4 text-black" /> },
];

export default function WeeklyProgress({
  logs,
  onStartSuggestedSession,
}: WeeklyProgressProps) {
  // Weekly goal is user-owned and persisted.
  const [targetKm, setTargetKm] = useState(() => {
    const saved = parseFloat(localStorage.getItem("walkbuddy_weekly_goal") || "");
    return Number.isFinite(saved) && saved > 0 ? saved : 25;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(targetKm));

  const commitGoal = () => {
    const v = parseFloat(goalDraft);
    const next = Number.isFinite(v) && v > 0 ? Math.min(500, v) : targetKm;
    setTargetKm(next);
    localStorage.setItem("walkbuddy_weekly_goal", String(next));
    setGoalDraft(String(next));
    setEditingGoal(false);
  };

  /** Current week, Monday 00:00 -> now. Drives both distance and time-elapsed. */
  const week = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const dow = (now.getDay() + 6) % 7; // 0 = Monday
    start.setDate(now.getDate() - dow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(totalMs, now.getTime() - start.getTime());
    return {
      start,
      end,
      dayIndex: dow + 1, // 1..7
      daysLeft: Math.max(0, 7 - (dow + 1)),
      timePercent: Math.round((elapsedMs / totalMs) * 100),
    };
  }, []);

  // Distance covered inside the current week only.
  const currentKm = useMemo(
    () =>
      logs
        .filter((l) => {
          const d = new Date(l.date);
          return d >= week.start && d < week.end;
        })
        .reduce((sum, l) => sum + l.distanceKm, 0),
    [logs, week]
  );

  const progressPercent = Math.min(100, Math.round((currentKm / targetKm) * 100));
  const onTrack = progressPercent >= week.timePercent;

  const radius = 66;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Cumulative distance per mode — starts at zero and grows with logged sessions.
  const distancesByMode: Record<ActivityMode, number> = {
    Walking: 0,
    Jogging: 0,
    Sprinting: 0,
  };
  logs.forEach((log) => {
    if (log.type === "Walking" || log.type === "Jogging" || log.type === "Sprinting") {
      distancesByMode[log.type] += log.distanceKm;
    }
  });
  const totalDistance =
    distancesByMode.Walking + distancesByMode.Jogging + distancesByMode.Sprinting;

  return (
    <div className="w-full space-y-10 max-w-4xl mx-auto pb-12">
      {/* Header — plain type, no card */}
      <div className="space-y-1.5 pb-6 border-b border-black/30">
        <h1 className="font-headline text-4xl md:text-5xl font-black text-black italic tracking-tight uppercase leading-none">
          Weekly Progress
        </h1>
        <p className="text-sm text-gray-500 text-accent-serif">
          Track active streak days, distance targets, and fitness milestones
        </p>
      </div>

      {/* Goal + streak — one composition, split by a divider on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-black/20">
        {/* Progress ring */}
        <div className="flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between mb-6">
            <span className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-wider text-gray-600">
              <Target className="w-4 h-4 text-black" />
              Weekly Goal
            </span>

            {editingGoal ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.5"
                  autoFocus
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitGoal();
                    if (e.key === "Escape") {
                      setGoalDraft(String(targetKm));
                      setEditingGoal(false);
                    }
                  }}
                  className="w-16 bg-transparent border-b border-black/40 px-1 py-0.5 text-sm font-black text-black text-center focus:outline-none focus:border-black"
                />
                <span className="text-xs font-bold text-gray-500">km</span>
                <button type="button" onClick={commitGoal} title="Save goal">
                  <Check className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(String(targetKm));
                  setEditingGoal(true);
                }}
                className="flex items-center gap-1.5 group"
                title="Tap to change your weekly goal"
              >
                <span className="font-headline text-base font-black text-black leading-none">
                  {targetKm}
                  <span className="text-[11px] font-bold ml-0.5">km</span>
                </span>
                <Pencil className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <div className="relative w-44 h-44">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-black/10" cx="88" cy="88" fill="transparent" r={radius} stroke="currentColor" strokeWidth="8" />
              <circle
                className="text-black transition-all duration-1000 ease-out"
                cx="88" cy="88" fill="transparent" r={radius} stroke="currentColor" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-4xl font-black text-black">{progressPercent}%</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">of goal</span>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3 mt-5">
            <div className="font-headline text-lg font-black text-black">
              {currentKm.toFixed(1)}{" "}
              <span className="text-gray-500 font-medium text-sm">/ {targetKm} km</span>
            </div>

            <div className="w-full">
              <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-black" />
                  Day {week.dayIndex} of 7
                </span>
                <span>{week.daysLeft === 0 ? "Last day" : `${week.daysLeft}d left`}</span>
              </div>
              <div className="relative w-full bg-black/10 h-1 overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-black transition-all" style={{ width: `${progressPercent}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-gray-500" style={{ left: `${week.timePercent}%` }} title="Time elapsed this week" />
              </div>
              <div className={`text-[11px] font-bold mt-1.5 ${onTrack ? "text-black" : "text-gray-500"}`}>
                {onTrack
                  ? "On track — ahead of the week's pace"
                  : `Behind pace — ${Math.max(0, targetKm - currentKm).toFixed(1)} km to go`}
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="md:pl-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">
                Active Workout Streak
              </span>
              <div className="font-headline text-3xl font-black text-black italic uppercase tracking-tight">
                14 Days Active
              </div>
            </div>
            <Flame className="w-7 h-7 text-black fill-current shrink-0" />
          </div>

          <div className="flex justify-between gap-2">
            {[true, true, true, true, true, false, false].map((active, i) => (
              <div key={i} className={`flex-1 h-10 ${active ? "bg-black" : "bg-black/10"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2 px-0.5 text-[10px] text-gray-500 font-black tracking-wider">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>
      </div>

      {/* Total Distance by Mode — a divided row, not a card of cards */}
      <div>
        <div className="flex justify-between items-end mb-5 pb-4 border-b border-black/20">
          <div>
            <h3 className="font-headline text-lg font-extrabold text-black tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-black" />
              <span>Total Distance Travelled</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 text-accent-serif">
              Across walking, jogging &amp; sprinting
            </p>
          </div>
          <div className="text-right">
            <div className="font-headline text-2xl font-black text-black leading-none">
              {totalDistance.toFixed(1)}
              <span className="text-sm font-medium text-gray-500 ml-1">km</span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">All-time</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-black/20 gap-6 sm:gap-0">
          {MODE_META.map(({ mode, icon }) => (
            <div key={mode} className="sm:px-5 first:pl-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-[10px] font-black uppercase tracking-wider text-black">{mode}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold">
                  {totalDistance > 0 ? Math.round((distancesByMode[mode] / totalDistance) * 100) : 0}%
                </span>
              </div>
              <div className="font-headline text-3xl font-black text-black tracking-tight leading-none mb-2">
                {distancesByMode[mode].toFixed(1)}
                <span className="text-sm font-medium text-gray-500 ml-1">km</span>
              </div>
              <div className="w-full bg-black/10 h-1">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${totalDistance > 0 ? (distancesByMode[mode] / totalDistance) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Roadmap (replaces the old big badges) */}
      <AchievementsRoadmap distancesByMode={distancesByMode} />
    </div>
  );
}
