import React, { useMemo, useState } from "react";
import {
  Flame,
  Footprints,
  Compass,
  Zap,
  BarChart3,
  Calendar,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { ActivityLog } from "../types";
import { ActivityMode } from "../data/badges";
import AchievementsRoadmap from "./AchievementsRoadmap";

interface WeeklyProgressProps {
  logs: ActivityLog[];
  onStartSuggestedSession?: () => void;
}

type AnalyticsTab = "daily" | "weekly" | "monthly";

const MODE_META: {
  mode: ActivityMode;
  icon: React.ReactNode;
}[] = [
  { mode: "Walking", icon: <Footprints className="w-4 h-4 text-black fill-black" /> },
  { mode: "Jogging", icon: <Footprints className="w-4 h-4 text-black fill-black" /> },
];

export default function WeeklyProgress({
  logs,
}: WeeklyProgressProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("weekly");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Dynamically calculate active workout streak and current week's active days
  const streakData = useMemo(() => {
    const dates = new Set(logs.map((l) => l.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);

    // If today hasn't had a session logged yet, check starting from yesterday
    const todayISO = today.toISOString().split("T")[0];
    if (!dates.has(todayISO)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Active status for Monday -> Sunday of the current week
    const todayDow = (today.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayDow);

    const weekActiveDays = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split("T")[0];
      return dates.has(dStr);
    });

    return {
      currentStreak,
      weekActiveDays,
    };
  }, [logs]);

  // 1. Daily Distances by mode (Today)
  const dailyDistancesByMode = useMemo(() => {
    const modeMap: Record<ActivityMode, number> = { Walking: 0, Jogging: 0 };
    logs.filter((l) => l.date === todayStr).forEach((l) => {
      if (l.type in modeMap) modeMap[l.type] += l.distanceKm;
    });
    return modeMap;
  }, [logs, todayStr]);

  // 2. Weekly Distances by mode (This Week: Mon -> Sun)
  const weeklyDistancesByMode = useMemo(() => {
    const now = new Date();
    const todayDow = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayDow);
    monday.setHours(0, 0, 0, 0);

    const modeMap: Record<ActivityMode, number> = { Walking: 0, Jogging: 0 };
    logs.filter((l) => {
      const d = new Date(l.date + "T00:00:00");
      return d >= monday;
    }).forEach((l) => {
      if (l.type in modeMap) modeMap[l.type] += l.distanceKm;
    });
    return modeMap;
  }, [logs]);

  // 3. Monthly Distances by mode (Last 30 Days)
  const monthlyDistancesByMode = useMemo(() => {
    const now = new Date();
    const modeMap: Record<ActivityMode, number> = { Walking: 0, Jogging: 0 };
    logs.filter((l) => {
      const d = new Date(l.date + "T00:00:00");
      const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
      return diffDays >= 0 && diffDays < 30;
    }).forEach((l) => {
      if (l.type in modeMap) modeMap[l.type] += l.distanceKm;
    });
    return modeMap;
  }, [logs]);

  // Current distance mode mapping based on active timeframe tab
  const currentModeDistances =
    activeTab === "daily"
      ? dailyDistancesByMode
      : activeTab === "weekly"
      ? weeklyDistancesByMode
      : monthlyDistancesByMode;

  const periodTitle =
    activeTab === "daily"
      ? "Daily Distance Travelled"
      : activeTab === "weekly"
      ? "Weekly Distance Travelled"
      : "Monthly Distance Travelled";

  // All-time Cumulative distance by mode
  const distancesByMode: Record<ActivityMode, number> = { Walking: 0, Jogging: 0 };
  logs.forEach((log) => {
    if (log.type in distancesByMode) {
      distancesByMode[log.type] += log.distanceKm;
    }
  });
  const totalAllTimeDistance =
    distancesByMode.Walking + distancesByMode.Jogging;

  return (
    <div className="w-full space-y-10 max-w-4xl mx-auto pb-12">
      {/* Header — Title & Clean Underlined Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/30 pb-0">
        <div className="space-y-1.5 pb-6">
          <h1 className="font-headline text-4xl md:text-5xl font-black text-black italic tracking-tight uppercase leading-none flex items-center gap-3">
            <BarChart3 className="w-9 h-9 text-black stroke-[2.5]" />
            <span>Analytics</span>
          </h1>
          <p className="text-sm text-gray-500 text-accent-serif font-medium">
            Daily performance metrics, weekly progress, and 30-day activity trends
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-6 shrink-0 -mb-px">
          {(["daily", "weekly", "monthly"] as AnalyticsTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "text-black border-black"
                  : "text-gray-400 border-transparent hover:text-gray-700"
              }`}
            >
              {tab === "daily" ? "Daily" : tab === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Layout for Daily, Weekly, and Monthly */}
      <div className="animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-black/20">
          {/* Dynamic Active Workout Streak */}
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">
                  Active Workout Streak
                </span>
                <div className="font-headline text-3xl font-black text-black italic uppercase tracking-tight">
                  {streakData.currentStreak} {streakData.currentStreak === 1 ? "Day Active" : "Days Active"}
                </div>
              </div>
              <Flame className="w-7 h-7 text-black fill-current shrink-0" />
            </div>

            <div className="flex justify-between gap-2">
              {streakData.weekActiveDays.map((active, i) => (
                <div key={i} className={`flex-1 h-10 ${active ? "bg-black" : "bg-black/10"}`} />
              ))}
            </div>
            <div className="flex justify-between mt-2 px-0.5 text-[10px] text-gray-500 font-black tracking-wider">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </div>

          {/* Timeframe Distance Breakdown by Mode */}
          <div className="md:pl-8">
            <h3 className="font-headline text-lg font-extrabold text-black tracking-tight mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-black" />
              <span>{periodTitle}</span>
            </h3>
            <div className="divide-y divide-black/15 border-y border-black/15">
              {MODE_META.map(({ mode, icon }) => (
                <div key={mode} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-black uppercase text-black">{mode}</span>
                  </div>
                  <span className="text-sm font-headline font-black text-black">
                    {currentModeDistances[mode].toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ALL-TIME DISTANCE & ACHIEVEMENTS ROADMAP */}
      <div className="pt-8 border-t border-black/20 space-y-8">
        <div>
          <div className="flex justify-between items-end mb-5 pb-4 border-b border-black/20">
            <div>
              <h3 className="font-headline text-lg font-extrabold text-black tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-black" />
                <span>All-Time Distance Travelled</span>
              </h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 text-accent-serif">
                Across walking, jogging &amp; sprinting
              </p>
            </div>
            <div className="text-right">
              <div className="font-headline text-2xl font-black text-black leading-none">
                {totalAllTimeDistance.toFixed(1)}
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
                    {totalAllTimeDistance > 0
                      ? Math.round((distancesByMode[mode] / totalAllTimeDistance) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="font-headline text-3xl font-black text-black tracking-tight leading-none mb-2">
                  {distancesByMode[mode].toFixed(1)}
                  <span className="text-sm font-medium text-gray-500 ml-1">km</span>
                </div>
                <div className="w-full bg-black/10 h-1">
                  <div
                    className="h-full bg-black transition-all"
                    style={{
                      width: `${
                        totalAllTimeDistance > 0
                          ? (distancesByMode[mode] / totalAllTimeDistance) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Roadmap */}
        <AchievementsRoadmap distancesByMode={distancesByMode} />
      </div>
    </div>
  );
}
