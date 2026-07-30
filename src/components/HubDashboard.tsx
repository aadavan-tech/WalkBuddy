import React, { useMemo, useState } from "react";
import {
  Footprints,
  Compass,
  Activity,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { ActivityLog } from "../types";

interface HubDashboardProps {
  logs: ActivityLog[];
}

type Period = "week" | "month";

/** Whole days between a log's date and today (0 = today). */
function daysAgo(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

export default function HubDashboard({ logs }: HubDashboardProps) {
  const [period, setPeriod] = useState<Period>("week");

  const windowDays = period === "week" ? 7 : 30;
  const periodLabel = period === "week" ? "This Week" : "This Month";

  const periodLogs = useMemo(
    () => logs.filter((l) => daysAgo(l.date) < windowDays),
    [logs, windowDays]
  );

  const totalSteps = periodLogs.reduce((sum, log) => sum + log.steps, 0);
  const totalDistance = parseFloat(
    periodLogs.reduce((sum, log) => sum + log.distanceKm, 0).toFixed(1)
  );
  const sessionCount = periodLogs.length;
  const latestPace = periodLogs.length ? periodLogs[0].paceMinPerKm : "—";

  return (
    <div className="w-full space-y-8">
      {/* Weekly / Monthly toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-lg font-extrabold text-white tracking-tight">
          {periodLabel}
        </h3>
        <div className="flex items-center gap-1 bg-[#041a14]/70 border border-[#00ffc8]/20 rounded-full p-1">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                period === p
                  ? "bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black shadow-[0_0_12px_rgba(0,255,200,0.35)]"
                  : "text-emerald-200/70 hover:text-white"
              }`}
            >
              {p === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Header Metrics Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Steps Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#00ffc8]/50 hover:shadow-[0_0_25px_rgba(0,255,200,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffc8]/10 rounded-full blur-2xl group-hover:bg-[#00ffc8]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#00ffc8]/15 flex items-center justify-center border border-[#00ffc8]/30">
              <Footprints className="w-5.5 h-5.5 text-[#00ffc8]" />
            </div>
            <span className="text-[10px] text-emerald-200/80 uppercase font-black tracking-wider">Total Steps</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#00ffc8] font-bold mt-1">{periodLabel}</div>
          </div>
        </div>

        {/* Distance Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#00e5ff]/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl group-hover:bg-[#00e5ff]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/15 flex items-center justify-center border border-[#00e5ff]/30">
              <Compass className="w-5.5 h-5.5 text-[#00e5ff]" />
            </div>
            <span className="text-[10px] text-cyan-200/80 uppercase font-black tracking-wider">Distance Covered</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalDistance} <span className="text-base font-medium text-cyan-200/70">km</span>
            </div>
            <div className="text-[11px] text-cyan-200/90 font-bold mt-1">{periodLabel}</div>
          </div>
        </div>

        {/* Sessions Tile */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#adff2f]/50 hover:shadow-[0_0_25px_rgba(173,255,47,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#adff2f]/10 rounded-full blur-2xl group-hover:bg-[#adff2f]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#adff2f]/15 flex items-center justify-center border border-[#adff2f]/30">
              <Activity className="w-5.5 h-5.5 text-[#adff2f]" />
            </div>
            <span className="text-[10px] text-lime-200/80 uppercase font-black tracking-wider">Sessions Logged</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {sessionCount}
            </div>
            <div className="text-[11px] text-lime-200/90 font-bold mt-1">{periodLabel}</div>
          </div>
        </div>
      </div>

      {/* Fitness Trends Section */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-lg font-extrabold text-white tracking-tight">Fitness Metrics</h3>
          <span className="text-xs text-[#00ffc8] font-black uppercase tracking-wider">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latest Pace */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00ffc8]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00ffc8]/15 flex items-center justify-center shrink-0 border border-[#00ffc8]/30">
              <Gauge className="w-6 h-6 text-[#00ffc8]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-black">Latest Pace</div>
              <div className="font-headline text-xl font-black text-white">{latestPace} /km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00ffc8]/15 text-[#00ffc8] font-bold px-3 py-1 rounded-full border border-[#00ffc8]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Steady Rhythm</span>
            </div>
          </div>

          {/* Distance this period */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00e5ff]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 flex items-center justify-center shrink-0 border border-[#00e5ff]/30">
              <Compass className="w-6 h-6 text-[#00e5ff]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-cyan-200/80 uppercase tracking-widest font-black">Distance {periodLabel}</div>
              <div className="font-headline text-xl font-black text-white">{totalDistance} km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00e5ff]/15 text-[#00e5ff] font-bold px-3 py-1 rounded-full border border-[#00e5ff]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{sessionCount} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
