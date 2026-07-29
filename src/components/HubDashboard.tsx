import React from "react";
import {
  Footprints,
  Compass,
  Flame,
  Heart,
  TrendingUp,
  Gauge,
  Zap
} from "lucide-react";
import { ActivityLog } from "../types";

interface HubDashboardProps {
  logs: ActivityLog[];
  onOpenAICoach: () => void;
}

export default function HubDashboard({ logs }: HubDashboardProps) {
  // Totals start from the logged sessions themselves — no seeded padding.
  const totalSteps = logs.reduce((sum, log) => sum + log.steps, 0);
  const totalDistance = parseFloat(
    logs.reduce((sum, log) => sum + log.distanceKm, 0).toFixed(1)
  );
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <div className="w-full space-y-8">
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
            <div className="text-[11px] text-[#00ffc8] font-bold mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>+14% vs Last Session</span>
            </div>
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
            <div className="text-[11px] text-cyan-200/90 font-bold mt-1">
              Weekly Goal: 15.0km
            </div>
          </div>
        </div>

        {/* Calories Tile */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#adff2f]/50 hover:shadow-[0_0_25px_rgba(173,255,47,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#adff2f]/10 rounded-full blur-2xl group-hover:bg-[#adff2f]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#adff2f]/15 flex items-center justify-center border border-[#adff2f]/30">
              <Flame className="w-5.5 h-5.5 text-[#adff2f]" />
            </div>
            <span className="text-[10px] text-lime-200/80 uppercase font-black tracking-wider">Calories Burned</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalCalories} <span className="text-base font-medium text-lime-200/70">kcal</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-[#00ffc8] via-[#00e5ff] to-[#adff2f] h-full w-[78%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Fitness Trends Section */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-lg font-extrabold text-white tracking-tight">Fitness Metrics</h3>
          <span className="text-xs text-[#00ffc8] font-black uppercase tracking-wider">Live Sync</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Average Pace */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00ffc8]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00ffc8]/15 flex items-center justify-center shrink-0 border border-[#00ffc8]/30">
              <Gauge className="w-6 h-6 text-[#00ffc8]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-black">Avg. Pace</div>
              <div className="font-headline text-xl font-black text-white">6'12" /km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00ffc8]/15 text-[#00ffc8] font-bold px-3 py-1 rounded-full border border-[#00ffc8]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Optimal Rhythm</span>
            </div>
          </div>

          {/* Average Heart Rate */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00e5ff]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 flex items-center justify-center shrink-0 border border-[#00e5ff]/30">
              <Heart className="w-6 h-6 text-[#00e5ff]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-cyan-200/80 uppercase tracking-widest font-black">Heart Rate Aerobic Zone</div>
              <div className="font-headline text-xl font-black text-white">128 bpm</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00e5ff]/15 text-[#00e5ff] font-bold px-3 py-1 rounded-full border border-[#00e5ff]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Fat Burning Zone</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
