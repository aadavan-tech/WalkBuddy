import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  Play,
  Pause,
  Square,
  Sun,
  Moon,
  Upload,
  Images,
  Pencil,
  FileText,
  ChevronLeft,
  History,
  Mountain
} from "lucide-react";
import { Route, ActivityLog, AchievementBadge, UserPing, DEFAULT_AVATARS, ChatThread } from "./types";
import { ProfileRow, saveProfile } from "./lib/db";
import { uploadImage } from "./lib/storage";
import MapSection from "./components/MapSection";
import HubDashboard from "./components/HubDashboard";
import ScenicRoutes, { TrailPrefill } from "./components/ScenicRoutes";
import WeeklyProgress from "./components/WeeklyProgress";
import FirefliesCanvas from "./components/FirefliesCanvas";
import FogTransition from "./components/FogTransition";
import BuddyChatModal, { INITIAL_CHAT_THREADS } from "./components/BuddyChatModal";
import TermsOfUse from "./components/TermsOfUse";
import ThemeToggle from "./components/ThemeToggle";
import SessionHistory from "./components/SessionHistory";
import PostModal from "./components/PostModal";
import PostCard from "./components/PostCard";
import PostHeader from "./components/PostHeader";
import PostDetailsView from "./components/PostDetailsView";
import LoadingSkeleton from "./components/LoadingSkeleton";
import EmptyPosts from "./components/EmptyPosts";
import { useTheme } from "./lib/useTheme";
import { usePosts } from "./lib/posts";

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

