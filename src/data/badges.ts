/**
 * Achievement badge catalog for WalkBuddy — presentational data only.
 *
 * Badges are grouped into two activity modes (Walking, Jogging),
 * each with 20 collectible milestones arranged as a progression "roadmap".
 * A badge unlocks once the user's cumulative distance in that mode crosses
 * `thresholdKm`, so the whole set doubles as a distance saga.
 *
 * Tier drives the medallion ring colour + glow intensity in the UI.
 */

export type BadgeTier = "common" | "rare" | "epic" | "legendary";
export type ActivityMode = "Walking" | "Jogging";

export interface BadgeDefinition {
  /** Stable id — never rename once shipped. */
  id: string;
  mode: ActivityMode;
  /** Display name on the medallion. */
  name: string;
  /** Short flavour line (shown when unlocked). */
  flavor: string;
  /** Requirement text (shown in the locked tooltip). */
  requirement: string;
  /** Emoji glyph rendered in the medallion core. */
  emoji: string;
  tier: BadgeTier;
  /** Cumulative km in this mode required to unlock. */
  thresholdKm: number;
}

/** Tier accent colours (kept readable in both light + dark themes). */
export const TIER_ACCENT: Record<BadgeTier, string> = {
  common: "#4ade80",
  rare: "#22d3ee",
  epic: "#a855f7",
  legendary: "#f5c518",
};

/** Assign a tier from a badge's position in its 20-step roadmap. */
function tierFor(index: number): BadgeTier {
  if (index >= 16) return "legendary";
  if (index >= 11) return "epic";
  if (index >= 5) return "rare";
  return "common";
}

/**
 * Builds a 20-badge roadmap for a mode. Thresholds ramp up gently at first,
 * then steepen so the legendary tiers feel genuinely earned.
 */
function buildRoadmap(
  mode: ActivityMode,
  emojis: string[],
  entries: { name: string; flavor: string }[]
): BadgeDefinition[] {
  // Non-linear distance ramp across the 20 milestones (km).
  const thresholds = [
    1, 3, 5, 10, 15, 25, 40, 55, 75, 100, 130, 165, 205, 250, 300, 360, 430,
    510, 600, 750,
  ];
  const prefix = mode.slice(0, 4).toLowerCase();
  return entries.map((entry, i) => ({
    id: `${prefix}-${i + 1}`,
    mode,
    name: entry.name,
    flavor: entry.flavor,
    requirement: `Cover ${thresholds[i]} km total ${mode.toLowerCase()}.`,
    emoji: emojis[i],
    tier: tierFor(i),
    thresholdKm: thresholds[i],
  }));
}

const WALKING = buildRoadmap(
  "Walking",
  ["👟", "🌿", "🍃", "🌳", "🥾", "🗺️", "🌄", "🏞️", "🌲", "🧭", "🌅", "⛰️", "🏔️", "🌍", "🦉", "🌌", "🏅", "👑", "🌠", "🏆"],
  [
    { name: "First Steps", flavor: "Every journey begins with one step." },
    { name: "Fresh Air", flavor: "You've found your morning rhythm." },
    { name: "Leaf Wanderer", flavor: "Cruising the green paths." },
    { name: "Canopy Stroller", flavor: "Under the tree cover you go." },
    { name: "Trailbreaker", flavor: "The boots are broken in now." },
    { name: "Pathfinder", flavor: "You read trails like a map." },
    { name: "Dawn Walker", flavor: "The sunrise is your training partner." },
    { name: "Valley Roamer", flavor: "Miles roll under your feet." },
    { name: "Forest Guardian", flavor: "The woods know your footsteps." },
    { name: "True North", flavor: "100 km of steady wandering." },
    { name: "Golden Hour", flavor: "Consistency is your superpower." },
    { name: "Ridge Climber", flavor: "Elevation no longer scares you." },
    { name: "Summit Seeker", flavor: "The high paths call and you answer." },
    { name: "Globe Strider", flavor: "You'd have crossed a small country." },
    { name: "Night Owl", flavor: "Even dusk can't stop you." },
    { name: "Cosmic Rambler", flavor: "Walking into legend." },
    { name: "Trail Laureate", flavor: "Distance measured in devotion." },
    { name: "Walking Sovereign", flavor: "You rule the footpaths." },
    { name: "Shooting Star", flavor: "600 km and still gliding." },
    { name: "Grand Wanderer", flavor: "The ultimate walking legend." },
  ]
);

const JOGGING = buildRoadmap(
  "Jogging",
  ["🏃", "💨", "🌬️", "🫀", "⏱️", "🔥", "🌊", "🎯", "⚡", "🏵️", "🌀", "🚀", "🥇", "🦅", "🌟", "💫", "🏅", "👑", "🌠", "🏆"],
  [
    { name: "Jog Started", flavor: "The engine is warming up." },
    { name: "Easy Pace", flavor: "Breathing found its groove." },
    { name: "Wind Chaser", flavor: "The breeze can't keep up." },
    { name: "Heartbeat", flavor: "Cardio zone unlocked." },
    { name: "Tempo Rider", flavor: "You own your pace now." },
    { name: "Burn Runner", flavor: "Calories don't stand a chance." },
    { name: "Flow State", flavor: "Miles feel like minutes." },
    { name: "On Target", flavor: "Every split is dialed in." },
    { name: "Charged Up", flavor: "Endurance turned electric." },
    { name: "Century Jogger", flavor: "100 km of steady strides." },
    { name: "Vortex", flavor: "Momentum is a lifestyle." },
    { name: "Launch Speed", flavor: "You accelerate through walls." },
    { name: "Podium Pace", flavor: "Gold-medal consistency." },
    { name: "Skybound", flavor: "Light on your feet, high on air." },
    { name: "Starstruck", flavor: "Your logbook glows." },
    { name: "Comet Trail", flavor: "Leaving a streak behind you." },
    { name: "Jog Laureate", flavor: "A scholar of the run." },
    { name: "Jogging Sovereign", flavor: "The roads bow to you." },
    { name: "Meteor", flavor: "600 km of relentless motion." },
    { name: "Grand Strider", flavor: "The ultimate jogging legend." },
  ]
);

export const BADGE_CATALOG: BadgeDefinition[] = [
  ...WALKING,
  ...JOGGING,
];

export const ACTIVITY_MODES: ActivityMode[] = ["Walking", "Jogging"];

export function getBadgesByMode(mode: ActivityMode): BadgeDefinition[] {
  return BADGE_CATALOG.filter((b) => b.mode === mode);
}
