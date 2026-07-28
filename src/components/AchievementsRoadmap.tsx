import React, { useState } from "react";
import { Trophy, Lock, Footprints } from "lucide-react";
import {
  ACTIVITY_MODES,
  getBadgesByMode,
  TIER_ACCENT,
  type ActivityMode,
  type BadgeDefinition,
} from "../data/badges";

interface AchievementsRoadmapProps {
  /** Cumulative distance (km) per mode, used to decide which badges are unlocked. */
  distancesByMode: Record<ActivityMode, number>;
}

const MODE_ACCENT: Record<ActivityMode, string> = {
  Walking: "#00ffc8",
  Jogging: "#00e5ff",
  Sprinting: "#adff2f",
};

function Medallion({
  badge,
  unlocked,
}: {
  badge: BadgeDefinition;
  unlocked: boolean;
}) {
  const accent = TIER_ACCENT[badge.tier];
  return (
    <div
      className={`medallion w-16 h-16 ${unlocked ? "" : "medallion-locked"}`}
      style={
        {
          "--badge-accent": accent,
          "--badge-glow": `${accent}66`,
        } as React.CSSProperties
      }
      title={unlocked ? badge.flavor : badge.requirement}
    >
      {unlocked ? (
        <span className="medallion-emoji">{badge.emoji}</span>
      ) : (
        <Lock className="w-5 h-5 text-white/70" />
      )}
    </div>
  );
}

export default function AchievementsRoadmap({
  distancesByMode,
}: AchievementsRoadmapProps) {
  const [activeMode, setActiveMode] = useState<ActivityMode>("Walking");

  const badges = getBadgesByMode(activeMode);
  const distance = distancesByMode[activeMode] || 0;
  const unlockedCount = badges.filter((b) => distance >= b.thresholdKm).length;
  const nextBadge = badges.find((b) => distance < b.thresholdKm);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5">
        <div>
          <h2 className="font-headline text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00ffc8]" />
            <span>Achievements Roadmap</span>
          </h2>
          <p className="text-[11px] text-emerald-200/70 font-bold uppercase tracking-widest mt-0.5">
            Unlock milestones as you cover more distance
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-8 bg-black/30 p-1.5 rounded-2xl border border-white/5">
        {ACTIVITY_MODES.map((mode) => {
          const isActive = activeMode === mode;
          const modeUnlocked = getBadgesByMode(mode).filter(
            (b) => (distancesByMode[mode] || 0) >= b.thresholdKm
          ).length;
          return (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-emerald-200/60 hover:text-white"
              }`}
              style={isActive ? { color: MODE_ACCENT[mode] } : undefined}
            >
              <span>{mode}</span>
              <span className="text-[9px] font-bold opacity-70">
                {modeUnlocked}/{getBadgesByMode(mode).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress summary */}
      <div className="flex items-center justify-between bg-[#041a14]/70 border border-[#00ffc8]/20 rounded-2xl px-4 py-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: `${MODE_ACCENT[activeMode]}22`,
              borderColor: `${MODE_ACCENT[activeMode]}55`,
            }}
          >
            <Footprints
              className="w-4.5 h-4.5"
              style={{ color: MODE_ACCENT[activeMode] }}
            />
          </div>
          <div>
            <div className="font-headline text-lg font-black text-white leading-none">
              {distance.toFixed(1)}{" "}
              <span className="text-xs font-medium text-emerald-200/70">km</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wider">
              {activeMode} total
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-headline text-lg font-black text-[#00ffc8] leading-none">
            {unlockedCount}
            <span className="text-xs font-medium text-emerald-200/60">
              /{badges.length}
            </span>
          </div>
          <div className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wider">
            Unlocked
          </div>
        </div>
      </div>

      {nextBadge && (
        <div className="text-center text-[11px] text-emerald-200/70 mb-6 font-medium">
          Next up: <span className="text-white font-bold">{nextBadge.name}</span>{" "}
          — {(nextBadge.thresholdKm - distance).toFixed(1)} km to go
        </div>
      )}

      {/* Winding roadmap of medallions */}
      <div className="relative py-2">
        {/* Central spine */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#00ffc8]/40 via-white/10 to-transparent" />

        <div className="space-y-5 relative">
          {badges.map((badge, i) => {
            const unlocked = distance >= badge.thresholdKm;
            const leftSide = i % 2 === 0;
            const label = (
              <div
                className={`min-w-0 ${leftSide ? "text-right pr-3 md:pr-5" : "text-left pl-3 md:pl-5"}`}
              >
                <div
                  className={`font-headline text-xs font-black uppercase tracking-wide truncate ${
                    unlocked ? "text-white" : "text-emerald-200/45"
                  }`}
                >
                  {badge.name}
                </div>
                <div
                  className={`text-[10px] font-bold mt-0.5 truncate ${
                    unlocked ? "text-[#00ffc8]" : "text-emerald-200/40"
                  }`}
                >
                  {unlocked ? badge.flavor : `${badge.thresholdKm} km`}
                </div>
                <span
                  className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    color: TIER_ACCENT[badge.tier],
                    backgroundColor: `${TIER_ACCENT[badge.tier]}1a`,
                  }}
                >
                  {badge.tier}
                </span>
              </div>
            );

            return (
              <div
                key={badge.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-1"
              >
                {leftSide ? label : <div />}
                <div className="flex justify-center relative z-10">
                  <Medallion badge={badge} unlocked={unlocked} />
                </div>
                {leftSide ? <div /> : label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