const initialBadges: AchievementBadge[] = [
  {
    id: "badge-1",
    title: "Active Streak Holder",
    description: "14-day continuous active walk streak",
    iconName: "local_fire_department",
    unlocked: true,
    type: "streak",
  },
  {
    id: "badge-2",
    title: "50 km Milestone",
    description: "Silver outdoor explorer badge",
    iconName: "military_tech",
    unlocked: true,
    type: "silver",
  },
  {
    id: "badge-3",
    title: "100 km Gold Champion",
    description: "Gold outdoor endurance badge",
    iconName: "workspace_premium",
    unlocked: true,
    type: "gold",
  },
];

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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "feed" | "posts" | "sessions" | "analytics"
  >("dashboard");
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

  const [badges, setBadges] = useState<AchievementBadge[]>(initialBadges);

  // Modals
  const [showPostRouteForm, setShowPostRouteForm] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  /** Set right after finishing a workout so the user sees where it was saved. */
  const [completedSession, setCompletedSession] = useState<ActivityLog | null>(null);
  /** Session metrics carried into the Post Trail form. */
  const [trailPrefill, setTrailPrefill] = useState<TrailPrefill | null>(null);
  const [scheduledTrail, setScheduledTrail] = useState<Route | null>(null);

  // Profile drawer UI mode: read-only until the user taps "Edit Profile", and
  // the avatar picker stays collapsed until "Choose Avatar" is tapped.
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarUploadRef = useRef<HTMLInputElement | null>(null);

  // Theme: "dark" (default bioluminescent) or "light". Shared with onboarding.
  const [theme, toggleTheme] = useTheme();

  // Timed disappearing toast notifications.
  const [toasts, setToasts] = useState<
    { id: number; text: string; tone: "success" | "info" | "warn" }[]
  >([]);

  /** Text -> timestamp of the last toast, so we never queue the same one twice. */
  const lastToastRef = useRef<Record<string, number>>({});

  const pushToast = (text: string, tone: "success" | "info" | "warn" = "success") => {
    const now = Date.now();
    // Swallow an identical message fired within 1s (double click, StrictMode
    // double-invoke, or a re-render racing the handler).
    if (now - (lastToastRef.current[text] ?? 0) < 1000) return;
    lastToastRef.current[text] = now;

    const id = now + Math.random();
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  // Buddy DMs WhatsApp Chat Threads State
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem("walkbuddy_chat_threads");
    return saved ? JSON.parse(saved) : INITIAL_CHAT_THREADS;
  });

  useEffect(() => {
    localStorage.setItem("walkbuddy_chat_threads", JSON.stringify(chatThreads));
  }, [chatThreads]);

  const totalUnreadDMs = chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  // Active session state — `started` gates the timer so opening the HUD no
  // longer auto-starts tracking (the user presses Start explicitly).
  const [activeSession, setActiveSession] = useState<{
    route: Route | null;
    elapsedSeconds: number;
    /** Metres actually travelled, measured from GPS. */
    distanceM: number;
    /** Derived from real distance — never incremented while stationary. */
    steps: number;
    started: boolean;
    paused: boolean;
    /** True once we have a GPS fix; false means distance can't be measured. */
    gpsActive: boolean;
    gpsError: string | null;
    /** Reported accuracy of the last fix, in metres. */
    accuracyM: number | null;
    /** Cumulative climb, in metres, summed from GPS altitude gains. */
    elevationGainM: number;
    /** Demo mode simulates a steady walk (for testing without real GPS). */
    demo: boolean;
  } | null>(null);

  /** Last GPS fix, used to accumulate real distance between ticks. */
  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastAltitudeRef = useRef<number | null>(null);
  /** Low-pass filtered altitude, to reject GPS vertical jitter. */
  const smoothedAltRef = useRef<number | null>(null);
  const geoWatchRef = useRef<number | null>(null);

  // User profile state — seeded from the Supabase profile row when signed in,
  // falling back to the local cache for standalone/offline rendering.
  const [userName, setUserName] = useState(() => profile?.username || profile?.full_name || localStorage.getItem("walkbuddy_name") || "Alex Chen");
  const [userAge, setUserAge] = useState(() => (profile?.age != null ? String(profile.age) : localStorage.getItem("walkbuddy_age") || "26"));
  // Date of birth replaces the raw age field. Age is derived from it (and still
  // persisted to the `age` column so nothing downstream breaks).
  const [userDob, setUserDob] = useState(() => localStorage.getItem("walkbuddy_dob") || "");
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
    { id: 3, text: "You unlocked a new distance milestone badge!", read: true, time: "1d ago" },
  ]);

  const { posts, loading, error, reactionState, createPost, reactToPost } = usePosts(routes, profile?.id);
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;

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
    localStorage.setItem("walkbuddy_dob", userDob);
    localStorage.setItem("walkbuddy_gender", userGender);
    localStorage.setItem("walkbuddy_email", userEmail);
    localStorage.setItem("walkbuddy_phone", userPhone);
    localStorage.setItem("walkbuddy_avatar", userAvatar);
    localStorage.setItem("walkbuddy_weight", userWeight);
    localStorage.setItem("walkbuddy_goal", dailyStepsGoal);
  }, [userName, userAge, userDob, userGender, userEmail, userPhone, userAvatar, userWeight, dailyStepsGoal]);

  /** Whole-year age derived from the date-of-birth field (empty string if unset). */
  const computeAge = (dob: string): string => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 && age < 130 ? String(age) : "";
  };
  const derivedAge = computeAge(userDob) || userAge;

  // Keep the legacy age field in sync whenever a DOB is entered.
  useEffect(() => {
    const a = computeAge(userDob);
    if (a) setUserAge(a);
  }, [userDob]);

  /** Uploads a chosen photo to Supabase Storage and uses its public URL. */
  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const res = await uploadImage(file, "avatars", profile?.id);
      setUserAvatar(res.url);
      pushToast(
        res.fallback ? "Photo saved locally — upload unavailable" : "Profile photo updated",
        res.fallback ? "warn" : "success"
      );
    } catch (err: any) {
      pushToast(err?.message || "Could not use that image", "warn");
    }
  };

  /**
   * Persists the profile drawer edits back to the Supabase `profiles` table.
   * Falls back to the local cache (already written by the effect above) when
   * the app is rendered without a signed-in profile.
   */
  const handleSaveProfileChanges = async () => {
    if (!profile) {
      setEditingProfile(false);
      pushToast("Profile saved", "success");
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

      setEditingProfile(false);
      pushToast("Profile saved", "success");
    } catch (err: any) {
      setProfileSaveError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  /** Great-circle distance between two GPS fixes, in metres. */
  const metresBetween = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  // Elapsed-time ticker. Only the clock advances here — steps and distance come
  // from real GPS movement below, so standing still no longer inflates them.
  useEffect(() => {
    if (!activeSession?.started || activeSession.paused) return;
    const interval = setInterval(() => {
      setActiveSession((prev) =>
        prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.started, activeSession?.paused]);

  // Demo mode: fakes a steady 1.4 m/s walk so the HUD can be exercised on a
  // desktop, where Wi-Fi positioning cannot detect room-scale movement.
  useEffect(() => {
    if (!activeSession?.started || activeSession.paused || !activeSession.demo) return;
    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const distanceM = prev.distanceM + 1.4;
        return {
          ...prev,
          distanceM,
          steps: Math.round(distanceM / 0.75),
          // ~1 m of climb per 100 m walked — a gentle, believable gradient.
          elevationGainM: prev.elevationGainM + 0.014,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.started, activeSession?.paused, activeSession?.demo]);

  // Real movement tracking via the Geolocation API.
  useEffect(() => {
    const running = activeSession?.started && !activeSession.paused && !activeSession.demo;

    if (!running) {
      if (geoWatchRef.current != null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      lastFixRef.current = null; // don't bridge the pause gap into distance
      lastAltitudeRef.current = null;
    smoothedAltRef.current = null;
      return;
    }

    if (!("geolocation" in navigator)) {
      setActiveSession((prev) =>
        prev ? { ...prev, gpsError: "Location is not available on this device." } : null
      );
      return;
    }

    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const accuracy = pos.coords.accuracy ?? 999;
        const prevFix = lastFixRef.current;
        lastFixRef.current = fix;

        // Elevation: raw GPS altitude swings by several metres even when
        // stationary, so smooth it first (EMA) and only bank a climb once the
        // smoothed value rises clear of the noise floor. Reference altitude
        // only moves upward as gain is banked, so drift can't double-count.
        const alt = pos.coords.altitude;
        const altAcc = pos.coords.altitudeAccuracy ?? 999;
        let climbM = 0;
        if (alt != null && Number.isFinite(alt) && altAcc <= 30) {
          const smoothed =
            smoothedAltRef.current == null
              ? alt
              : smoothedAltRef.current * 0.7 + alt * 0.3;
          smoothedAltRef.current = smoothed;

          if (lastAltitudeRef.current == null) {
            lastAltitudeRef.current = smoothed;
          } else {
            const dAlt = smoothed - lastAltitudeRef.current;
            // 3 m clears typical consumer-GPS vertical noise.
            if (dAlt >= 3) {
              climbM = dAlt;
              lastAltitudeRef.current = smoothed;
            } else if (dAlt < -3) {
              // Descending: move the reference down so the next climb is
              // measured from the new low point.
              lastAltitudeRef.current = smoothed;
            }
          }
        }

        setActiveSession((prev) => {
          if (!prev) return null;
          let addedM = 0;
          if (prevFix) {
            const d = metresBetween(prevFix, fix);
            // Drop obvious teleports and sub-metre noise. The accuracy gate is
            // generous because Wi-Fi positioning (laptops, indoors) reports
            // tens-to-hundreds of metres even when the fix is usable.
            if (d >= 1 && d < 250 && accuracy <= 200) addedM = d;
          }
          const distanceM = prev.distanceM + addedM;
          return {
            ...prev,
            distanceM,
            // ~0.75 m per step is the usual adult stride.
            steps: Math.round(distanceM / 0.75),
            elevationGainM: prev.elevationGainM + climbM,
            gpsActive: true,
            gpsError: null,
            accuracyM: Math.round(accuracy),
          };
        });
      },
      (err) => {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                gpsActive: false,
                gpsError:
                  err.code === err.PERMISSION_DENIED
                    ? "Location permission denied — distance can't be tracked."
                    : "Waiting for a GPS signal…",
              }
            : null
        );
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (geoWatchRef.current != null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    };
  }, [activeSession?.started, activeSession?.paused]);

  const blankSession = {
    elapsedSeconds: 0,
    distanceM: 0,
    steps: 0,
    started: false,
    paused: false,
    gpsActive: false,
    gpsError: null,
    accuracyM: null,
    elevationGainM: 0,
    demo: false,
  };

  const handleStartRouteSession = (route: Route) => {
    lastFixRef.current = null;
    lastAltitudeRef.current = null;
    smoothedAltRef.current = null;
    setActiveSession({ ...blankSession, route });
    pushToast(`Route loaded — press Start when ready`, "info");
  };

  /** Opens the timer HUD for a free-form session (the floating + button). */
  const handleQuickSession = () => {
    lastFixRef.current = null;
    lastAltitudeRef.current = null;
    smoothedAltRef.current = null;
    setActiveSession({ ...blankSession, route: null });
  };

  // Start / Pause / Resume controls for the workout HUD (Strava-style).
  const handleSessionStart = () => {
    if (!activeSession || activeSession.started) return;
    setActiveSession((prev) => (prev ? { ...prev, started: true, paused: false } : null));
    pushToast("Session started — good luck!", "success");
  };

  const handleSessionPause = () => {
    if (!activeSession) return;
    const nextPaused = !activeSession.paused;
    setActiveSession((prev) => (prev ? { ...prev, paused: nextPaused } : null));
    pushToast(nextPaused ? "Session paused" : "Session resumed", "info");
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const durationMins = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
    const distKm = parseFloat((activeSession.distanceM / 1000).toFixed(2));

    // Pace in min:sec per km (blank when the user never actually moved).
    const paceMinPerKm =
      distKm > 0
        ? `${Math.floor(activeSession.elapsedSeconds / 60 / distKm)}:${Math.round(
            ((activeSession.elapsedSeconds / distKm) % 60)
          )
            .toString()
            .padStart(2, "0")}`
        : "—";

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: activeSession.route?.category || "Walking",
      distanceKm: distKm,
      elevationGainM: Math.round(activeSession.elevationGainM),
      steps: activeSession.steps,
      durationMin: durationMins,
      paceMinPerKm,
      notes: activeSession.route
        ? `Completed scenic route: ${activeSession.route.name}`
        : "Completed a free walk session",
    };

    setLogs([newLog, ...logs]);
    setActiveSession(null);
    // Surface where the session went: show a summary, then the logs list.
    setCompletedSession(newLog);
    pushToast(`Session saved to your activity log`, "success");
  };

  /** Opens the Post Trail form on the Feed, prefilled from a finished session. */
  const handlePostTrailFromSession = (log: ActivityLog) => {
    setTrailPrefill({
      distanceKm: log.distanceKm,
      elevationGainM: log.elevationGainM ?? 0,
      estimatedTimeMin: log.durationMin,
      category:
        log.type === "Jogging" || log.type === "Sprinting" ? log.type : "Walking",
    });
    setActiveTab("feed");
    setShowPostRouteForm(true);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    pushToast("Session deleted", "info");
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
    setRoutes((prev) => [newRoute, ...prev]);
    return newRoute;
  };

  const handleOpenScheduleModal = (route: Route) => {
    setScheduledTrail(route);
    setShowPostModal(true);
  };

  const handlePublishPost = async (payload: {
    title: string;
    description: string;
    scheduled_at: string;
    visibility: "PUBLIC" | "PRIVATE";
    trailDraft?: Omit<Route, "id">;
  }) => {
    if (!profile?.id) {
      pushToast("Sign in to publish a Post.", "warn");
      return;
    }

    let routeForPost = scheduledTrail;
    if (!routeForPost && payload.trailDraft) {
      routeForPost = handlePostRoute({
        ...payload.trailDraft,
        author: {
          name: profile.username || profile.full_name || "Trail Explorer",
          avatar: profile.avatar_url || DEFAULT_AVATARS[0].url,
        },
      });
    }

    if (!routeForPost) {
      pushToast("Choose or create a trail before publishing.", "warn");
      return;
    }

    await createPost({
      id: `post-${Date.now()}`,
      creator_id: profile.id,
      trail_id: routeForPost.id,
      title: payload.title,
      description: payload.description,
      scheduled_at: payload.scheduled_at,
      visibility: payload.visibility,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    pushToast("Post published", "success");
    setScheduledTrail(null);
    setShowPostModal(false);
    setActiveTab("posts");
  };

  const handleToggleBadge = (badgeId: string) => {
    setBadges(
      badges.map((b) => (b.id === badgeId ? { ...b, unlocked: !b.unlocked } : b))
    );
  };

  return (
    <div className="min-h-screen bg-[#020b08] text-white flex flex-col relative font-sans overflow-x-hidden">
      {/* Background Bioluminescent Fireflies Animation (dialed down for a softer glow) */}
      <FirefliesCanvas density="magical" />

      {/* Timed disappearing toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[5000] flex flex-col items-center gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-enter pointer-events-auto w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-bold ${
                t.tone === "success"
                  ? "bg-[#041a14]/95 border-[#00ffc8]/40 text-white"
                  : t.tone === "warn"
                  ? "bg-[#2a1206]/95 border-amber-400/40 text-amber-100"
                  : "bg-[#041a14]/95 border-[#00e5ff]/40 text-white"
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  t.tone === "success"
                    ? "bg-[#00ffc8]/20 text-[#00ffc8]"
                    : t.tone === "warn"
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-[#00e5ff]/20 text-[#00e5ff]"
                }`}
              >
                {t.tone === "warn" ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </span>
              <span className="leading-snug">{t.text}</span>
            </div>
          ))}
        </div>
      )}

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
              onClick={() => setActiveTab("posts")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "posts"
                  ? "text-[#00ffc8] border-b-2 border-[#00ffc8]"
                  : "text-emerald-100/70 hover:text-white"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`font-headline text-xs uppercase tracking-wider font-extrabold py-1.5 transition-all relative ${
                activeTab === "sessions"
                  ? "text-[#00ffc8] border-b-2 border-[#00ffc8]"
                  : "text-emerald-100/70 hover:text-white"
              }`}
            >
              Sessions
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
          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

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
                  onClick={() => {
                    setShowProfileDrawer(false);
                    setEditingProfile(false);
                    setShowAvatarPicker(false);
                  }}
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
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#00ffc8] shadow-[0_0_14px_rgba(0,255,200,0.28)]"
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
                    {userGender}
                    {derivedAge ? ` • ${derivedAge} yrs` : ""}
                  </span>
                </div>
              </div>

              {/* Avatar Actions — grid stays hidden until "Choose Avatar" is tapped */}
              <div className="space-y-2.5">
                <input
                  ref={avatarUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleAvatarUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                      showAvatarPicker
                        ? "bg-[#00ffc8]/20 text-[#00ffc8] border-[#00ffc8]/40"
                        : "bg-white/5 text-emerald-100 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Images className="w-4 h-4" />
                    <span>{showAvatarPicker ? "Hide Avatars" : "Choose Avatar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => avatarUploadRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border bg-white/5 text-emerald-100 border-white/10 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {showAvatarPicker && (
                  <div className="space-y-2 animate-fadeIn">
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
                            onClick={() => {
                              setUserAvatar(avatar.url);
                              pushToast("Avatar updated", "success");
                            }}
                            title={avatar.label}
                            className={`relative rounded-full aspect-square overflow-hidden transition-all duration-200 group ${
                              isSelected
                                ? "ring-2 ring-[#00ffc8] ring-offset-2 ring-offset-[#04120e] scale-105 shadow-[0_0_10px_#00ffc8]"
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
                )}
              </div>

              {/* Personal Details — read-only until "Edit Profile" is tapped */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] text-[#00ffc8] uppercase font-black tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#00ffc8]" />
                    <span>Personal Details</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingProfile((v) => !v)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                      editingProfile
                        ? "bg-white/5 text-emerald-100 border-white/10 hover:bg-white/10"
                        : "bg-[#00ffc8]/15 text-[#00ffc8] border-[#00ffc8]/30 hover:bg-[#00ffc8]/25"
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{editingProfile ? "Cancel" : "Edit Profile"}</span>
                  </button>
                </div>

                {!editingProfile ? (
                  /* ---- Read-only view ---- */
                  <div className="space-y-2">
                    {[
                      { icon: <User className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Full Name", value: userName || "—" },
                      {
                        icon: <Calendar className="w-3.5 h-3.5 text-[#00ffc8]" />,
                        label: "Date of Birth",
                        value: userDob
                          ? `${new Date(userDob).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}${derivedAge ? ` · ${derivedAge} yrs` : ""}`
                          : "Not set",
                      },
                      { icon: <ShieldCheck className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Gender", value: userGender || "—" },
                      { icon: <Mail className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Email", value: userEmail || "—" },
                      { icon: <Phone className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Phone", value: userPhone || "—" },
                      { icon: <Flame className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Weight", value: userWeight ? `${userWeight} kg` : "—" },
                      { icon: <Footprints className="w-3.5 h-3.5 text-[#00ffc8]" />, label: "Daily Step Goal", value: dailyStepsGoal || "—" },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-emerald-200/80">
                          {row.icon}
                          {row.label}
                        </span>
                        <span className="text-xs font-bold text-white truncate text-right max-w-[55%]">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ---- Edit form ---- */
                  <div className="space-y-3.5 animate-fadeIn">
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

                    {/* DOB & Gender Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#00ffc8]" />
                          <span>Date of Birth</span>
                        </label>
                        <input
                          type="date"
                          value={userDob}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setUserDob(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] transition-colors [color-scheme:dark]"
                        />
                        {derivedAge && (
                          <span className="block mt-1 text-[9px] text-emerald-200/60 font-bold">
                            Age: {derivedAge} yrs
                          </span>
                        )}
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
                )}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {profileSaveError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/35 text-red-200 text-[11px] font-semibold leading-relaxed">
                  {profileSaveError}
                </div>
              )}

              {editingProfile && (
                <button
                  type="button"
                  onClick={handleSaveProfileChanges}
                  disabled={savingProfile}
                  className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-[0_3px_18px_rgba(0,255,200,0.28)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingProfile ? "Saving…" : "Save Profile Changes"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Terms of Use</span>
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

                <HubDashboard logs={logs} />
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="px-4 md:px-10 pt-6">
              <ScenicRoutes
                routes={routes}
                onSelectRoute={handleStartRouteSession}
                onPostRoute={handlePostRoute}
                currentUserName={profile?.username || profile?.full_name || userName}
                showPostForm={showPostRouteForm}
                prefill={trailPrefill}
                userId={profile?.id}
                onNotify={pushToast}
                onClosePostForm={() => {
                  setShowPostRouteForm(false);
                  setTrailPrefill(null);
                }}
                onOpenPostForm={() => {
                  setTrailPrefill(null);
                  setShowPostRouteForm(true);
                }}
                onScheduleTrail={handleOpenScheduleModal}
              />
            </div>
          )}

          {activeTab === "posts" && (
            <div className="px-4 md:px-10 pt-6">
              {selectedPost ? (
                <PostDetailsView
                  post={{
                    ...selectedPost,
                    creator_name: selectedPost.creator_name || userName,
                    creator_avatar: selectedPost.creator_avatar || userAvatar,
                    trail: routes.find((route) => route.id === selectedPost.trail_id) || null,
                  }}
                  interestedCount={reactionState[selectedPost.id]?.interested ?? 0}
                  userReaction={reactionState[selectedPost.id]?.userReaction ?? null}
                  onBack={() => setSelectedPostId(null)}
                  onReact={(reaction) => reactToPost(selectedPost.id, reaction)}
                />
              ) : (
                <>
                  <PostHeader
                    title="Upcoming Community Runs"
                    subtitle="Schedule runs with your community."
                    onCreatePost={() => {
                      const firstRoute = routes[0];
                      if (firstRoute) handleOpenScheduleModal(firstRoute);
                    }}
                  />
                  {loading ? (
                    <LoadingSkeleton />
                  ) : error ? (
                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-100">{error}</div>
                  ) : posts.length === 0 ? (
                    <EmptyPosts onCreatePost={() => {
                      const firstRoute = routes[0];
                      if (firstRoute) handleOpenScheduleModal(firstRoute);
                    }} />
                  ) : (
                    <div className="space-y-5"> 
                      {posts.map((post) => (
                        <div key={post.id}>
                          <PostCard
                            post={{
                              ...post,
                              creator_name: post.creator_name || userName,
                              creator_avatar: post.creator_avatar || userAvatar,
                              trail: routes.find((route) => route.id === post.trail_id) || null,
                            }}
                            userReaction={reactionState[post.id]?.userReaction ?? null}
                            interestedCount={reactionState[post.id]?.interested ?? 0}
                            onOpenDetails={(postId) => setSelectedPostId(postId)}
                            onReact={(postId, reaction) => reactToPost(postId, reaction)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="px-4 md:px-10 pt-6">
              <SessionHistory
                logs={logs}
                onDeleteLog={handleDeleteLog}
                onPostTrail={handlePostTrailFromSession}
              />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="px-4 md:px-10 pt-6">
              <WeeklyProgress
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
        <div className="workout-hud fixed inset-0 z-[3000] bg-black/95 backdrop-blur-2xl p-6 flex flex-col justify-between items-center border border-[#00ffc8]/30">
          <div className="w-full max-w-md flex justify-between items-center border-b border-[#00ffc8]/20 pb-4">
            <div>
              <span className="text-[10px] text-[#00ffc8] font-black uppercase tracking-widest block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00ffc8]" />
                <span>
                  {!activeSession.started
                    ? "Ready to Start"
                    : activeSession.paused
                    ? "Session Paused"
                    : "Active Session Tracking"}
                </span>
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

          <div className="text-center space-y-5 my-auto w-full max-w-md">
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

            {/* Live metrics — steps, distance and climb, all from real movement */}
            <div className="grid grid-cols-3 gap-3 bg-[#041a14]/90 p-5 rounded-2xl border border-[#00ffc8]/30 shadow-2xl">
              <div className="space-y-1">
                <div className="text-[9px] text-emerald-200/80 uppercase font-black flex items-center justify-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-[#00ffc8]" />
                  <span>Steps</span>
                </div>
                <div className="font-headline text-2xl font-black text-white">
                  {activeSession.steps.toLocaleString()}
                </div>
              </div>

              <div className="space-y-1 border-x border-white/10">
                <div className="text-[9px] text-emerald-200/80 uppercase font-black flex items-center justify-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>Distance</span>
                </div>
                <div className="font-headline text-2xl font-black text-[#00e5ff]">
                  {(activeSession.distanceM / 1000).toFixed(2)}
                  <span className="text-[11px] font-normal ml-0.5">km</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] text-emerald-200/80 uppercase font-black flex items-center justify-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-[#adff2f]" />
                  <span>Elevation</span>
                </div>
                <div className="font-headline text-2xl font-black text-[#adff2f]">
                  {Math.round(activeSession.elevationGainM)}
                  <span className="text-[11px] font-normal ml-0.5">m</span>
                </div>
              </div>
            </div>

            {/* Only surface GPS state when something is actually wrong. */}
            {activeSession.started && activeSession.gpsError && !activeSession.demo && (
              <div className="px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 border bg-amber-400/10 border-amber-400/30 text-amber-200">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeSession.gpsError}</span>
              </div>
            )}

            {activeSession.route && (
              <div className="p-4 rounded-xl bg-[#00ffc8]/10 border border-[#00ffc8]/30 text-xs text-[#00ffc8] font-bold flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Navigating {activeSession.route.location}</span>
              </div>
            )}
          </div>

          <div className="w-full max-w-md space-y-3 pb-6">
            {/* Strava-style Start / Pause / Finish controls with icon logos */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleSessionStart}
                disabled={activeSession.started}
                className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl font-headline font-black text-[11px] uppercase tracking-wider transition-all ${
                  activeSession.started
                    ? "bg-white/5 text-emerald-200/40 border border-white/5 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black shadow-[0_3px_16px_rgba(0,255,200,0.28)] active:scale-95"
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start</span>
              </button>

              <button
                type="button"
                onClick={handleSessionPause}
                disabled={!activeSession.started}
                className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl font-headline font-black text-[11px] uppercase tracking-wider transition-all border ${
                  !activeSession.started
                    ? "bg-white/5 text-emerald-200/40 border-white/5 cursor-not-allowed"
                    : activeSession.paused
                    ? "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40 active:scale-95"
                    : "bg-white/10 hover:bg-white/15 text-white border-white/10 active:scale-95"
                }`}
              >
                <Pause className="w-5 h-5" />
                <span>{activeSession.paused ? "Resume" : "Pause"}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-[#ff5a4d]/90 hover:bg-[#ff5a4d] text-white font-headline font-black text-[11px] uppercase tracking-wider rounded-xl shadow-[0_3px_16px_rgba(255,90,77,0.3)] active:scale-95 transition-all"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Finish</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveSession((prev) => (prev ? { ...prev, demo: !prev.demo } : null))
              }
              className={`w-full text-center text-[11px] font-bold py-2 rounded-lg border transition-all ${
                activeSession.demo
                  ? "bg-[#00e5ff]/15 border-[#00e5ff]/35 text-[#00e5ff]"
                  : "bg-white/5 border-white/10 text-emerald-200/60 hover:text-white"
              }`}
              title="Simulates a walk so you can test without real GPS movement"
            >
              {activeSession.demo ? "Demo movement ON — tap to use real GPS" : "Use demo movement (no GPS)"}
            </button>
          </div>
        </div>
      )}

      {/* Session Summary — shown right after Finish so the user knows where it went */}
      {completedSession && (
        <div className="fixed inset-0 z-[3500] bg-black/85 backdrop-blur-xl flex items-center justify-center p-5 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#041a14] border border-[#00ffc8]/35 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00ffc8]/15 border border-[#00ffc8]/30 flex items-center justify-center">
                <Check className="w-7 h-7 text-[#00ffc8] stroke-[3]" />
              </div>
              <h3 className="font-headline text-xl font-black text-white uppercase italic tracking-tight">
                Session Complete
              </h3>
              <p className="text-xs text-emerald-200/70 font-medium">
                Saved to your Sessions tab
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
              <div>
                <div className="text-[9px] text-emerald-200/60 uppercase font-black">Distance</div>
                <div className="font-headline text-lg font-black text-[#00e5ff]">
                  {completedSession.distanceKm}
                  <span className="text-[10px] font-normal ml-0.5">km</span>
                </div>
              </div>
              <div className="border-x border-white/10">
                <div className="text-[9px] text-emerald-200/60 uppercase font-black">Steps</div>
                <div className="font-headline text-lg font-black text-white">
                  {completedSession.steps.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-emerald-200/60 uppercase font-black">Time</div>
                <div className="font-headline text-lg font-black text-[#00ffc8]">
                  {completedSession.durationMin}
                  <span className="text-[10px] font-normal ml-0.5">min</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setCompletedSession(null);
                  setActiveTab("sessions");
                }}
                className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Footprints className="w-4 h-4" />
                <span>View My Sessions</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSession(null)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <PostModal
        isOpen={showPostModal}
        route={scheduledTrail}
        routes={routes}
        userId={profile?.id}
        onClose={() => {
          setShowPostModal(false);
          setScheduledTrail(null);
        }}
        onPublish={handlePublishPost}
      />

      {/* Floating Start-Session Button — on every page, opens the timer HUD */}
      {!activeSession && !completedSession && (
        <button
          onClick={handleQuickSession}
          title="Start a workout session"
          aria-label="Start a workout session"
          className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-[90] w-16 h-16 bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black rounded-full shadow-[0_6px_22px_rgba(0,255,200,0.35)] flex items-center justify-center active:scale-90 transition-all group"
        >
          <Plus className="w-8 h-8 transition-transform group-hover:rotate-90 stroke-[2.5]" />
        </button>
      )}

      {/* Terms of Use Page */}
      <TermsOfUse isOpen={showTerms} onClose={() => setShowTerms(false)} />

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
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
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
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
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
            setActiveTab("posts");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "posts"
              ? "text-[#00ffc8] font-black bg-[#00ffc8]/10"
              : "text-emerald-200/60"
          }`}
        >
          <Calendar className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Posts</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("sessions");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "sessions"
              ? "text-[#00ffc8] font-black bg-[#00ffc8]/10"
              : "text-emerald-200/60"
          }`}
        >
          <History className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">Sessions</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("analytics");
            setShowPostRouteForm(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
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
