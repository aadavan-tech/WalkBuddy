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
  lat: number; // relative grid percentage or map pos
  lng: number; // relative grid percentage or map pos
}

export interface ActivityLog {
  id: string;
  date: string;
  type: string;
  distanceKm: number;
  /** Cumulative climb for the session, in metres (from GPS altitude). */
  elevationGainM?: number;
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

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  avatar: string;
  weightKg: string;
  dailyStepsGoal: string;
}

export interface UserPing {
  id: string;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  category: "Walking" | "Jogging" | "Sprinting";
  authorName: string;
  authorAvatar: string;
  note: string;
  timeSlot: string;
  maxJoiners: number;
  currentJoiners: number;
  joinedUserNames: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "buddy";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  attachment?: {
    type: "trail" | "location";
    title: string;
    subtext?: string;
  };
}

export interface ChatThread {
  id: string;
  buddyName: string;
  buddyAvatar: string;
  status: string;
  distanceStr: string;
  meetupTrailName: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

// 20 Theme-aligned Nature & Outdoor Entity Profile Pictures
export const DEFAULT_AVATARS: { id: string; label: string; url: string; color: string }[] = [
  { id: "avatar-1", label: "Emerald Flora", url: "https://images.unsplash.com/photo-1511497584788-8767610419ea?auto=format&fit=crop&w=300&q=80", color: "#00ffc8" },
  { id: "avatar-2", label: "Forest Deer", url: "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=300&q=80", color: "#00e5ff" },
  { id: "avatar-3", label: "Mystic Owl", url: "https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?auto=format&fit=crop&w=300&q=80", color: "#adff2f" },
  { id: "avatar-4", label: "Wild Red Fox", url: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=300&q=80", color: "#ffaa00" },
  { id: "avatar-5", label: "Timber Wolf", url: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?auto=format&fit=crop&w=300&q=80", color: "#ff007f" },
  { id: "avatar-6", label: "Moss Fern Canopy", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80", color: "#00e5ff" },
  { id: "avatar-7", label: "Redwood Trail", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80", color: "#00ffc8" },
  { id: "avatar-8", label: "Misty Trail Path", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80", color: "#adff2f" },
  { id: "avatar-9", label: "Emerald Stream", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80", color: "#ffaa00" },
  { id: "avatar-10", label: "Mountain Stream", url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=300&q=80", color: "#a855f7" },
  { id: "avatar-11", label: "Pinecone & Moss", url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&q=80", color: "#ec4899" },
  { id: "avatar-12", label: "Dewy Emerald Leaf", url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80", color: "#06b6d4" },
  { id: "avatar-13", label: "Golden Autumn Glade", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80", color: "#10b981" },
  { id: "avatar-14", label: "Twilight Grove", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80", color: "#8b5cf6" },
  { id: "avatar-15", label: "Alpine Peak Horizon", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80", color: "#3b82f6" },
  { id: "avatar-16", label: "Wild Trail Bear", url: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=300&q=80", color: "#f59e0b" },
  { id: "avatar-17", label: "Wild Hummingbird", url: "https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=300&q=80", color: "#14b8a6" },
  { id: "avatar-18", label: "Lush Mossy Stone", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80", color: "#84cc16" },
  { id: "avatar-19", label: "Aurora Canopy", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=300&q=80", color: "#06b6d4" },
  { id: "avatar-20", label: "Twilight Woods", url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=300&q=80", color: "#00ffc8" },
];
