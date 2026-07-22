import React, { useState, useEffect } from "react";
import { 
  Compass, 
  MapPin, 
  Flame, 
  Sparkles, 
  Award, 
  Trophy, 
  User, 
  Bell, 
  Activity, 
  Navigation, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  Clock, 
  X, 
  Check, 
  FlameKindling,
  ChevronRight,
  Heart,
  Settings,
  Footprints
} from "lucide-react";
import { Route, ActivityLog, AchievementBadge, AIPersonalPlan } from "./types";
import MapSection from "./components/MapSection";
import HubDashboard from "./components/HubDashboard";
import ScenicRoutes from "./components/ScenicRoutes";
import WeeklyProgress from "./components/WeeklyProgress";
import AICoachModal from "./components/AICoachModal";

// Seed default scenic routes exactly matching the visual specs & image attachments
const initialRoutes: Route[] = [
  {
    id: "route-1",
    name: "Ridge Runner Peak",
    location: "Chamonix, FR",
    distanceKm: 12.4,
    elevationGainM: 840,
    estimatedTimeMin: 75,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    review: "Best sunset view! The technical descent was challenging but the golden hour light through the pines is worth every step.",
    reviewTime: "2 days ago",
    category: "Jogging",
    lat: 38, // Mapping to Manhattan relative grid left%
    lng: 42, // Mapping to relative top%
  },
  {
    id: "route-2",
    name: "Azure Coast Loop",
    location: "Nice, FR",
    distanceKm: 21.1,
    elevationGainM: 120,
    estimatedTimeMin: 102,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Chloe Watson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    review: "Stunning flat loop around the marina. High speed breeze and endless horizon lines. Highly recommend early mornings!",
    reviewTime: "4 days ago",
    category: "Jogging",
    lat: 78,
    lng: 22,
  },
  {
    id: "route-3",
    name: "Central Park Ramble",
    location: "Manhattan, NY",
    distanceKm: 4.8,
    elevationGainM: 45,
    estimatedTimeMin: 35,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1513829096960-ef4a3c4457ab?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Marcus Aurelius",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    review: "A beautiful green labyrinth with gorgeous stone arches. Perfect walking session with high shade density.",
    reviewTime: "Today",
    category: "Walking",
    lat: 32,
    lng: 41,
  },
  {
    id: "route-4",
    name: "East River Sprint Track",
    location: "Manhattan, NY",
    distanceKm: 2.5,
    elevationGainM: 5,
    estimatedTimeMin: 12,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
    author: {
      name: "Bolt Master",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    review: "Ultra flat asphalt path directly on the water. Ideal for visual pacing drills and intense power intervals.",
    reviewTime: "Yesterday",
    category: "Sprinting",
    lat: 49,
    lng: 52,
  }
];

// Seed default achievement badges
const initialBadges: AchievementBadge[] = [
  {
    id: "badge-1",
    title: "Streak Holder",
    description: "10-day active walk streak",
    iconName: "local_fire_department",
    unlocked: true,
    type: "streak",
  },
  {
    id: "badge-2",
    title: "50 km Silver",
    description: "Silver performance milestone",
    iconName: "military_tech",
    unlocked: true,
    type: "silver",
  },
  {
    id: "badge-3",
    title: "100 km Gold",
    description: "Legendary distance milestone",
    iconName: "workspace_premium",
    unlocked: true,
    type: "gold",
  },
];

// Default seeded past activity logs
const initialLogs: ActivityLog[] = [
  {
    id: "log-1",
    date: "2026-07-17",
    type: "Walking",
    distanceKm: 5.2,
    steps: 7150,
    calories: 290,
    durationMin: 45,
    paceMinPerKm: "8:39",
    heartRateBpm: 110,
    notes: "Easy evening active recovery session.",
  },
  {
    id: "log-2",
    date: "2026-07-15",
    type: "Jogging",
    distanceKm: 8.4,
    steps: 12482,
    calories: 642,
    durationMin: 55,
    paceMinPerKm: "6:32",
    heartRateBpm: 142,
    notes: "Pushed the pacing in the final 2 kilometers.",
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"hub" | "feed" | "activity">("hub");
  const [selectedCategory, setSelectedCategory] = useState<"Walking" | "Jogging" | "Sprinting">("Walking");
  
  // Data State
  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem("walkbuddy_routes");
    return saved ? JSON.parse(saved) : initialRoutes;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("walkbuddy_logs");
    return saved ? JSON.parse(saved) : initialLogs;
  });

  const [badges, setBadges] = useState<AchievementBadge[]>(initialBadges);

  // Modal Triggers
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [showPostRouteForm, setShowPostRouteForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Active workout simulation tracker state
  const [activeSession, setActiveSession] = useState<{
    route: Route | null;
    customPlan: AIPersonalPlan | null;
    elapsedSeconds: number;
    steps: number;
    calories: number;
    paused: boolean;
  } | null>(null);

  // Profile data
  const [userName, setUserName] = useState("Athletic Buddy");
  const [userWeight, setUserWeight] = useState("75");
  const [dailyStepsGoal, setDailyStepsGoal] = useState("10,000");

  // Notifications pool
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Alex Chen upvoted your posted Ridge Runner Peak path!", read: false, time: "2m ago" },
    { id: 2, text: "New scenic route posted in Manhattan: 'Hudson Esplanade'", read: false, time: "1h ago" },
    { id: 3, text: "AI Coach completed analysis on your recent pacing trends.", read: true, time: "1d ago" },
  ]);

  // Save state helpers
  useEffect(() => {
    localStorage.setItem("walkbuddy_routes", JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem("walkbuddy_logs", JSON.stringify(logs));
  }, [logs]);

  // Handle active session seconds tick simulator
  useEffect(() => {
    let interval: any = null;
    if (activeSession && !activeSession.paused) {
      interval = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const nextSeconds = prev.elapsedSeconds + 1;
          // Every second, simulate adding random steps & calories based on speed/pacing
          const isSprint = prev.route?.category === "Sprinting" || prev.customPlan?.title.includes("Sprint");
          const isWalk = prev.route?.category === "Walking";
          
          const stepsAdded = isSprint ? Math.floor(Math.random() * 4) + 2 : isWalk ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 3) + 1;
          const calsAdded = isSprint ? 0.35 : isWalk ? 0.08 : 0.22;

          return {
            ...prev,
            elapsedSeconds: nextSeconds,
            steps: prev.steps + stepsAdded,
            calories: Math.round((prev.calories + calsAdded) * 100) / 100,
          };
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleAddLog = (newLog: Omit<ActivityLog, "id" | "date">) => {
    const today = new Date().toISOString().split("T")[0];
    const logItem: ActivityLog = {
      ...newLog,
      id: `log-${Date.now()}`,
      date: today,
    };
    setLogs([logItem, ...logs]);
    
    // Toast notification feedback
    setNotifications([
      {
        id: Date.now(),
        text: `Logged a beautiful ${newLog.distanceKm}km workout session!`,
        read: false,
        time: "Just now"
      },
      ...notifications
    ]);
  };

  const handlePostRoute = (newRoute: Omit<Route, "id">) => {
    const routeItem: Route = {
      ...newRoute,
      id: `route-${Date.now()}`,
    };
    setRoutes([routeItem, ...routes]);

    setNotifications([
      {
        id: Date.now(),
        text: `Your scenic path '${newRoute.name}' was posted successfully!`,
        read: false,
        time: "Just now"
      },
      ...notifications
    ]);
  };

  const handleStartRouteSession = (route: Route) => {
    // Open running session overlay
    setActiveSession({
      route,
      customPlan: null,
      elapsedSeconds: 0,
      steps: 0,
      calories: 0,
      paused: false,
    });
  };

  const handleStartAIPermalPlan = (plan: AIPersonalPlan) => {
    setIsAICoachOpen(false);
    setActiveSession({
      route: null,
      customPlan: plan,
      elapsedSeconds: 0,
      steps: 0,
      calories: 0,
      paused: false,
    });
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    
    // Log the simulated metrics to the history log list
    const computedDistance = activeSession.route 
      ? activeSession.route.distanceKm 
      : parseFloat(((activeSession.elapsedSeconds * 0.0018)).toFixed(1)); // mock calculated distance

    const computedPace = activeSession.route
      ? "6:30"
      : "8:10";

    const computedType = activeSession.route
      ? activeSession.route.category
      : "Walking";

    handleAddLog({
      type: computedType,
      distanceKm: computedDistance,
      steps: activeSession.steps || 2500,
      calories: Math.round(activeSession.calories) || 120,
      durationMin: Math.max(1, Math.round(activeSession.elapsedSeconds / 60)),
      paceMinPerKm: computedPace,
      heartRateBpm: activeSession.route?.category === "Sprinting" ? 165 : 124,
      notes: activeSession.route 
        ? `Completed scenic exploration of ${activeSession.route.name}!` 
        : `Completed AI custom workout plan: "${activeSession.customPlan?.title}"`,
    });

    // Close session
    setActiveSession(null);
  };

  const handleToggleBadge = (badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, unlocked: !b.unlocked } : b))
    );
  };

  return (
    <div className="min-h-screen bg-[#101415] text-[#e0e3e5] font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Absolute Header Navigation panel */}
      <header className="fixed top-0 w-full z-[100] bg-[#101415]/85 backdrop-blur-xl border-b border-white/5 shadow-2xl flex justify-between items-center px-4 md:px-10 h-16">
        <div className="flex items-center gap-10">
          <div 
            onClick={() => setActiveTab("hub")}
            className="font-headline text-[24px] md:text-[30px] font-extrabold text-[#c3f400] italic tracking-tighter cursor-pointer hover:opacity-85 active:scale-95 transition-all"
          >
            WalkBuddy
          </div>
          <nav className="hidden md:flex gap-8">
            <button
              onClick={() => setActiveTab("hub")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "hub"
                  ? "text-[#c3f400] border-b-2 border-[#c3f400]"
                  : "text-[#c6c6ca] hover:text-white"
              }`}
            >
              Hub
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "feed"
                  ? "text-[#c3f400] border-b-2 border-[#c3f400]"
                  : "text-[#c6c6ca] hover:text-white"
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "activity"
                  ? "text-[#c3f400] border-b-2 border-[#c3f400]"
                  : "text-[#c6c6ca] hover:text-white"
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        {/* Top Right Header Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Drawer Toggle */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-[#c6c6ca] hover:text-[#c3f400] transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          {/* User profile drawer toggle */}
          <button
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            className="text-[#c6c6ca] hover:text-[#c3f400] transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 flex items-center gap-1"
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-bold text-white hidden sm:inline truncate max-w-24">
              {userName}
            </span>
          </button>
        </div>
      </header>

      {/* Floating Notifications Popover Box */}
      {showNotifications && (
        <div className="fixed top-18 right-4 z-[999] w-80 glass-panel p-4 rounded-xl shadow-2xl bg-[#121417] border-white/15 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#c3f400]">
              Notifications Inbox
            </span>
            <button
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              className="text-[10px] text-gray-400 hover:text-white underline font-bold"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg text-xs leading-relaxed border transition-colors ${
                  n.read 
                    ? "bg-white/0 border-white/5 text-gray-400" 
                    : "bg-[#c3f400]/5 border-[#c3f400]/20 text-white font-medium"
                }`}
              >
                <div>{n.text}</div>
                <div className="text-[9px] text-gray-500 mt-1">{n.time}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowNotifications(false)}
            className="w-full text-center bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-1.5 rounded-lg mt-3 block"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* User Profile / Metrics Customization Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-[#101415] border-l border-white/15 p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-base font-extrabold uppercase tracking-wider text-white">
                  My Biometrics
                </h3>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form entries */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">
                    Athletic Nickname
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={userWeight}
                    onChange={(e) => setUserWeight(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">
                    Daily Steps Goal
                  </label>
                  <input
                    type="text"
                    value={dailyStepsGoal}
                    onChange={(e) => setDailyStepsGoal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-[#c3f400]/10 to-[#3cddc7]/10 border border-white/5 text-xs text-slate-300 leading-relaxed space-y-1.5">
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Pacing Tier</p>
                <p>We use weight values to calculate hyper-precise metabolic equivalent ratings (METs) during active workouts.</p>
              </div>
            </div>

            <button
              onClick={() => setShowProfileDrawer(false)}
              className="w-full bg-[#c3f400] text-black font-headline font-black text-xs py-2.5 rounded-xl uppercase tracking-wider"
            >
              Save Biometrics
            </button>
          </div>
        </div>
      )}

      {/* Main Container Core Subview Router */}
      <main className="flex-1 w-full pt-16 pb-24">
        {/* Hub View Layout: Features map section + grid dashboard */}
        {activeTab === "hub" && (
          <div className="space-y-6">
            {/* Map Canvas Header Layer */}
            <MapSection
              routes={routes}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => setSelectedCategory(cat)}
              onSelectRoute={handleStartRouteSession}
              onAddRouteClick={() => {
                setActiveTab("feed");
                setShowPostRouteForm(true);
              }}
            />

            {/* Dashboard details container */}
            <div className="px-4 md:px-10 max-w-5xl mx-auto pt-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-2xl font-black text-white italic uppercase tracking-tight">
                  Your Hub
                </h2>
                <button
                  onClick={() => setIsAICoachOpen(true)}
                  className="bg-[#c3f400]/15 hover:bg-[#c3f400]/25 text-[#c3f400] font-bold text-xs px-3.5 py-1.5 rounded-full border border-[#c3f400]/30 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>AI Coaching Tips</span>
                </button>
              </div>

              <HubDashboard
                logs={logs}
                onAddLog={handleAddLog}
                onOpenAICoach={() => setIsAICoachOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Feed View Layout: Features Scenic Routes Cards */}
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

        {/* Activity View Layout: Features WeeklyProgress progress indicators */}
        {activeTab === "activity" && (
          <div className="px-4 md:px-10 pt-6">
            <WeeklyProgress
              badges={badges}
              onBadgeToggle={handleToggleBadge}
              onStartSuggestedSession={() => {
                // Find a route or open coach
                const jogRoute = routes.find(r => r.category === "Jogging") || routes[0];
                handleStartRouteSession(jogRoute);
              }}
            />
          </div>
        )}
      </main>

      {/* Interactive Active Running Session Overlay HUD */}
      {activeSession && (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl p-6 flex flex-col justify-between items-center">
          {/* Header */}
          <div className="w-full max-w-md flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] text-[#c3f400] font-black uppercase tracking-widest block">
                {activeSession.paused ? "Paused Session" : "Tracking Active GPS Session"}
              </span>
              <h4 className="font-headline text-lg font-black text-white uppercase italic truncate max-w-xs">
                {activeSession.route?.name || activeSession.customPlan?.title}
              </h4>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Abandon current walk session? Current steps will not be logged.")) {
                  setActiveSession(null);
                }
              }}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Epic HUD metrics visualizers */}
          <div className="text-center space-y-8 my-auto w-full max-w-md">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold mb-1">
                Active Workout Duration
              </div>
              <div className="font-headline text-5xl md:text-6xl font-black text-white italic tracking-tight font-mono">
                {Math.floor(activeSession.elapsedSeconds / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(activeSession.elapsedSeconds % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-inner">
              <div className="space-y-1">
                <div className="text-[10px] text-[#c6c6ca] uppercase font-bold flex items-center justify-center gap-1">
                  <Footprints className="w-4 h-4 text-[#c3f400]" />
                  <span>Steps Taken</span>
                </div>
                <div className="font-headline text-3xl font-extrabold text-white">
                  {activeSession.steps.toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-[#c6c6ca] uppercase font-bold flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-[#ffb4ab]" />
                  <span>Calories Burned</span>
                </div>
                <div className="font-headline text-3xl font-extrabold text-[#ffb4ab]">
                  {Math.round(activeSession.calories)} <span className="text-xs font-normal">kcal</span>
                </div>
              </div>
            </div>

            {/* Optional AI mental trigger hint */}
            {activeSession.customPlan && (
              <div className="p-4 rounded-xl bg-[#3cddc7]/10 border border-[#3cddc7]/30 text-xs text-[#c6c6ca] italic">
                💡 AI Mindful focus: "{activeSession.customPlan.mindfulnessTip}"
              </div>
            )}
            {activeSession.route && (
              <div className="p-4 rounded-xl bg-[#c3f400]/10 border border-[#c3f400]/30 text-xs text-[#c3f400] font-semibold flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 animate-bounce" />
                <span>Navigating {activeSession.route.location} • Stay alert!</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="w-full max-w-md space-y-3 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveSession((prev) => (prev ? { ...prev, paused: !prev.paused } : null))
                }
                className={`py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all ${
                  activeSession.paused
                    ? "bg-[#3cddc7] text-black"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                {activeSession.paused ? "Resume Track" : "Pause Session"}
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="py-3 bg-[#c3f400] hover:bg-[#abd600] text-black font-headline font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#c3f400]/15"
              >
                Finish &amp; Log
              </button>
            </div>
            <div className="text-center text-[10px] text-gray-500 font-medium">
              *Steps are automatically synced to your weekly profile goal
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Generator dialog trigger modal */}
      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        onCommitWorkout={handleStartAIPermalPlan}
      />

      {/* Floating Action Button (FAB) - Desktop Only for New Scenic Route */}
      {activeTab === "feed" && (
        <button
          onClick={() => {
            setActiveTab("feed");
            setShowPostRouteForm(true);
          }}
          className="hidden md:flex fixed bottom-6 right-8 z-[80] w-14 h-14 bg-[#c3f400] hover:bg-[#abd600] text-black rounded-full shadow-[0px_10px_30px_rgba(195,244,0,0.4)] items-center justify-center active:scale-90 transition-all group"
        >
          <Plus className="w-7 h-7 transition-transform group-hover:rotate-90" />
        </button>
      )}

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-[100] bg-[#1d2022]/90 backdrop-blur-2xl rounded-t-2xl shadow-[0px_-10px_30px_rgba(0,0,0,0.5)] flex justify-around items-center px-4 py-3 md:hidden border-t border-white/5">
        <button
          onClick={() => {
            setActiveTab("hub");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "hub"
              ? "text-[#c3f400] font-extrabold bg-[#c3f400]/10"
              : "text-[#c6c6ca]"
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Hub</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("feed");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "feed"
              ? "text-[#c3f400] font-extrabold bg-[#c3f400]/10"
              : "text-[#c6c6ca]"
          }`}
        >
          <MapPin className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Feed</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("activity");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all ${
            activeTab === "activity"
              ? "text-[#c3f400] font-extrabold bg-[#c3f400]/10"
              : "text-[#c6c6ca]"
          }`}
        >
          <Trophy className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Activity</span>
        </button>

        <button
          onClick={() => {
            setShowProfileDrawer(true);
          }}
          className="flex flex-col items-center justify-center text-[#c6c6ca] px-4 py-1.5 rounded-xl transition-all hover:text-white"
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
}
