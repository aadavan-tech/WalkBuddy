import React, { useState } from "react";
import { Trophy, Lock, Footprints } from "lucide-react";
import {
  ACTIVITY_MODES,
  getBadgesByMode,
  type ActivityMode,
  type BadgeDefinition,
} from "../data/badges";

interface AchievementsRoadmapProps {
  /** Cumulative distance (km) per mode, used to decide which badges are unlocked. */
  distancesByMode: Record<ActivityMode, number>;
}

/** Vertical pitch between two badge nodes, in px. Drives the SVG bridges. */
const ROW_H = 112;
/** Half the medallion size — used to centre nodes on the path coordinate. */
const HALF_NODE = 36;

function Medallion({
  badge,
  unlocked,
}: {
  badge: BadgeDefinition;
  unlocked: boolean;
}) {
  return (
    <div
      className={`medallion w-[72px] h-[72px] ${unlocked ? "" : "medallion-locked"}`}
      title={unlocked ? badge.flavor : badge.requirement}
    >
      {/* The emoji ALWAYS renders. Locked badges are dimmed by CSS instead of
          being replaced, so a medallion never reads as empty/missing. */}
      <span className="medallion-emoji">{badge.emoji}</span>
      {!unlocked && (
        <span className="medallion-lock" aria-hidden="true">
          <Lock className="w-3.5 h-3.5" />
        </span>
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

  // Winding path: nodes alternate either side of centre, as a % of track width.
  const nodeX = (i: number) => (i % 2 === 0 ? 26 : 74);
  const trackHeight = badges.length * ROW_H;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5">
        <div>
          <h2 className="font-headline text-xl font-extrabold text-black tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-black" />
            <span>Achievements Roadmap</span>
          </h2>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
            Unlock milestones as you cover more distance
          </p>
        </div>
      </div>

      {/* Mode Tabs — underline text, not a segmented pill control */}
      <div className="flex gap-7 mb-6 border-b border-black/20">
        {ACTIVITY_MODES.map((mode) => {
          const isActive = activeMode === mode;
          const modeUnlocked = getBadgesByMode(mode).filter(
            (b) => (distancesByMode[mode] || 0) >= b.thresholdKm
          ).length;
          return (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex items-baseline gap-1.5 pb-2 -mb-px border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
                isActive ? "text-black border-black" : "text-gray-400 border-transparent hover:text-gray-700"
              }`}
            >
              <span>{mode}</span>
              <span className="text-[10px] font-bold opacity-70">
                {modeUnlocked}/{getBadgesByMode(mode).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress summary — plain stats, no boxed panel */}
      <div className="flex items-center justify-between pb-6 mb-2 border-b border-black/15">
        <div className="flex items-center gap-2.5">
          <Footprints className="w-4.5 h-4.5 text-black" />
          <div>
            <div className="font-headline text-lg font-black text-black leading-none">
              {distance.toFixed(1)}{" "}
              <span className="text-xs font-medium text-gray-500">km</span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {activeMode} total
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-headline text-lg font-black text-black leading-none">
            {unlockedCount}
            <span className="text-xs font-medium text-gray-500">
              /{badges.length}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Unlocked
          </div>
        </div>
      </div>

      {nextBadge && (
        <div className="text-center text-[11px] text-gray-500 mb-6 font-medium">
          Next up: <span className="text-black font-bold">{nextBadge.name}</span>{" "}
          — {(nextBadge.thresholdKm - distance).toFixed(1)} km to go
        </div>
      )}

      {/* Winding roadmap — curved bridges connect each medallion */}
      <div className="roadmap-track relative w-full" data-mode={activeMode} style={{ height: trackHeight }}>
        {/* Bridge layer: S-curves between consecutive nodes. */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 100 ${trackHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {badges.slice(0, -1).map((badge, i) => {
            const x1 = nodeX(i);
            const y1 = i * ROW_H + ROW_H / 2;
            const x2 = nodeX(i + 1);
            const y2 = (i + 1) * ROW_H + ROW_H / 2;
            // Control points pull vertically out of each node so the link reads
            // as a swinging rope bridge rather than a straight diagonal.
            const d = `M ${x1} ${y1} C ${x1} ${y1 + ROW_H * 0.5}, ${x2} ${
              y2 - ROW_H * 0.5
            }, ${x2} ${y2}`;
            // A bridge counts as "walked" once the badge it leads into unlocks.
            const travelled = distance >= badges[i + 1].thresholdKm;
            return (
              <path
                key={badge.id}
                d={d}
                fill="none"
                stroke={travelled ? "var(--road-on)" : "var(--road-off)"}
                strokeWidth={travelled ? 3 : 2}
                strokeLinecap="round"
                strokeDasharray={travelled ? undefined : "5 6"}
                opacity={travelled ? 0.8 : 1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Node layer */}
        {badges.map((badge, i) => {
          const unlocked = distance >= badge.thresholdKm;
          const x = nodeX(i);
          const onLeft = x < 50;
          return (
            <div key={badge.id}>
              {/* Medallion, centred exactly on the path coordinate */}
              <div
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: i * ROW_H + ROW_H / 2,
                  transform: `translate(-${HALF_NODE}px, -${HALF_NODE}px)`,
                }}
              >
                <Medallion badge={badge} unlocked={unlocked} />
              </div>

              {/* Label, on the opposite side of the spine from the node */}
              <div
                className={`absolute flex flex-col justify-center ${
                  onLeft ? "items-start text-left" : "items-end text-right"
                }`}
                style={{
                  top: i * ROW_H,
                  height: ROW_H,
                  left: onLeft ? `calc(${x}% + ${HALF_NODE + 12}px)` : 0,
                  right: onLeft ? 0 : `calc(${100 - x}% + ${HALF_NODE + 12}px)`,
                }}
              >
                <div
                  className={`font-headline text-[15px] font-black uppercase tracking-wide truncate max-w-full ${
                    unlocked ? "text-black" : "text-gray-400"
                  }`}
                >
                  {badge.name}
                </div>
                <div
                  className={`text-[13px] font-bold mt-1 truncate max-w-full ${
                    unlocked ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {unlocked ? badge.flavor : `Locked · ${badge.thresholdKm} km`}
                </div>
                <span className="inline-block mt-1.5 text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/5 text-gray-600">
                  {badge.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
