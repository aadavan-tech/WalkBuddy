import React, { useMemo, useState } from "react";
import { Footprints, Compass, Flame, Clock, Trash2, History, Mountain, Share2 } from "lucide-react";
import { ActivityLog } from "../types";

interface SessionHistoryProps {
  logs: ActivityLog[];
  onDeleteLog?: (id: string) => void;
  /** Opens the Post Trail form prefilled with this session's metrics. */
  onPostTrail?: (log: ActivityLog) => void;
}

type Filter = "All" | "Walking" | "Jogging" | "Sprinting";

/** Accent keys resolved in CSS (.accent-chip[data-accent]) so both themes work. */
const TYPE_ACCENT: Record<string, string> = {
  Walking: "teal",
  Jogging: "cyan",
  Sprinting: "lime",
};

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
          calories: acc.calories + l.calories,
          elevation: acc.elevation + (l.elevationGainM ?? 0),
        }),
        { distance: 0, steps: 0, minutes: 0, calories: 0, elevation: 0 }
      ),
    [shown]
  );

  return (
    <div className="w-full space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-1 border-b border-[#00ffc8]/20 pb-4">
        <h1 className="font-headline text-3xl font-black text-white italic tracking-tight uppercase leading-none flex items-center gap-2.5">
          <History className="w-7 h-7 text-[#00ffc8]" />
          <span>My Sessions</span>
        </h1>
        <p className="text-[13px] text-emerald-200/75 uppercase tracking-widest font-black">
          Every walk, jog and sprint you've completed
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "Distance",
            value: `${totals.distance.toFixed(1)}`,
            unit: "km",
            icon: <Compass className="w-4.5 h-4.5" />,
            color: "cyan",
          },
          {
            label: "Steps",
            value: totals.steps.toLocaleString(),
            unit: "",
            icon: <Footprints className="w-4.5 h-4.5" />,
            color: "teal",
          },
          {
            label: "Time",
            value: `${Math.floor(totals.minutes / 60)}h ${totals.minutes % 60}`,
            unit: "m",
            icon: <Clock className="w-4.5 h-4.5" />,
            color: "teal",
          },
          {
            label: "Elevation",
            value: totals.elevation.toLocaleString(),
            unit: "m",
            icon: <Mountain className="w-4.5 h-4.5" />,
            color: "lime",
          },
          {
            label: "Calories",
            value: totals.calories.toLocaleString(),
            unit: "kcal",
            icon: <Flame className="w-4.5 h-4.5" />,
            color: "lime",
          },
        ].map((t) => (
          <div key={t.label} className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div
                className="accent-chip w-9 h-9 rounded-xl flex items-center justify-center border"
                data-accent={t.color}
              >
                {t.icon}
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200/70">
                {t.label}
              </span>
            </div>
            <div className="font-headline text-2xl font-black text-white tracking-tight">
              {t.value}
              {t.unit && (
                <span className="text-xs font-medium text-emerald-200/60 ml-1">{t.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(["All", "Walking", "Jogging", "Sprinting"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-wider transition-all shrink-0 border ${
              filter === f
                ? "bg-[#00ffc8]/20 text-[#00ffc8] border-[#00ffc8]/50"
                : "text-emerald-100/60 hover:text-white border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Session list */}
      {shown.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-2">
          <Footprints className="w-10 h-10 text-[#00ffc8]/50 mx-auto" />
          <p className="text-sm text-emerald-200/70 font-medium">
            No {filter === "All" ? "" : filter.toLowerCase()} sessions yet.
          </p>
          <p className="text-[13px] text-emerald-200/55">
            Start a route from the Feed — it'll show up here when you finish.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((log) => {
            const accent = TYPE_ACCENT[log.type] || "#00ffc8";
            return (
              <div
                key={log.id}
                className="glass-panel p-4 rounded-2xl space-y-3 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="accent-chip w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                      data-accent={accent}
                    >
                      <Footprints className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline text-[15px] font-extrabold text-white truncate">
                        {log.type} Session
                      </div>
                      <div className="text-[12px] text-emerald-200/70 font-mono">{log.date}</div>
                    </div>
                  </div>
                  {onDeleteLog && (
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 rounded-lg text-emerald-200/50 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Delete this session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {log.notes && (
                  <p className="text-[13px] text-emerald-100/80 italic leading-relaxed">
                    "{log.notes}"
                  </p>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                  {[
                    { l: "Distance", v: `${log.distanceKm} km` },
                    { l: "Elevation", v: `${log.elevationGainM ?? 0} m` },
                    { l: "Steps", v: log.steps.toLocaleString() },
                    { l: "Time", v: `${log.durationMin}m` },
                    { l: "Pace", v: `${log.paceMinPerKm}` },
                    { l: "Calories", v: `${log.calories}` },
                  ].map((m) => (
                    <div key={m.l}>
                      <div className="text-[10px] text-emerald-200/60 uppercase font-black tracking-wider">
                        {m.l}
                      </div>
                      {/* No accent colours here — plain text reads cleanly in
                          both themes and avoids the neon glow in light mode. */}
                      <div className="text-[13px] font-black mt-0.5 text-white">{m.v}</div>
                    </div>
                  ))}
                </div>

                {onPostTrail && (
                  <button
                    onClick={() => onPostTrail(log)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider border bg-[#00ffc8]/12 text-[#00ffc8] border-[#00ffc8]/35 hover:bg-[#00ffc8]/20 transition-all active:scale-[0.99]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Post as Trail</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
