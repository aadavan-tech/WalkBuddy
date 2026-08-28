import React, { useMemo, useState } from "react";
import { Footprints, Compass, Clock, Trash2, Mountain, ArrowUpRight, Trophy, TrendingUp, Gauge } from "lucide-react";
import { ActivityLog } from "../types";

interface SessionHistoryProps {
  logs: ActivityLog[];
  onDeleteLog?: (id: string) => void;
  /** Opens the Post Trail form prefilled with this session's metrics. */
  onPostTrail?: (log: ActivityLog) => void;
}

type Filter = "All" | "Walking" | "Jogging" | "Sprinting";

/** Accent keys resolved in CSS (.accent-chip[data-accent]) — all resolve to the ink colour in the single theme. */
const TYPE_ACCENT: Record<string, string> = {
  Walking: "teal",
  Jogging: "cyan",
  Sprinting: "lime",
};

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

const RING_WEEKS = 12;
/** Innermost ring radius, then how much each ring further out grows by. */
const RING_BASE_RADIUS = 44;
const RING_SPACING = 8;
const RING_STROKE = 6;

interface WeekBucket {
  startLabel: string;
  endLabel: string;
  distance: number;
}

/**
 * "My Sessions" tab — every completed workout, newest first, with totals and
 * a per-activity filter. This is where a session lands after you hit Finish.
 */
export default function SessionHistory({ logs, onDeleteLog, onPostTrail }: SessionHistoryProps) {
  const [filter, setFilter] = useState<Filter>("All");

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

  /** Last 12 weeks (Mon-Sun), oldest first — this week is the last entry. */
  const weeklyRings = useMemo<WeekBucket[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = (today.getDay() + 6) % 7; // 0 = Monday
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - todayDow);

    const buckets: { start: Date; end: Date; distance: number }[] = [];
    for (let w = RING_WEEKS - 1; w >= 0; w--) {
      const start = new Date(thisWeekStart);
      start.setDate(thisWeekStart.getDate() - w * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      buckets.push({ start, end, distance: 0 });
    }

    shown.forEach((l) => {
      const d = new Date(l.date + "T00:00:00");
      const bucket = buckets.find((b) => d >= b.start && d < b.end);
      if (bucket) bucket.distance += l.distanceKm;
    });

    return buckets.map((b) => ({
      startLabel: b.start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      endLabel: new Date(b.end.getTime() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      distance: b.distance,
    }));
  }, [shown]);

  const maxWeekDistance = Math.max(0, ...weeklyRings.map((w) => w.distance));
  const thisWeek = weeklyRings[weeklyRings.length - 1];
  const activeWeekCount = weeklyRings.filter((w) => w.distance > 0).length;
  const ringContainerSize = (RING_BASE_RADIUS + (RING_WEEKS - 1) * RING_SPACING + RING_STROKE) * 2;

  return (
    <div className="w-full space-y-10 max-w-3xl mx-auto pb-12">
      {/* Header — plain type on the page background, no card */}
      <div className="space-y-1.5 pb-6 border-b border-black/30">
        <h1 className="font-headline text-4xl md:text-5xl font-black text-[var(--wb-text)] italic tracking-tight uppercase leading-none">
          My Sessions
        </h1>
        <p className="text-sm text-gray-500 text-accent-serif">
          Every walk, jog and sprint you've completed
        </p>
      </div>

      {/* Hero — Personal Best + Recent Trend, split like the Analytics page */}
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

          <div className="md:pl-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-5">
              <span className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-wider text-gray-600">
                <TrendingUp className="w-4 h-4 text-black" />
                12-Week Rhythm
              </span>
              <span className="text-[11px] text-gray-500 font-bold">
                {activeWeekCount} active week{activeWeekCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="relative" style={{ width: ringContainerSize, height: ringContainerSize }}>
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox={`0 0 ${ringContainerSize} ${ringContainerSize}`}
              >
                {weeklyRings.map((week, i) => {
                  const radius = RING_BASE_RADIUS + (weeklyRings.length - 1 - i) * RING_SPACING;
                  const circumference = 2 * Math.PI * radius;
                  const ratio = maxWeekDistance > 0 ? week.distance / maxWeekDistance : 0;
                  const fillRatio = week.distance > 0 ? Math.max(0.035, ratio) : 0;
                  const isThisWeek = i === weeklyRings.length - 1;
                  const center = ringContainerSize / 2;
                  return (
                    <g key={i}>
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={RING_STROKE}
                        className="text-black/[0.07]"
                      />
                      <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - fillRatio * circumference}
                        className={isThisWeek ? "text-black" : "text-black/60"}
                        style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
                      >
                        <title>
                          {week.startLabel}–{week.endLabel}: {week.distance.toFixed(1)} km
                        </title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline text-3xl font-black text-black leading-none">
                  {(thisWeek?.distance ?? 0).toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-1.5">
                  This Week
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 font-semibold mt-4 text-center max-w-[220px]">
              Each ring is one week — innermost is now, fill shows distance vs. your busiest week.
            </p>
          </div>
        </div>
      )}

      {/* Totals — a horizontal icon-led strip, not a grid that awkwardly wraps on mobile */}
      <div className="flex gap-7 overflow-x-auto no-scrollbar border-y border-black/20 py-6">
        {[
          { label: "Distance", value: `${totals.distance.toFixed(1)}`, unit: "km", icon: <Compass className="w-7 h-7 text-black" /> },
          { label: "Steps", value: totals.steps.toLocaleString(), unit: "", icon: <Footprints className="w-7 h-7 text-black" /> },
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

      {/* Filter tabs — text, underlined */}
      <div className="flex gap-7 overflow-x-auto no-scrollbar -mt-4">
        {(["All", "Walking", "Jogging", "Sprinting"] as Filter[]).map((f) => (
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

      {/* Session list — divided rows, generously spaced like Analytics */}
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
                      className="accent-chip w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover/row:scale-105"
                      data-accent={accent}
                    >
                      <Footprints className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline text-[15px] font-extrabold text-[var(--wb-text)]">
                          {log.type} Session
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                            <Trophy className="w-2.5 h-2.5 text-white" />
                            Best
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-gray-500 font-semibold">{formatRelativeDate(log.date)}</div>
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

                {log.notes && (
                  <p className="text-[13px] text-gray-700 italic leading-relaxed">
                    "{log.notes}"
                  </p>
                )}

                <div className="flex items-end justify-between gap-6">
                  <div className="shrink-0 flex items-center gap-2.5">
                    <Compass className="w-6 h-6 text-black" />
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-black mb-0.5">Distance</div>
                      <div className="font-headline text-3xl font-black text-[var(--wb-text)] leading-none">
                        {log.distanceKm}
                        <span className="text-xs font-medium text-gray-500 ml-1">km</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[220px] mb-1.5">
                    <div className="w-full bg-black/10 h-1">
                      <div
                        className="h-full bg-black transition-all duration-700"
                        style={{ width: `${distPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                  {[
                    { l: "Elevation", v: `${log.elevationGainM ?? 0} m`, icon: <Mountain className="w-6 h-6 text-black" /> },
                    { l: "Steps", v: log.steps.toLocaleString(), icon: <Footprints className="w-6 h-6 text-black" /> },
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
