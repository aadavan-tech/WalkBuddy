import React, { useState } from "react";
import { Star, MapPin, Navigation, ThumbsUp, Plus, Image as ImageIcon, Send, X, Compass, Clock } from "lucide-react";
import { Route } from "../types";

interface ScenicRoutesProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  onPostRoute: (newRoute: Omit<Route, "id">) => void;
  showPostForm: boolean;
  onClosePostForm: () => void;
  onOpenPostForm?: () => void;
}

export default function ScenicRoutes({
  routes,
  onSelectRoute,
  onPostRoute,
  showPostForm,
  onClosePostForm,
  onOpenPostForm,
}: ScenicRoutesProps) {
  // Local categories
  const [activeTab, setActiveTab] = useState<"All" | "Walking" | "Jogging" | "Sprinting">("All");
  
  // Likes local state mapping
  const [likes, setLikes] = useState<Record<string, number>>({
    "route-1": 42,
    "route-2": 28,
    "route-3": 19,
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  // New Route Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<"Walking" | "Jogging" | "Sprinting">("Walking");
  const [distanceKm, setDistanceKm] = useState("5.4");
  const [elevationGainM, setElevationGainM] = useState("150");
  const [durationMin, setDurationMin] = useState("45");
  const [review, setReview] = useState("");

  const handleLike = (routeId: string) => {
    const alreadyLiked = userLiked[routeId];
    if (alreadyLiked) {
      setLikes({ ...likes, [routeId]: (likes[routeId] || 0) - 1 });
      setUserLiked({ ...userLiked, [routeId]: false });
    } else {
      setLikes({ ...likes, [routeId]: (likes[routeId] || 0) + 1 });
      setUserLiked({ ...userLiked, [routeId]: true });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    // Use a random sport-related Unsplash image for new routes
    const randomImage = `https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80`;

    onPostRoute({
      name,
      location,
      category,
      distanceKm: parseFloat(distanceKm) || 5,
      elevationGainM: parseInt(elevationGainM) || 100,
      estimatedTimeMin: parseInt(durationMin) || 40,
      rating: 4.8,
      image: randomImage,
      author: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      review: review || "Beautiful active path! Perfect for outdoor exercise.",
      reviewTime: "Just now",
      lat: 50 + Math.random() * 20, // visual coordinate placement
      lng: 40 + Math.random() * 20,
    });

    // Reset Form & Close
    setName("");
    setLocation("");
    setReview("");
    onClosePostForm();
  };

  // Filter routes based on activeTab selection
  const displayedRoutes = routes.filter((route) => {
    if (activeTab === "All") return true;
    return route.category === activeTab;
  });

  return (
    <div className="w-full space-y-8 max-w-2xl mx-auto pb-12">
      {/* Scenic Routes Header Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-black text-white italic tracking-tight uppercase leading-none">
            Scenic Routes
          </h1>
          <p className="text-xs text-[#c6c6ca] uppercase tracking-widest font-bold">
            Discovered by the outdoor fitness community
          </p>
        </div>
        {!showPostForm && onOpenPostForm && (
          <button
            onClick={onOpenPostForm}
            className="bg-[#c3f400] hover:bg-[#abd600] text-black font-headline font-extrabold tracking-tight text-xs py-2 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-[0px_4px_15px_rgba(195,244,0,0.3)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post Route</span>
          </button>
        )}
      </div>

      {/* Tab Filter buttons */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {["All", "Walking", "Jogging", "Sprinting"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab
                ? "bg-white/10 text-[#c3f400] border border-[#c3f400]/35"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Immersive Scenic route creator modal form */}
      {showPostForm && (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-black border-[#c3f400]/30 shadow-[0_0_50px_rgba(195,244,0,0.15)]">
          <button
            onClick={onClosePostForm}
            className="absolute top-4 right-4 text-gray-400 hover:text-white active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="font-headline text-base font-extrabold uppercase tracking-wider text-[#c3f400] mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span>Discover a New Scenic Route</span>
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Route / Path Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Runner Peak, Riverside Walk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chamonix, FR or Central Park, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Category Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Elevation Gain (m)
                </label>
                <input
                  type="number"
                  required
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                  Est. Duration (min)
                </label>
                <input
                  type="number"
                  required
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#c6c6ca] uppercase font-extrabold mb-1.5">
                Review Description
              </label>
              <textarea
                required
                placeholder="What makes this route beautiful? Sunset spot, rocky stairs, perfect breeze?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c3f400]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#c3f400] hover:bg-[#abd600] text-black font-headline font-black text-xs py-3 rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(195,244,0,0.2)]"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Route to Feed</span>
            </button>
          </form>
        </div>
      )}

      {/* Feed Cards List */}
      <div className="space-y-8">
        {displayedRoutes.map((route) => {
          const categoryColor = 
            route.category === "Walking" 
              ? "text-[#c3f400]" 
              : route.category === "Jogging"
              ? "text-[#3cddc7]"
              : "text-[#ffb4ab]";

          const formatDuration = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return h > 0 ? `${h}:${m.toString().padStart(2, "0")}h` : `${m}m`;
          };

          return (
            <article
              key={route.id}
              className="group relative bg-[#1d2022] rounded-2xl overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.5)] border border-white/5 transition-all duration-300 hover:translate-y-[-4px] hover:border-white/15"
            >
              {/* Image banner with overlays */}
              <div className="relative h-64 w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${route.image}')` }}
                />
                <div className="absolute inset-0 scenic-gradient" />

                {/* Star rating overlay */}
                <div className="absolute top-4 right-4 glass-panel px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 text-[#c3f400] fill-current" />
                  <span className="font-headline font-bold text-xs text-white">{route.rating}</span>
                </div>

                {/* Route label category badge */}
                <div className="absolute top-4 left-4 bg-black/75 border border-white/10 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-extrabold text-white">
                  {route.category}
                </div>

                {/* Lower metadata overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="font-headline text-2xl font-black text-white drop-shadow-lg tracking-tight uppercase italic leading-tight">
                    {route.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#c6c6ca] font-semibold uppercase tracking-widest mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#c3f400]" />
                    <span>{route.location}</span>
                  </div>
                </div>
              </div>

              {/* Specs and Details content body */}
              <div className="p-5 space-y-5">
                {/* 3-Column Performance Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">
                      Distance
                    </span>
                    <span className={`font-headline text-xl font-extrabold ${categoryColor}`}>
                      {route.distanceKm}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">km</span>
                    </span>
                  </div>

                  <div className="flex flex-col border-x border-white/5 px-4">
                    <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">
                      Elev. Gain
                    </span>
                    <span className="font-headline text-xl font-extrabold text-[#3cddc7]">
                      {route.elevationGainM}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">m</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">
                      Est. Time
                    </span>
                    <span className="font-headline text-xl font-extrabold text-white">
                      {formatDuration(route.estimatedTimeMin)}
                    </span>
                  </div>
                </div>

                {/* Community review testimonial block */}
                <div className="flex gap-4 items-start bg-zinc-950/45 p-4 rounded-xl border border-white/5">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 border border-[#c3f400]/20"
                    style={{ backgroundImage: `url('${route.author.avatar}')` }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-xs font-bold text-white">{route.author.name}</span>
                      <span className="text-[10px] text-gray-500">{route.reviewTime}</span>
                    </div>
                    <p className="text-xs text-[#c6c6ca] leading-relaxed italic">
                      "{route.review}"
                    </p>
                  </div>
                </div>

                {/* Action button row */}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleLike(route.id)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all px-3 py-1.5 rounded-lg ${
                      userLiked[route.id]
                        ? "text-[#c3f400] bg-[#c3f400]/10"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${userLiked[route.id] ? "fill-current" : ""}`} />
                    <span>{likes[route.id] || 0} Upvotes</span>
                  </button>

                  <button
                    onClick={() => onSelectRoute(route)}
                    className="bg-white/5 hover:bg-[#c3f400] hover:text-black text-white font-headline text-[11px] uppercase font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Run Route</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
