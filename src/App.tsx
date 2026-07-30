import React, { useState, useEffect, useMemo } from "react";
import { 
  Compass, 
  MapPin, 
  Flame, 
  Sparkles, 
  User, 
  Bell, 
  X, 
  Footprints,
  Trees,
  Check,
  Phone,
  Mail,
  Calendar,
  Smile,
  ShieldCheck,
  Plus,
  MessageCircle,
  LogOut,
  Loader2
} from "lucide-react";
import { Route, ActivityLog, AchievementBadge, UserPing, DEFAULT_AVATARS, ChatThread } from "./types";
import { ProfileRow, saveProfile } from "./lib/db";
import MapSection from "./components/MapSection";
import HubDashboard from "./components/HubDashboard";
import ScenicRoutes from "./components/ScenicRoutes";
import WeeklyProgress from "./components/WeeklyProgress";
import FirefliesCanvas from "./components/FirefliesCanvas";
import FogTransition from "./components/FogTransition";
import BuddyChatModal, { INITIAL_CHAT_THREADS } from "./components/BuddyChatModal";

// Seed Bengaluru city routes with real geographical coordinates (lat/lng)
const initialRoutes: Route[] = [
  {
    id: "route-1",
    name: "Cubbon Park Bamboo Grove Circuit",
    location: "Cubbon Park, Bengaluru",
    distanceKm: 4.8,
    elevationGainM: 40,
    estimatedTimeMin: 38,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1511497584788-8767610419ea?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Alex Chen",
      avatar: DEFAULT_AVATARS[0].url,
    },
    review: "Serene bamboo pathways and giant banyan canopy right in central Bangalore! Ideal for peaceful morning walks and social meetups.",
    reviewTime: "2 hours ago",
    category: "Walking",
    lat: 12.9763,
    lng: 77.5929,
  },
  {
    id: "route-2",
    name: "Lalbagh Botanical Glasshouse Loop",
    location: "Lalbagh, Bengaluru",
    distanceKm: 5.5,
    elevationGainM: 50,
    estimatedTimeMin: 42,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Chloe Watson",
      avatar: DEFAULT_AVATARS[1].url,
    },
    review: "Lush botanical gardens around the historic Glasshouse and lake. Fresh air, soft dirt running track, and active jogger community.",
    reviewTime: "Yesterday",
    category: "Jogging",
    lat: 12.9507,
    lng: 77.5848,
  },
  {
    id: "route-3",
    name: "Sankey Tank Perimeter Sprint Track",
    location: "Sadashivanagar, Bengaluru",
    distanceKm: 3.2,
    elevationGainM: 20,
    estimatedTimeMin: 18,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Bolt Master",
      avatar: DEFAULT_AVATARS[2].url,
    },
    review: "Scenic lakeside walkway with well-paved tracks. Perfect for high-intensity interval sprints and tempo drills.",
    reviewTime: "3 days ago",
    category: "Sprinting",
    lat: 13.0072,
    lng: 77.5707,
  },
  {
    id: "route-4",
    name: "Ulsoor Lake Promenade Trail",
    location: "Ulsoor, Bengaluru",
    distanceKm: 6.2,
    elevationGainM: 35,
    estimatedTimeMin: 50,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Ananya M.",
      avatar: DEFAULT_AVATARS[3].url,
    },
    review: "Beautiful morning breeze and island views along Ulsoor lake promenade. Highly recommend for active recovery power walks.",
    reviewTime: "4 days ago",
    category: "Walking",
    lat: 12.9830,
    lng: 77.6200,
  },
  {
    id: "route-5",
    name: "HSR Layout Sector 1 Park Trail",
    location: "HSR Layout, Bengaluru",
    distanceKm: 7.0,
    elevationGainM: 45,
    estimatedTimeMin: 55,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Rohan V.",
      avatar: DEFAULT_AVATARS[4].url,
    },
    review: "Shaded green belt in HSR with smooth tree-lined footpaths and fitness enthusiast groups.",
    reviewTime: "5 days ago",
    category: "Jogging",
    lat: 12.9116,
    lng: 77.6389,
  }
];

