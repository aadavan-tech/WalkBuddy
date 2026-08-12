import React, { useMemo, useState } from "react";
import {
  Footprints,
  Compass,
  Activity,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { ActivityLog } from "../types";
import WalkBuddyLogo from "./WalkBuddyLogo";

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
      {/* Dashboard Brand & Period Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-[#b58974]/30 dark:border-[#d2a649]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[#b58974]/10 dark:bg-[#d2a649]/10 border border-[#b58974]/30 dark:border-[#d2a649]/30 shadow-sm">
            <WalkBuddyLogo size={42} glow={true} />
          </div>
          <div>
            <h2 className="font-headline text-xl font-black text-[var(--wb-text)] dark:text-white italic tracking-tight flex items-center gap-2">
              WalkBuddy Dashboard
            </h2>
            <p className="text-xs text-slate-600 dark:text-amber-100/70 font-semibold mt-0.5">
              Outdoor Fitness Tracking &amp; Social Activity Overview • <span className="text-[#b58974] dark:text-[#d2a649] font-bold">{periodLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/5 dark:bg-[#020b08]/80 border border-[var(--wb-line)] dark:border-[#d2a649]/30 rounded-full p-1 shrink-0 self-start sm:self-auto">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                period === p
                  ? "bg-[#b58974] dark:bg-gradient-to-r dark:from-[#d2a649] dark:to-[#f0d58c] text-white dark:text-black shadow-md"
                  : "text-slate-600 dark:text-amber-100/70 hover:text-slate-900 dark:hover:text-white"
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
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#b58974]/50 dark:hover:border-[#d2a649]/50 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#b58974]/10 dark:bg-[#d2a649]/10 rounded-full blur-2xl transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#b58974]/15 dark:bg-[#d2a649]/15 flex items-center justify-center border border-[#b58974]/30 dark:border-[#d2a649]/30">
              <Footprints className="w-5.5 h-5.5 text-[#b58974] dark:text-[#d2a649]" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-amber-100/80 uppercase font-black tracking-wider">Total Steps</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-[var(--wb-text)] dark:text-white tracking-tight">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#b58974] dark:text-[#d2a649] font-bold mt-1">{periodLabel}</div>
          </div>
        </div>

        {/* Distance Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#b58974]/50 dark:hover:border-[#f0d58c]/50 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#b58974]/10 dark:bg-[#f0d58c]/10 rounded-full blur-2xl transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#b58974]/15 dark:bg-[#f0d58c]/15 flex items-center justify-center border border-[#b58974]/30 dark:border-[#f0d58c]/30">
              <Compass className="w-5.5 h-5.5 text-[#b58974] dark:text-[#f0d58c]" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-amber-100/80 uppercase font-black tracking-wider">Distance Covered</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-[var(--wb-text)] dark:text-white tracking-tight">
              {totalDistance} <span className="text-base font-medium text-slate-500 dark:text-amber-100/70">km</span>
            </div>
            <div className="text-[11px] text-[#b58974] dark:text-[#d2a649] font-bold mt-1">{periodLabel}</div>
          </div>
        </div>

        {/* Sessions Tile */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#b58974]/50 dark:hover:border-[#e5c378]/50 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#b58974]/10 dark:bg-[#e5c378]/10 rounded-full blur-2xl transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#b58974]/15 dark:bg-[#e5c378]/15 flex items-center justify-center border border-[#b58974]/30 dark:border-[#e5c378]/30">
              <Activity className="w-5.5 h-5.5 text-[#b58974] dark:text-[#e5c378]" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-amber-100/80 uppercase font-black tracking-wider">Sessions Logged</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-[var(--wb-text)] dark:text-white tracking-tight">
              {sessionCount}
            </div>
            <div className="text-[11px] text-[#b58974] dark:text-[#d2a649] font-bold mt-1">{periodLabel}</div>
          </div>
        </div>
      </div>

      {/* Fitness Trends Section */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-lg font-extrabold text-[var(--wb-text)] dark:text-white tracking-tight">Fitness Metrics</h3>
          <span className="text-xs text-[#b58974] dark:text-[#d2a649] font-black uppercase tracking-wider">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latest Pace */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#b58974]/30 dark:hover:border-[#d2a649]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#b58974]/15 dark:bg-[#d2a649]/15 flex items-center justify-center shrink-0 border border-[#b58974]/30 dark:border-[#d2a649]/30">
              <Gauge className="w-6 h-6 text-[#b58974] dark:text-[#d2a649]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 dark:text-amber-100/80 uppercase tracking-widest font-black">Latest Pace</div>
              <div className="font-headline text-xl font-black text-[var(--wb-text)] dark:text-white">{latestPace} /km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#b58974]/15 dark:bg-[#d2a649]/15 text-[#b58974] dark:text-[#d2a649] font-bold px-3 py-1 rounded-full border border-[#b58974]/25 dark:border-[#d2a649]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Steady Rhythm</span>
            </div>
          </div>

          {/* Distance this period */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#b58974]/30 dark:hover:border-[#f0d58c]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#b58974]/15 dark:bg-[#f0d58c]/15 flex items-center justify-center shrink-0 border border-[#b58974]/30 dark:border-[#f0d58c]/30">
              <Compass className="w-6 h-6 text-[#b58974] dark:text-[#f0d58c]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 dark:text-amber-100/80 uppercase tracking-widest font-black">Distance {periodLabel}</div>
              <div className="font-headline text-xl font-black text-[var(--wb-text)] dark:text-white">{totalDistance} km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#b58974]/15 dark:bg-[#f0d58c]/15 text-[#b58974] dark:text-[#f0d58c] font-bold px-3 py-1 rounded-full border border-[#b58974]/25 dark:border-[#f0d58c]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{sessionCount} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
