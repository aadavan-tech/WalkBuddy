import React, { useEffect, useRef, useState } from "react";
import { Star, MapPin, Navigation, ThumbsUp, Plus, Send, X, Compass, Image as ImageIcon, Trash2 } from "lucide-react";
import { Route } from "../types";

/** Metrics carried over from a finished session into the Post Trail form. */
export interface TrailPrefill {
  distanceKm: number;
  elevationGainM: number;
  estimatedTimeMin: number;
  category?: "Walking" | "Jogging" | "Sprinting";
}

interface ScenicRoutesProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  onPostRoute: (newRoute: Omit<Route, "id">) => void;
  showPostForm: boolean;
  onClosePostForm: () => void;
  onOpenPostForm?: () => void;
  /** When set, distance/elevation/time come from a completed session. */
  prefill?: TrailPrefill | null;
}

export default function ScenicRoutes({
  routes,
  onSelectRoute,
  onPostRoute,
  showPostForm,
  onClosePostForm,
  onOpenPostForm,
  prefill,
}: ScenicRoutesProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Walking" | "Jogging" | "Sprinting">("All");
  
  const [likes, setLikes] = useState<Record<string, number>>({
    "route-1": 54,
    "route-2": 39,
    "route-3": 27,
    "route-4": 18,
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<"Walking" | "Jogging" | "Sprinting">("Walking");
  const [distanceKm, setDistanceKm] = useState("5.8");
  const [elevationGainM, setElevationGainM] = useState("180");
  const [durationMin, setDurationMin] = useState("50");
  const [review, setReview] = useState("");
  const [pathImage, setPathImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Metrics arriving from a finished session are auto-filled and locked, so the
  // user only supplies the descriptive fields.
  const fromSession = Boolean(prefill);
  useEffect(() => {
    if (!prefill) return;
    setDistanceKm(String(prefill.distanceKm));
    setElevationGainM(String(prefill.elevationGainM));
    setDurationMin(String(prefill.estimatedTimeMin));
    if (prefill.category) setCategory(prefill.category);
  }, [prefill]);

  const handleImagePick = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPathImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

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

    const fallbackImage = `https://images.unsplash.com/photo-1511497584788-8767610419ea?auto=format&fit=crop&w=800&q=80`;

    onPostRoute({
      name,
      location,
      category,
      distanceKm: parseFloat(distanceKm) || 5,
      elevationGainM: parseInt(elevationGainM) || 100,
      estimatedTimeMin: parseInt(durationMin) || 40,
      rating: 4.9,
      image: pathImage || fallbackImage,
      author: {
        name: "Trail Explorer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      review: review || "Scenic outdoor route with great footpaths and beautiful surroundings!",
      reviewTime: "Just now",
      lat: 50 + Math.random() * 20,
      lng: 40 + Math.random() * 20,
    });

    setName("");
    setLocation("");
    setReview("");
    setPathImage(null);
    onClosePostForm();
  };

  const displayedRoutes = routes.filter((route) => {
    if (activeTab === "All") return true;
    return route.category === activeTab;
  });

  return (
    <div className="w-full space-y-8 max-w-3xl mx-auto pb-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#00ffc8]/20 pb-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-black text-white italic tracking-tight uppercase leading-none">
            Scenic Routes Feed
          </h1>
          <p className="text-xs text-emerald-200/80 uppercase tracking-widest font-black">
            Popular walking, jogging, and outdoor routes shared by the community
          </p>
        </div>
        {!showPostForm && onOpenPostForm && (
          <button
            onClick={onOpenPostForm}
            className="bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] hover:opacity-90 text-black font-headline font-black text-xs py-2 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,255,200,0.3)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post Trail</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar max-w-full">
        {["All", "Walking", "Jogging", "Sprinting"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
              activeTab === tab
                ? "bg-[#00ffc8]/20 text-[#00ffc8] border border-[#00ffc8]/50 shadow-[0_0_15px_rgba(0,255,200,0.2)]"
                : "text-emerald-100/60 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Post Route Form */}
      {showPostForm && (
        <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden bg-[#041a14]/95 border-[#00ffc8]/40 shadow-[0_0_50px_rgba(0,255,200,0.15)] animate-fadeIn">
          <button
            onClick={onClosePostForm}
            className="absolute top-4 right-4 text-emerald-200/60 hover:text-white transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="font-headline text-base font-extrabold uppercase tracking-wider text-[#00ffc8] mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00ffc8]" />
            <span>Share a New Scenic Route</span>
          </h2>
          <p className="text-[12px] text-emerald-200/70 font-medium mb-4">
            {fromSession
              ? "Distance, elevation and time are filled in from your session — just add the details."
              : "Tell the community about a route worth walking."}
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Trail / Route Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cubbon Park Glasshouse Circuit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cubbon Park, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  readOnly={fromSession}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] ${
                    fromSession
                      ? "bg-[#00ffc8]/10 border-[#00ffc8]/30 cursor-not-allowed"
                      : "bg-white/5 border-white/10"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Elevation (m)
                </label>
                <input
                  type="number"
                  required
                  readOnly={fromSession}
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] ${
                    fromSession
                      ? "bg-[#00ffc8]/10 border-[#00ffc8]/30 cursor-not-allowed"
                      : "bg-white/5 border-white/10"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                  Est. Duration (min)
                </label>
                <input
                  type="number"
                  required
                  readOnly={fromSession}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ffc8] ${
                    fromSession
                      ? "bg-[#00ffc8]/10 border-[#00ffc8]/30 cursor-not-allowed"
                      : "bg-white/5 border-white/10"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                Route Atmosphere &amp; Review
              </label>
              <textarea
                required
                placeholder="Share details about the terrain, greenery, track quality, or ideal time for this route..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
              />
            </div>

            {/* Route / path photo */}
            <div>
              <label className="block text-[10px] text-emerald-200/80 uppercase font-extrabold mb-1.5">
                Route Path Image
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImagePick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              {pathImage ? (
                <div className="relative rounded-xl overflow-hidden border border-[#00ffc8]/30">
                  <img src={pathImage} alt="Route path preview" className="w-full h-40 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-[10px] font-black uppercase tracking-wider hover:bg-black/85"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setPathImage(null)}
                      className="p-1.5 rounded-lg bg-black/70 text-red-300 hover:bg-black/85"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-[#00ffc8]/35 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.99]"
                >
                  <ImageIcon className="w-6 h-6 text-[#00ffc8]" />
                  <span className="text-[12px] font-black uppercase tracking-wider text-emerald-100">
                    Upload path image
                  </span>
                  <span className="text-[11px] text-emerald-200/60">
                    A map screenshot or a photo from the trail
                  </span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(0,255,200,0.3)]"
            >
              <Send className="w-4 h-4" />
              <span>Post Trail to Feed</span>
            </button>
          </form>
        </div>
      )}

      {/* Feed Cards List */}
      <div className="space-y-8">
        {displayedRoutes.map((route) => {
          const categoryColor = 
            route.category === "Walking" 
              ? "text-[#00ffc8]" 
              : route.category === "Jogging"
              ? "text-[#00e5ff]"
              : "text-[#adff2f]";

          const formatDuration = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return h > 0 ? `${h}:${m.toString().padStart(2, "0")}h` : `${m}m`;
          };

          return (
            <article
              key={route.id}
              className="group relative bg-[#041a14]/90 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#00ffc8]/20 transition-all duration-300 hover:translate-y-[-4px] hover:border-[#00ffc8]/40"
            >
              {/* Image Banner */}
              <div className="relative h-64 w-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${route.image}')` }}
                />
                <div className="absolute inset-0 scenic-gradient" />

                {/* Rating Overlay */}
                <div className="absolute top-4 right-4 glass-panel px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg border-[#00ffc8]/30">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-current" />
                  <span className="font-headline font-bold text-xs text-white">{route.rating}</span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-[#041a14]/85 border border-[#00ffc8]/30 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-black text-[#00ffc8]">
                  {route.category}
                </div>

                {/* Lower Title Overlay — sits on the dark image scrim, so its
                    text stays light in both themes (see .on-image in index.css) */}
                <div className="on-image absolute bottom-4 left-4 right-4">
                  <h2 className="font-headline text-2xl font-black text-white drop-shadow-lg tracking-tight uppercase italic leading-tight">
                    {route.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#00ffc8] font-bold uppercase tracking-widest mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#00ffc8]" />
                    <span>{route.location}</span>
                  </div>
                </div>
              </div>

              {/* Specs & Review */}
              <div className="p-5 space-y-5">
                {/* 3-Column Stats */}
                <div className="grid grid-cols-3 gap-4 bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-200/60 uppercase font-black tracking-wider">
                      Distance
                    </span>
                    <span className={`font-headline text-xl font-black ${categoryColor}`}>
                      {route.distanceKm}
                      <span className="text-xs font-medium text-emerald-200/70 ml-0.5">km</span>
                    </span>
                  </div>

                  <div className="flex flex-col border-x border-white/10 px-4">
                    <span className="text-[10px] text-emerald-200/60 uppercase font-black tracking-wider">
                      Elev. Gain
                    </span>
                    <span className="font-headline text-xl font-black text-[#00e5ff]">
                      {route.elevationGainM}
                      <span className="text-xs font-medium text-cyan-200/70 ml-0.5">m</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-200/60 uppercase font-black tracking-wider">
                      Est. Time
                    </span>
                    <span className="font-headline text-xl font-black text-white">
                      {formatDuration(route.estimatedTimeMin)}
                    </span>
                  </div>
                </div>

                {/* Review Testimonial */}
                <div className="flex gap-3.5 items-start bg-black/30 p-4 rounded-xl border border-white/5">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 border border-[#00ffc8]/30"
                    style={{ backgroundImage: `url('${route.author.avatar}')` }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-xs font-extrabold text-white">{route.author.name}</span>
                      <span className="text-[10px] text-emerald-200/50">{route.reviewTime}</span>
                    </div>
                    <p className="text-xs text-emerald-100/90 leading-relaxed italic">
                      "{route.review}"
                    </p>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleLike(route.id)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all px-3 py-1.5 rounded-lg border ${
                      userLiked[route.id]
                        ? "text-[#00ffc8] bg-[#00ffc8]/15 border-[#00ffc8]/30"
                        : "text-emerald-200/60 hover:text-white border-transparent"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${userLiked[route.id] ? "fill-current" : ""}`} />
                    <span>{likes[route.id] || 0} Trail Likes</span>
                  </button>

                  <button
                    onClick={() => onSelectRoute(route)}
                    className="bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline text-[11px] uppercase font-black px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,255,200,0.25)] hover:opacity-90 active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Explore Route</span>
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
