import React, { useMemo, useState } from "react";
import {
  Footprints,
  Compass,
  Activity,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { ActivityLog } from "../types";
import LoopLogo from "./LoopLogo";

interface HubDashboardProps {
  logs: ActivityLog[];
}

type Period = "day" | "week" | "month";

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

  const windowDays = period === "day" ? 1 : period === "week" ? 7 : 30;
  const periodLabel =
    period === "day" ? "Today" : period === "week" ? "This Week" : "This Month";

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
      {/* Header — plain type, no card */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/30">
        <div className="flex items-center gap-3">
          <LoopLogo size={34} />
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-black text-[var(--wb-text)] italic tracking-tight leading-none">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-1.5 text-accent-serif">
              Outdoor Fitness Tracking &amp; Social Activity Overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`pb-1 border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${period === p
                  ? "text-black border-black"
                  : "text-gray-400 border-transparent hover:text-gray-700"
                }`}
            >
              {p === "day" ? "Daily" : p === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Header Metrics — one divided row */}
      <div className="grid grid-cols-3 divide-x divide-black/20 border-y border-black/20 py-5">
        <div className="px-4 first:pl-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Footprints className="w-4 h-4 text-black fill-black" />
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Total Steps</span>
          </div>
          <div className="font-headline text-3xl font-black text-[var(--wb-text)] tracking-tight leading-none">
            {totalSteps.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 font-bold mt-1.5 text-accent-serif">{periodLabel}</div>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Compass className="w-4 h-4 text-black" />
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Distance</span>
          </div>
          <div className="font-headline text-3xl font-black text-[var(--wb-text)] tracking-tight leading-none">
            {totalDistance} <span className="text-base font-medium text-gray-500">km</span>
          </div>
          <div className="text-[11px] text-gray-500 font-bold mt-1.5 text-accent-serif">{periodLabel}</div>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity className="w-4 h-4 text-black" />
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Sessions</span>
          </div>
          <div className="font-headline text-3xl font-black text-[var(--wb-text)] tracking-tight leading-none">
            {sessionCount}
          </div>
          <div className="text-[11px] text-gray-500 font-bold mt-1.5 text-accent-serif">{periodLabel}</div>
        </div>
      </div>

      {/* Fitness Metrics — a list, not a grid of cards */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-headline text-lg font-extrabold text-[var(--wb-text)] tracking-tight">Fitness Metrics</h3>
          <span className="text-xs text-gray-500 font-black uppercase tracking-wider">{periodLabel}</span>
        </div>
        <div className="divide-y divide-black/15 border-t border-black/15">
          <div className="flex items-center gap-4 py-4">
            <Gauge className="w-5 h-5 text-black shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Latest Pace</div>
              <div className="font-headline text-xl font-black text-[var(--wb-text)]">{latestPace} /km</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-black" />
              <span>Steady Rhythm</span>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4">
            <Compass className="w-5 h-5 text-black shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Distance {periodLabel}</div>
              <div className="font-headline text-xl font-black text-[var(--wb-text)]">{totalDistance} km</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-black" />
              <span>{sessionCount} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
