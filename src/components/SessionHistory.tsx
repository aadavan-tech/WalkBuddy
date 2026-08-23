import React, { useMemo, useState } from "react";
import {
  Footprints,
  Compass,
  Clock,
  Trash2,
  Mountain,
  ArrowUpRight,
  Trophy,
  Gauge,
  CalendarDays,
  Check,
  Pencil,
} from "lucide-react";
import { ActivityLog } from "../types";

interface SessionHistoryProps {
  logs: ActivityLog[];
  onDeleteLog?: (id: string) => void;
  /** Opens the Post Trail form prefilled with this session's metrics. */
  onPostTrail?: (log: ActivityLog) => void;
}

type Filter = "All" | "Walking" | "Jogging";

/** Accent keys resolved in CSS (.accent-chip[data-accent]) — all resolve to the ink colour in the single theme. */
const TYPE_ACCENT: Record<string, string> = {
  Walking: "teal",
  Jogging: "cyan",
};

/** 7 days of the week for the concentric ring system */
const RING_DAYS = [
  { name: "Monday", short: "Mon" },
  { name: "Tuesday", short: "Tue" },
  { name: "Wednesday", short: "Wed" },
  { name: "Thursday", short: "Thu" },
  { name: "Friday", short: "Fri" },
  { name: "Saturday", short: "Sat" },
  { name: "Sunday", short: "Sun" },
];