const initialUserPings: UserPing[] = [
  {
    id: "ping-1",
    title: "Cubbon Park Evening Walk Meetup",
    locationName: "Cubbon Park Gate 2, Bengaluru",
    lat: 12.9750,
    lng: 77.5910,
    category: "Walking",
    authorName: "Priya Sharma",
    authorAvatar: DEFAULT_AVATARS[1].url,
    note: "Hey Bengaluru walk squad! Doing a relaxed 5K walk under the shade. Feel free to ping and join!",
    timeSlot: "Today @ 6:00 PM",
    maxJoiners: 8,
    currentJoiners: 3,
    joinedUserNames: ["Priya Sharma", "Rahul K.", "Karthik"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-2",
    title: "Lalbagh Sunrise Jogging Group",
    locationName: "Lalbagh Glasshouse Gate, Bengaluru",
    lat: 12.9480,
    lng: 77.5870,
    category: "Jogging",
    authorName: "Rohan Verma",
    authorAvatar: DEFAULT_AVATARS[2].url,
    note: "Targeting pace 6:15 min/km around the lake loop. Let's conquer the morning together!",
    timeSlot: "Tomorrow @ 6:30 AM",
    maxJoiners: 10,
    currentJoiners: 5,
    joinedUserNames: ["Rohan Verma", "Ananya M.", "Divya", "Suresh", "Kiran"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-3",
    title: "Sankey Tank Morning Sprint Drills",
    locationName: "Sankey Tank Walkway, Sadashivanagar",
    lat: 13.0075,
    lng: 77.5710,
    category: "Sprinting",
    authorName: "Vikram Seth",
    authorAvatar: DEFAULT_AVATARS[4].url,
    note: "Looking for 2-3 sprint workout partners for 100m interval reps along the lake perimeter!",
    timeSlot: "Today @ 7:00 AM",
    maxJoiners: 5,
    currentJoiners: 2,
    joinedUserNames: ["Vikram Seth", "Arjun"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-4",
    title: "Indiranagar 100ft Rd Evening Power Walk",
    locationName: "100ft Road, Indiranagar, Bengaluru",
    lat: 12.9784,
    lng: 77.6408,
    category: "Walking",
    authorName: "Karthik R.",
    authorAvatar: DEFAULT_AVATARS[5].url,
    note: "Brisk post-work 4km walk around Indiranagar green avenues. Looking for a friendly walking buddy!",
    timeSlot: "Today @ 7:30 PM",
    maxJoiners: 6,
    currentJoiners: 4,
    joinedUserNames: ["Karthik R.", "Sneha", "Manish", "Meera"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-5",
    title: "Ulsoor Lake Sunset Stroll",
    locationName: "Ulsoor Promenade, Bengaluru",
    lat: 12.9830,
    lng: 77.6200,
    category: "Walking",
    authorName: "Ananya S.",
    authorAvatar: DEFAULT_AVATARS[3].url,
    note: "Relaxed sunset walking session with cool lakeside breeze. Anyone around Ulsoor welcome to join!",
    timeSlot: "Today @ 5:45 PM",
    maxJoiners: 8,
    currentJoiners: 3,
    joinedUserNames: ["Ananya S.", "Pooja", "David"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-6",
    title: "Koramangala 4th Block Jogging Squad",
    locationName: "NGV Indoor Stadium Perimeter, Koramangala",
    lat: 12.9352,
    lng: 77.6245,
    category: "Jogging",
    authorName: "Divya M.",
    authorAvatar: DEFAULT_AVATARS[7].url,
    note: "Easy pace 5k run (6:45 min/km). Let's stay consistent and build endurance together!",
    timeSlot: "Tomorrow @ 6:00 AM",
    maxJoiners: 12,
    currentJoiners: 6,
    joinedUserNames: ["Divya M.", "Siddharth", "Aakash", "Tanya", "Rishi", "Aditi"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ping-7",
    title: "HSR Layout Sector 1 Tempo Run",
    locationName: "HSR Park Belt, Bengaluru",
    lat: 12.9116,
    lng: 77.6389,
    category: "Jogging",
    authorName: "Suresh Kumar",
    authorAvatar: DEFAULT_AVATARS[8].url,
    note: "6km continuous tempo jog around HSR sector parks. Great footpaths and zero traffic!",
    timeSlot: "Today @ 6:15 PM",
    maxJoiners: 8,
    currentJoiners: 4,
    joinedUserNames: ["Suresh Kumar", "Nitin", "Bhavna", "Gautam"],
    createdAt: new Date().toISOString(),
  }
];

// Achievement definitions. `unlocked` is derived from the user's logs at
// runtime (see deriveBadges) — logging activity unlocks them, not posting.
const BADGE_DEFS: (Omit<AchievementBadge, "unlocked"> & {
  requirement: (stats: { totalDistanceKm: number; sessionCount: number }) => boolean;
  requirementText: string;
})[] = [
  {
    id: "badge-1",
    title: "First Steps",
    description: "Log your first activity session",
    iconName: "local_fire_department",
    type: "streak",
    requirement: (s) => s.sessionCount >= 1,
    requirementText: "Log 1 session",
  },
  {
    id: "badge-2",
    title: "50 km Milestone",
    description: "Log 50 km of total distance",
    iconName: "military_tech",
    type: "silver",
    requirement: (s) => s.totalDistanceKm >= 50,
    requirementText: "Reach 50 km logged",
  },
  {
    id: "badge-3",
    title: "100 km Gold Champion",
    description: "Log 100 km of total distance",
    iconName: "workspace_premium",
    type: "gold",
    requirement: (s) => s.totalDistanceKm >= 100,
    requirementText: "Reach 100 km logged",
  },
];

// Recompute which badges are unlocked from the current logs.
function deriveBadges(logs: ActivityLog[]): AchievementBadge[] {
  const totalDistanceKm = logs.reduce((sum, l) => sum + (l.distanceKm || 0), 0);
  const sessionCount = logs.length;
  return BADGE_DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    iconName: def.iconName,
    type: def.type,
    unlocked: def.requirement({ totalDistanceKm, sessionCount }),
  }));
}

const initialLogs: ActivityLog[] = [
  {
    id: "log-1",
    date: "2026-07-21",
    type: "Walking",
    distanceKm: 6.4,
    steps: 8200,
    durationMin: 52,
    paceMinPerKm: "8:07",
    notes: "Evening outdoor walk along Cubbon Park trail.",
  },
  {
    id: "log-2",
    date: "2026-07-19",
    type: "Jogging",
    distanceKm: 9.2,
    steps: 13100,
    durationMin: 58,
    paceMinPerKm: "6:18",
    notes: "Pushed interval pacing along Lalbagh Glasshouse loop.",
  }
];

interface AppProps {
  /** Supabase profile row, supplied by AuthGate once onboarding is complete. */
  profile?: ProfileRow;
  onSignOut?: () => void | Promise<void>;
}

export default function App({ profile, onSignOut }: AppProps = {}) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "feed" | "analytics">("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<"Walking" | "Jogging" | "Sprinting">("Walking");

  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem("walkbuddy_routes");
    return saved ? JSON.parse(saved) : initialRoutes;
  });

  const [userPings, setUserPings] = useState<UserPing[]>(() => {
    const saved = localStorage.getItem("walkbuddy_pings");
    return saved ? JSON.parse(saved) : initialUserPings;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("walkbuddy_logs");
    return saved ? JSON.parse(saved) : initialLogs;
  });

  // Achievements are derived from logs — logging unlocks them, not posting.
  const badges = useMemo(() => deriveBadges(logs), [logs]);

  // Modals
  const [showPostRouteForm, setShowPostRouteForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Buddy DMs WhatsApp Chat Threads State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem("walkbuddy_chat_threads");
    return saved ? JSON.parse(saved) : INITIAL_CHAT_THREADS;
  });

  useEffect(() => {
    localStorage.setItem("walkbuddy_chat_threads", JSON.stringify(chatThreads));
  }, [chatThreads]);

  const totalUnreadDMs = chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  // Active session state
  const [activeSession, setActiveSession] = useState<{
    route: Route | null;
    elapsedSeconds: number;
    steps: number;
    paused: boolean;
  } | null>(null);

  // User profile state — seeded from the Supabase profile row when signed in,
  // falling back to the local cache for standalone/offline rendering.
  const [userName, setUserName] = useState(() => profile?.full_name || localStorage.getItem("walkbuddy_name") || "Alex Chen");
  const [userAge, setUserAge] = useState(() => (profile?.age != null ? String(profile.age) : localStorage.getItem("walkbuddy_age") || "26"));
  const [userGender, setUserGender] = useState(() => profile?.gender || localStorage.getItem("walkbuddy_gender") || "Non-binary");
  const [userEmail, setUserEmail] = useState(() => profile?.email || localStorage.getItem("walkbuddy_email") || "alex.chen@walkbuddy.io");
  const [userPhone, setUserPhone] = useState(() => profile?.phone || localStorage.getItem("walkbuddy_phone") || "+1 (555) 234-5678");
  const [userAvatar, setUserAvatar] = useState(() => profile?.avatar_url || localStorage.getItem("walkbuddy_avatar") || DEFAULT_AVATARS[0].url);
  const [userWeight, setUserWeight] = useState(() => (profile?.weight_kg != null ? String(profile.weight_kg) : localStorage.getItem("walkbuddy_weight") || "68"));
  const [dailyStepsGoal, setDailyStepsGoal] = useState(() =>
    profile?.daily_steps_goal != null
      ? profile.daily_steps_goal.toLocaleString()
      : localStorage.getItem("walkbuddy_goal") || "10,000"
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Chloe Watson upvoted your Cubbon Park Trail!", read: false, time: "2m ago" },
    { id: 2, text: "New Bangalore meetup pinged near Lalbagh Glasshouse", read: false, time: "1h ago" },
    { id: 3, text: "You unlocked the 50 km Milestone badge!", read: true, time: "1d ago" },
  ]);

  useEffect(() => {
    localStorage.setItem("walkbuddy_routes", JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem("walkbuddy_pings", JSON.stringify(userPings));
  }, [userPings]);

  useEffect(() => {
    localStorage.setItem("walkbuddy_logs", JSON.stringify(logs));
  }, [logs]);

  const handleAddUserPing = (newPingData: Omit<UserPing, "id" | "createdAt" | "joinedUserNames" | "currentJoiners">) => {
    const newPing: UserPing = {
      ...newPingData,
      id: `ping-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentJoiners: 1,
      joinedUserNames: [newPingData.authorName || userName],
    };
    setUserPings([newPing, ...userPings]);
  };

  const handleJoinPing = (pingId: string) => {
    setUserPings((prev) =>
      prev.map((p) => {
        if (p.id === pingId && !p.joinedUserNames.includes(userName)) {
          return {
            ...p,
            currentJoiners: p.currentJoiners + 1,
            joinedUserNames: [...p.joinedUserNames, userName],
          };
        }
        return p;
      })
    );
  };

  useEffect(() => {
    localStorage.setItem("walkbuddy_name", userName);
    localStorage.setItem("walkbuddy_age", userAge);
    localStorage.setItem("walkbuddy_gender", userGender);
    localStorage.setItem("walkbuddy_email", userEmail);
    localStorage.setItem("walkbuddy_phone", userPhone);
    localStorage.setItem("walkbuddy_avatar", userAvatar);
    localStorage.setItem("walkbuddy_weight", userWeight);
    localStorage.setItem("walkbuddy_goal", dailyStepsGoal);
  }, [userName, userAge, userGender, userEmail, userPhone, userAvatar, userWeight, dailyStepsGoal]);

  /**
   * Persists the profile drawer edits back to the Supabase `profiles` table.
   * Falls back to the local cache (already written by the effect above) when
   * the app is rendered without a signed-in profile.
   */
  const handleSaveProfileChanges = async () => {
    if (!profile) {
      setShowProfileDrawer(false);
      return;
    }

    setSavingProfile(true);
    setProfileSaveError(null);
    try {
      const parsedAge = parseInt(userAge, 10);
      const parsedWeight = parseFloat(userWeight);
      const parsedGoal = parseInt(dailyStepsGoal.replace(/[^0-9]/g, ""), 10);

      await saveProfile(profile.id, {
        full_name: userName.trim(),
        age: Number.isFinite(parsedAge) ? parsedAge : null,
        gender: userGender,
        email: userEmail.trim() || null,
        phone: userPhone.trim() || null,
        avatar_url: userAvatar,
        weight_kg: Number.isFinite(parsedWeight) ? parsedWeight : null,
        daily_steps_goal: Number.isFinite(parsedGoal) ? parsedGoal : null,
      });

      setShowProfileDrawer(false);
    } catch (err: any) {
      setProfileSaveError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle active session seconds tick simulator
  useEffect(() => {
    let interval: any = null;
    if (activeSession && !activeSession.paused) {
      interval = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const newElapsed = prev.elapsedSeconds + 1;
          const addedSteps = Math.floor(Math.random() * 2) + 2; // ~2-3 steps per sec
          return {
            ...prev,
            elapsedSeconds: newElapsed,
            steps: prev.steps + addedSteps,
          };
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartRouteSession = (route: Route) => {
    setActiveSession({
      route,
      elapsedSeconds: 0,
      steps: 0,
      paused: false,
    });
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const durationMins = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
    const distKm = parseFloat(((activeSession.steps * 0.00075) || 1.2).toFixed(2));

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: activeSession.route?.category || "Walking",
      distanceKm: distKm,
      steps: activeSession.steps,
      durationMin: durationMins,
      paceMinPerKm: `${Math.floor(durationMins / (distKm || 1))}:${(
        (durationMins % (distKm || 1)) *
        60
      )
        .toFixed(0)
        .padStart(2, "0")}`,
      notes: activeSession.route
        ? `Completed scenic route: ${activeSession.route.name}`
        : "Completed a free walk session",
    };

    setLogs([newLog, ...logs]);
    setActiveSession(null);
    alert(`🎉 Activity Session Logged!\nDistance: ${distKm} km\nSteps: ${activeSession.steps}`);
  };

  const handleAddLog = (newLogData: Omit<ActivityLog, "id" | "date">) => {
    const log: ActivityLog = {
      ...newLogData,
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };
    setLogs([log, ...logs]);
  };

  const handlePostRoute = (newRouteData: Omit<Route, "id">) => {
    const newRoute: Route = {
      ...newRouteData,
      id: `route-${Date.now()}`,
      lat: Math.floor(Math.random() * 50) + 25,
      lng: Math.floor(Math.random() * 50) + 25,
    };
    setRoutes([newRoute, ...routes]);
  };

  return (
    <div className="min-h-screen bg-[#020b08] text-white flex flex-col relative font-sans overflow-x-hidden">
      {/* Background Bioluminescent Fireflies Animation */}
      <FirefliesCanvas density="swarm" />

      {/* Global Header */}
      <header className="sticky top-0 z-[100] bg-[#04120e]/90 backdrop-blur-2xl border-b border-[#00ffc8]/20 px-4 md:px-10 py-3.5 flex justify-between items-center shadow-lg">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("dashboard")}
            className="font-headline text-[22px] md:text-[28px] font-black bioluminescent-text italic tracking-tighter cursor-pointer hover:opacity-85 active:scale-95 transition-all flex items-center gap-2"
          >
            <Trees className="w-6 h-6 text-[#00ffc8]" />
            <span>WalkBuddy</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "dashboard"
                  ? "text-[#00ffc8] border-b-2 border-[#00ffc8]"
                  : "text-emerald-100/70 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "feed"
                  ? "text-[#00ffc8] border-b-2 border-[#00ffc8]"
                  : "text-emerald-100/70 hover:text-white"
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "analytics"
                  ? "text-[#00ffc8] border-b-2 border-[#00ffc8]"
                  : "text-emerald-100/70 hover:text-white"
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Right Header Tools */}
        <div className="flex items-center gap-2.5">
          {/* Buddy Chat DMs Button */}
          <button
            onClick={() => setShowChatModal(!showChatModal)}
            className="relative text-emerald-100 hover:text-[#00ffc8] transition-all h-10 px-2.5 rounded-xl bg-[#041d16] hover:bg-[#062c21] active:scale-95 border border-[#00ffc8]/30 shadow-[0_0_12px_rgba(0,255,200,0.2)] flex items-center justify-center gap-2 group"
            title="Buddy Direct Messages"
          >
            <MessageCircle className="w-5 h-5 text-[#00ffc8] group-hover:scale-110 transition-transform stroke-[2.2]" />
            {totalUnreadDMs > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#00ffc8] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#020b08] shadow-[0_0_8px_rgba(0,255,200,0.8)]">
                {totalUnreadDMs}
              </span>
            )}
          </button>

          {/* Notifications Inbox Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-emerald-100 hover:text-[#00ffc8] transition-all h-10 px-2.5 rounded-xl bg-[#041d16] hover:bg-[#062c21] active:scale-95 border border-[#00ffc8]/30 shadow-[0_0_12px_rgba(0,255,200,0.2)] flex items-center justify-center gap-2 group"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-[#00ffc8] group-hover:scale-110 transition-transform stroke-[2.2]" />
            {notifications.some((n) => !n.read) && (
              <span className="absolute -top-1 -right-1 bg-[#00ffc8] text-black text-[9px] font-black w-2.5 h-2.5 rounded-full border border-[#020b08] shadow-[0_0_8px_rgba(0,255,200,0.8)]" />
            )}
          </button>

          {/* User Profile Avatar & Button */}
          <button
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            className="text-emerald-100 hover:text-[#00ffc8] transition-all h-10 px-2.5 rounded-xl bg-[#041d16] hover:bg-[#062c21] active:scale-95 border border-[#00ffc8]/30 shadow-[0_0_12px_rgba(0,255,200,0.2)] flex items-center gap-2 group"
            title="User Profile"
          >
            <img
              src={userAvatar}
              alt={userName}
              className="w-6 h-6 rounded-full object-cover border border-[#00ffc8] group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="text-xs font-extrabold text-white hidden sm:inline truncate max-w-28">
              {userName}
            </span>
          </button>
        </div>
      </header>

      {/* Notifications Inbox Drawer */}
      {showNotifications && (
        <div className="fixed top-18 right-4 z-[999] w-80 glass-panel-glow p-4 rounded-2xl shadow-2xl bg-[#041a14]/95 border-[#00ffc8]/30 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#00ffc8]">
              Notifications Inbox
            </span>
            <button
              onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              className="text-[10px] text-emerald-200/60 hover:text-white underline font-bold"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-xl text-xs leading-relaxed border transition-colors ${
                  n.read
                    ? "bg-white/0 border-white/5 text-emerald-200/60"
                    : "bg-[#00ffc8]/10 border-[#00ffc8]/30 text-white font-semibold"
                }`}
              >
                <p>{n.text}</p>
                <span className="text-[9px] text-emerald-300/50 block mt-1">{n.time}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowNotifications(false)}
            className="w-full mt-3 text-center text-xs text-emerald-200/70 py-1 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile & Biometrics Drawer (Includes 20 Forest Entity Theme Avatars) */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-[#04120e] border-l border-[#00ffc8]/30 p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00ffc8]" />
                  <h3 className="font-headline text-base font-extrabold uppercase tracking-wider text-white">
                    User Profile
                  </h3>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 rounded-xl bg-white/5 text-emerald-200/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Selected Avatar Preview Header */}
              <div className="flex items-center gap-4 bg-[#06241b] p-4 rounded-2xl border border-[#00ffc8]/30 shadow-lg">
                <div className="relative shrink-0">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#00ffc8] shadow-[0_0_20px_rgba(0,255,200,0.4)]"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#00ffc8] p-1 rounded-full text-black">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-headline text-lg font-black text-white truncate">
                    {userName || "WalkBuddy User"}
                  </h4>
                  <p className="text-xs text-emerald-200/70 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#00ffc8]" />
                    <span>{userEmail || "user@walkbuddy.io"}</span>
                  </p>
                  <span className="inline-block mt-1 bg-[#00ffc8]/15 border border-[#00ffc8]/30 text-[#00ffc8] text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    {userGender} • {userAge} yrs
                  </span>
                </div>
              </div>

              {/* 20 Theme Avatars Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] text-[#00ffc8] uppercase font-black tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#00ffc8]" />
                    <span>Choose Profile Avatar (20)</span>
                  </label>
                  <span className="text-[10px] text-emerald-200/60 font-bold">Nature Avatars</span>
                </div>

                <div className="grid grid-cols-5 gap-2.5 bg-[#020b08] p-3 rounded-2xl border border-white/10 max-h-52 overflow-y-auto custom-scrollbar">
                  {DEFAULT_AVATARS.map((avatar) => {
                    const isSelected = userAvatar === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setUserAvatar(avatar.url)}
                        title={avatar.label}
                        className={`relative rounded-full aspect-square overflow-hidden transition-all duration-200 group ${
                          isSelected
                            ? "ring-2 ring-[#00ffc8] ring-offset-2 ring-offset-[#04120e] scale-105 shadow-[0_0_12px_#00ffc8]"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#00ffc8]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-black stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Information Input Fields */}
              <div className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#00ffc8]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors"
                  />
                </div>

                {/* Age & Gender Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#00ffc8]" />
                      <span>Age</span>
                    </label>
                    <input
                      type="number"
                      value={userAge}
                      onChange={(e) => setUserAge(e.target.value)}
                      placeholder="e.g. 26"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#00ffc8]" />
                      <span>Gender</span>
                    </label>
                    <select
                      value={userGender}
                      onChange={(e) => setUserGender(e.target.value)}
                      className="w-full bg-[#041812] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#00ffc8]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#00ffc8]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors"
                  />
                </div>

                {/* Body Weight & Daily Steps Goal */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={userWeight}
                      onChange={(e) => setUserWeight(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                      Daily Step Goal
                    </label>
                    <input
                      type="text"
                      value={dailyStepsGoal}
                      onChange={(e) => setDailyStepsGoal(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {profileSaveError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/35 text-red-200 text-[11px] font-semibold leading-relaxed">
                  {profileSaveError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveProfileChanges}
                disabled={savingProfile}
                className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-[0_4px_25px_rgba(0,255,200,0.4)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{savingProfile ? "Saving…" : "Save Profile Changes"}</span>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => onSignOut()}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container with Fog Transitions */}
      <main className="flex-1 w-full pt-0 pb-24 z-20">
        <FogTransition currentTab={activeTab}>
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <MapSection
                routes={routes}
                userPings={userPings}
                selectedCategory={selectedCategory}
                onCategoryChange={(cat) => setSelectedCategory(cat)}
                onSelectRoute={handleStartRouteSession}
                onAddRouteClick={() => {
                  setActiveTab("feed");
                  setShowPostRouteForm(true);
                }}
                onAddUserPing={handleAddUserPing}
                onJoinPing={handleJoinPing}
                currentUserName={userName}
                currentUserAvatar={userAvatar}
              />

              <div className="px-4 md:px-10 max-w-5xl mx-auto pt-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                    <Compass className="w-6 h-6 text-[#00ffc8]" />
                    <span>Your Dashboard</span>
                  </h2>
                </div>

                <HubDashboard
                  logs={logs}
                  onAddLog={handleAddLog}
                />
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="px-4 md:px-10 pt-6">
              <ScenicRoutes
                routes={routes}
                onSelectRoute={handleStartRouteSession}
                onPostRoute={handlePostRoute}
                showPostForm={showPostRouteForm}
                onClosePostForm={() => setShowPostRouteForm(false)}
                onOpenPostForm={() => setShowPostRouteForm(true)}
              />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="px-4 md:px-10 pt-6">
              <WeeklyProgress
                badges={badges}
                logs={logs}
                onStartSuggestedSession={() => {
                  const jogRoute = routes.find((r) => r.category === "Jogging") || routes[0];
                  handleStartRouteSession(jogRoute);
                }}
              />
            </div>
          )}
        </FogTransition>
      </main>

      {/* Active Workout HUD Overlay */}
      {activeSession && (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-2xl p-6 flex flex-col justify-between items-center border border-[#00ffc8]/30">
          <div className="w-full max-w-md flex justify-between items-center border-b border-[#00ffc8]/20 pb-4">
            <div>
              <span className="text-[10px] text-[#00ffc8] font-black uppercase tracking-widest block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00ffc8]" />
                <span>{activeSession.paused ? "Session Paused" : "Active Session Tracking"}</span>
              </span>
              <h4 className="font-headline text-lg font-black text-white uppercase italic truncate max-w-xs">
                {activeSession.route?.name || "Free Walk Session"}
              </h4>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Abandon current walk session? Current steps will not be logged.")) {
                  setActiveSession(null);
                }
              }}
              className="text-emerald-200/60 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-8 my-auto w-full max-w-md">
            <div>
              <div className="text-[10px] text-emerald-200/70 uppercase tracking-widest font-black mb-1">
                Active Workout Duration
              </div>
              <div className="font-headline text-5xl md:text-6xl font-black text-[#00ffc8] italic tracking-tight font-mono drop-shadow-[0_0_20px_rgba(0,255,200,0.5)]">
                {Math.floor(activeSession.elapsedSeconds / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(activeSession.elapsedSeconds % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="bg-[#041a14]/90 p-6 rounded-2xl border border-[#00ffc8]/30 shadow-2xl">
              <div className="space-y-1">
                <div className="text-[10px] text-emerald-200/80 uppercase font-black flex items-center justify-center gap-1">
                  <Footprints className="w-4 h-4 text-[#00ffc8]" />
                  <span>Steps Taken</span>
                </div>
                <div className="font-headline text-4xl font-black text-white">
                  {activeSession.steps.toLocaleString()}
                </div>
              </div>
            </div>

            {activeSession.route && (
              <div className="p-4 rounded-xl bg-[#00ffc8]/10 border border-[#00ffc8]/30 text-xs text-[#00ffc8] font-bold flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Navigating {activeSession.route.location}</span>
              </div>
            )}
          </div>

          <div className="w-full max-w-md space-y-3 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveSession((prev) => (prev ? { ...prev, paused: !prev.paused } : null))
                }
                className={`py-3.5 rounded-xl font-headline font-black text-xs uppercase tracking-wider transition-all ${
                  activeSession.paused
                    ? "bg-[#00e5ff] text-black"
                    : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                }`}
              >
                {activeSession.paused ? "Resume Track" : "Pause Session"}
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="py-3.5 bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_25px_rgba(0,255,200,0.4)]"
              >
                Finish &amp; Log Walk
              </button>
            </div>
            <div className="text-center text-[10px] text-emerald-200/60 font-medium">
              *Session metrics automatically added to your activity goals
            </div>
          </div>
        </div>
      )}

      {/* Floating Plus Button (Desktop Feed Only) */}
      {activeTab === "feed" && (
        <button
          onClick={() => {
            setActiveTab("feed");
            setShowPostRouteForm(true);
          }}
          className="hidden md:flex fixed bottom-6 right-8 z-[80] w-14 h-14 bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black rounded-full shadow-[0_0_30px_rgba(0,255,200,0.5)] items-center justify-center active:scale-90 transition-all group"
        >
          <Plus className="w-7 h-7 transition-transform group-hover:rotate-90" />
        </button>
      )}

      {/* WhatsApp Buddy Direct Messages Modal */}
      <BuddyChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        chatThreads={chatThreads}
        onUpdateThreads={setChatThreads}
      />

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-[100] bg-[#04120e]/95 backdrop-blur-2xl rounded-t-2xl shadow-[0px_-10px_30px_rgba(0,0,0,0.8)] flex justify-around items-center px-4 py-3 md:hidden border-t border-[#00ffc8]/20">
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "dashboard"
              ? "text-[#00ffc8] font-black bg-[#00ffc8]/10"
              : "text-emerald-200/60"
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("feed");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "feed"
              ? "text-[#00ffc8] font-black bg-[#00ffc8]/10"
              : "text-emerald-200/60"
          }`}
        >
          <MapPin className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Feed</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("analytics");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "analytics"
              ? "text-[#00ffc8] font-black bg-[#00ffc8]/10"
              : "text-emerald-200/60"
          }`}
        >
          <Flame className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Analytics</span>
        </button>
      </nav>
    </div>
  );
}
