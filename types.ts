export interface Route {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationGainM: number;
  estimatedTimeMin: number;
  rating: number;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  review: string;
  reviewTime: string;
  category: "Walking" | "Jogging" | "Sprinting";
  lat: number; // For visualization
  lng: number; // For visualization
}

export interface ActivityLog {
  id: string;
  date: string;
  type: string;
  distanceKm: number;
  steps: number;
  calories: number;
  durationMin: number;
  paceMinPerKm: string;
  heartRateBpm: number;
  notes?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  type: "streak" | "silver" | "gold";
}

export interface AIPersonalPlan {
  title: string;
  motivationalQuote: string;
  mindfulnessTip: string;
  warmupMinutes: number;
  cooldownMinutes: number;
  estimatedCalories: number;
  mainWorkout: string[];
  intervalPacing: {
    stage: string;
    pace: string;
    intensity: string;
  }[];
}