/** "Today" / "Yesterday" / weekday / short date — reads more human than a raw ISO string. */
function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function SessionHistory({ logs, onDeleteLog, onPostTrail }: SessionHistoryProps) {
  const [filter, setFilter] = useState<Filter>("All");

  // Editable Daily Step Goal (default 10,000 steps)
  const [dailyStepGoal, setDailyStepGoal] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem("walkbuddy_daily_step_goal") || "", 10);
    return Number.isFinite(saved) && saved > 0 ? saved : 10000;
  });

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(dailyStepGoal));

  const commitGoal = () => {
    const v = parseInt(goalDraft, 10);
    const next = Number.isFinite(v) && v > 0 ? Math.min(100000, Math.max(1000, v)) : dailyStepGoal;
    setDailyStepGoal(next);
    localStorage.setItem("walkbuddy_daily_step_goal", String(next));
    setGoalDraft(String(next));
    setEditingGoal(false);
  };

  const shown = useMemo(
    () => (filter === "All" ? logs : logs.filter((l) => l.type === filter)),
    [logs, filter]
  );

  const totals = useMemo(
    () =>
      shown.reduce(
        (acc, l) => ({
          distance: acc.distance + l.distanceKm,
          steps: acc.steps + l.steps,
          minutes: acc.minutes + l.durationMin,
          elevation: acc.elevation + (l.elevationGainM ?? 0),
        }),
        { distance: 0, steps: 0, minutes: 0, elevation: 0 }
      ),
    [shown]
  );

  /** Longest single session in the current filter — the "Personal Best" callout. */
  const bestLog = useMemo(() => {
    if (shown.length === 0) return null;
    return shown.reduce((best, l) => (l.distanceKm > best.distanceKm ? l : best), shown[0]);
  }, [shown]);

  /** 7-Day Concentric Week Rings Data (Monday -> Sunday) */
  const weekRingsData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = (today.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayDow);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayLogs = logs.filter((l) => l.date === dateStr);
      const steps = dayLogs.reduce((sum, l) => sum + l.steps, 0);
      const distanceKm = dayLogs.reduce((sum, l) => sum + l.distanceKm, 0);
      const progress = Math.min(100, Math.round((steps / dailyStepGoal) * 100));

      days.push({
        index: i,
        name: RING_DAYS[i].short,
        fullName: RING_DAYS[i].name,
        dateStr,
        dateFormatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        steps,
        distanceKm,
        progress,
        goalMet: steps >= dailyStepGoal,
        isToday: i === todayDow,
      });
    }

    return {
      days,
      todayDow,
    };
  }, [logs, dailyStepGoal]);

  // Selected Day Index for concentric rings (defaults to Today)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(weekRingsData.todayDow);

  // Active selected day info
  const selectedDay = weekRingsData.days[selectedDayIndex] || weekRingsData.days[weekRingsData.todayDow];

  const ringSvgSize = 250;
  const center = ringSvgSize / 2;

  return (
    <div className="w-full space-y-10 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-1.5 pb-6 border-b border-black/30">
        <h1 className="font-headline text-4xl md:text-5xl font-black text-[var(--wb-text)] italic tracking-tight uppercase leading-none">
          My Sessions
        </h1>
        <p className="text-sm text-gray-500 text-accent-serif">
          Every walk, jog and sprint you've completed
        </p>
      </div>

      {/* Hero — Personal Best + 7-Ring Weekly Rhythm */}
      {shown.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-black/20">
          <div>
            <div className="flex items-center gap-1.5 mb-5">
              <Trophy className="w-4 h-4 text-black" />
              <span className="text-[11px] uppercase font-black tracking-wider text-gray-600">
                Personal Best
              </span>
            </div>
            <div className="font-headline text-5xl font-black text-[var(--wb-text)] tracking-tight leading-none">
              {bestLog!.distanceKm}
              <span className="text-lg font-medium text-gray-500 ml-1">km</span>
            </div>
            <div className="text-[13px] text-gray-600 font-semibold mt-2.5">
              {bestLog!.type} &middot; {formatRelativeDate(bestLog!.date)}
            </div>
            <div className="w-full bg-black/10 h-1 mt-5">
              <div className="h-full bg-black transition-all duration-700" style={{ width: "100%" }} />
            </div>
          </div>

          {/* 7-Ring Synchronous Step View */}
          <div className="md:pl-8 flex flex-col items-center text-center">
            {/* Top Bar: Title + Editable Goal steps at top right */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-wider text-gray-600">
                <CalendarDays className="w-4 h-4 text-black" />
                Weekly 7-Ring Rhythm
              </span>

              {/* Editable Goal Steps at Top Right */}
              {editingGoal ? (
                <div className="flex items-center gap-1 border-b border-black text-xs font-black pb-0.5">
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    step="500"
                    autoFocus
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitGoal();
                      if (e.key === "Escape") {
                        setGoalDraft(String(dailyStepGoal));
                        setEditingGoal(false);
                      }
                    }}
                    className="w-16 bg-transparent text-xs font-black text-black text-center focus:outline-none"
                  />
                  <button type="button" onClick={commitGoal} className="text-black hover:opacity-80">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGoalDraft(String(dailyStepGoal));
                    setEditingGoal(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-black border-b border-gray-400 hover:border-black transition-colors group"
                  title="Click to edit daily step goal"
                >
                  <span>Goal: {dailyStepGoal.toLocaleString()} steps</span>
                  <Pencil className="w-3 h-3 text-black opacity-60 group-hover:opacity-100" />
                </button>
              )}
            </div>

            {/* DAY NAME MOVED ABOVE THE RING */}
            <div className="font-headline text-2xl font-black text-black uppercase italic tracking-tight mb-2">
              {selectedDay.fullName} {selectedDay.isToday && "(Today)"}
            </div>

            {/* 7 Concentric Rings with High Contrast Active Ring */}
            <div className="relative" style={{ width: ringSvgSize, height: ringSvgSize }}>
              <svg
                className="w-full h-full transform -rotate-90 cursor-pointer"
                viewBox={`0 0 ${ringSvgSize} ${ringSvgSize}`}
              >
                {weekRingsData.days.map((day) => {
                  const radius = 32 + day.index * 13;
                  const isSelected = day.index === selectedDayIndex;
                  const strokeWidth = isSelected ? 11 : 5;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (day.progress / 100) * circumference;

                  return (
                    <g
                      key={day.name}
                      onClick={() => setSelectedDayIndex(day.index)}
                      className="group cursor-pointer"
                    >
                      {/* Track */}
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={isSelected ? "#000000" : "#e4e4e7"}
                        strokeWidth={strokeWidth}
                        strokeOpacity={isSelected ? "0.2" : "0.35"}
                        className="transition-all"
                      />
                      {/* Progress Ring */}
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={isSelected ? "#000000" : "#a1a1aa"}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        strokeOpacity={isSelected ? 1.0 : 0.35}
                        className="transition-all duration-700 ease-out"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Minimal Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Footprints className="w-8 h-8 text-black fill-black opacity-30" />
              </div>
            </div>

            {/* CURRENT NUMBER OF STEPS MOVED BELOW THE RING */}
            <div className="mt-4 flex flex-col items-center">
              <div className="font-headline text-4xl sm:text-5xl font-black text-black leading-none">
                {selectedDay.steps.toLocaleString()}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 mt-1">
                Steps Logged
              </span>
              <div className="text-xs font-bold text-gray-700 mt-2">
                {selectedDay.goalMet ? (
                  <span className="text-emerald-800 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Goal Achieved!
                  </span>
                ) : (
                  <span>
                    {selectedDay.progress}% of {dailyStepGoal.toLocaleString()} steps goal
                  </span>
                )}
              </div>
            </div>

            {/* Quick day selector tabs — underline style, no circular boxes */}
            <div className="flex items-center justify-between gap-2 w-full max-w-[280px] mt-4 border-t border-black/15 pt-3">
              {weekRingsData.days.map((day) => (
                <button
                  key={day.name}
                  type="button"
                  onClick={() => setSelectedDayIndex(day.index)}
                  className={`pb-1 border-b-2 text-xs font-black uppercase transition-all ${
                    selectedDayIndex === day.index
                      ? "text-black border-black font-extrabold"
                      : "text-gray-400 border-transparent hover:text-gray-700"
                  }`}
                  title={`${day.fullName}: ${day.steps.toLocaleString()} steps`}
                >
                  {day.name[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex gap-7 overflow-x-auto no-scrollbar border-y border-black/20 py-6">
        {[
          { label: "Distance", value: `${totals.distance.toFixed(1)}`, unit: "km", icon: <Compass className="w-7 h-7 text-black" /> },
          { label: "Steps", value: totals.steps.toLocaleString(), unit: "", icon: <Footprints className="w-7 h-7 text-black fill-black" /> },
          { label: "Time", value: `${Math.floor(totals.minutes / 60)}h ${totals.minutes % 60}`, unit: "m", icon: <Clock className="w-7 h-7 text-black" /> },
          { label: "Elevation", value: totals.elevation.toLocaleString(), unit: "m", icon: <Mountain className="w-7 h-7 text-black" /> },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-3 shrink-0 pr-7 border-r border-black/15 last:border-r-0 last:pr-0">
            {t.icon}
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-gray-500 mb-0.5">
                {t.label}
              </div>
              <div className="font-headline text-2xl font-black text-[var(--wb-text)] tracking-tight leading-none">
                {t.value}
                {t.unit && (
                  <span className="text-xs font-medium text-gray-500 ml-1">{t.unit}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-7 overflow-x-auto no-scrollbar -mt-4">
        {(["All", "Walking", "Jogging"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-2 -mb-px border-b-2 text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
              filter === f
                ? "text-black border-black"
                : "text-gray-400 border-transparent hover:text-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Session list */}
      {shown.length === 0 ? (
        <div className="text-center space-y-2 py-10">
          <Footprints className="w-8 h-8 text-black/40 mx-auto" />
          <p className="text-sm text-gray-600 font-medium">
            No {filter === "All" ? "" : filter.toLowerCase()} sessions yet.
          </p>
          <p className="text-[13px] text-gray-500">
            Start a route from the Feed — it'll show up here when you finish.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/15">
          {shown.map((log) => {
            const accent = TYPE_ACCENT[log.type] || "teal";
            const isBest = bestLog && log.id === bestLog.id;
            const distPct = bestLog && bestLog.distanceKm > 0
              ? Math.max(8, Math.round((log.distanceKm / bestLog.distanceKm) * 100))
              : 100;
            return (
              <div key={log.id} className="group/row py-7 first:pt-0 space-y-5 transition-colors hover:bg-black/[0.02]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="accent-chip w-10 h-10 flex items-center justify-center shrink-0 border transition-transform group-hover/row:scale-105"
                      data-accent={accent}
                    >
                      <Footprints className="w-4.5 h-4.5 text-black fill-black" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline text-[15px] font-extrabold text-[var(--wb-text)]">
                          {log.type}
                        </span>
                        <span className="text-[12px] text-gray-500 font-semibold">&middot; {formatRelativeDate(log.date)}</span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                            <Trophy className="w-2.5 h-2.5 text-white" />
                            Best
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {onPostTrail && (
                      <button
                        onClick={() => onPostTrail(log)}
                        title="Post as Trail"
                        className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[var(--wb-text)] hover:text-black transition-colors"
                      >
                        <span className="hidden sm:inline">Post as Trail</span>
                        <ArrowUpRight className="w-4 h-4 text-black" />
                      </button>
                    )}
                    {onDeleteLog && (
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete this session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Compass className="w-6 h-6 text-black" />
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mb-0.5">Distance</div>
                    <div className="font-headline text-3xl font-black text-[var(--wb-text)] leading-none">
                      {log.distanceKm}
                      <span className="text-xs font-medium text-gray-500 ml-1">km</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                  {[
                    { l: "Elevation", v: `${log.elevationGainM ?? 0} m`, icon: <Mountain className="w-6 h-6 text-black" /> },
                    { l: "Steps", v: log.steps.toLocaleString(), icon: <Footprints className="w-6 h-6 text-black fill-black" /> },
                    { l: "Time", v: `${log.durationMin}m`, icon: <Clock className="w-6 h-6 text-black" /> },
                    { l: "Pace", v: `${log.paceMinPerKm}`, icon: <Gauge className="w-6 h-6 text-black" /> },
                  ].map((m) => (
                    <div key={m.l} className="flex items-center gap-2.5">
                      {m.icon}
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mb-0.5">{m.l}</div>
                        <div className="text-[13px] font-bold text-[var(--wb-text)]">{m.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
