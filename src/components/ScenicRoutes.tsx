import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, ThumbsUp, Plus, Send, X, Compass, Image as ImageIcon, Trash2, CalendarClock, Sparkles, Check, Loader2, RotateCcw } from "lucide-react";
import { Route } from "../types";
import { uploadImage } from "../lib/storage";
import { rephraseText } from "../lib/aiRephrase";

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
  onPostRoute: (newRoute: Omit<Route, "id">) => Route | void;
  currentUserName?: string;
  showPostForm: boolean;
  onClosePostForm: () => void;
  onOpenPostForm?: () => void;
  onScheduleTrail?: (route: Route) => void;
  /** When set, distance/elevation/time come from a completed session. */
  prefill?: TrailPrefill | null;
  /** Signed-in user id — namespaces uploads in Supabase Storage. */
  userId?: string;
  onNotify?: (message: string, tone?: "success" | "info" | "warn") => void;
}

export default function ScenicRoutes({
  routes,
  onSelectRoute,
  onPostRoute,
  showPostForm,
  onClosePostForm,
  onOpenPostForm,
  onScheduleTrail,
  prefill,
  userId,
  currentUserName,
  onNotify,
}: ScenicRoutesProps) {
  const [activeTab, setActiveTab] = useState<"Latest Feeds" | "For You" | "All">("Latest Feeds");

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
  // "Generate with AI" state for the description box (local model, accept/reject).
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  /** AI suggestion awaiting accept/reject; null when there's nothing pending. */
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiMeta, setAiMeta] = useState<{ device: string; tookMs: number } | null>(null);

  const handleGenerateWithAI = async () => {
    const source = review.trim();
    if (!source) {
      setAiError("Write a short description first, then let AI polish it.");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setAiSuggestion(null);
    try {
      const result = await rephraseText(source);
      if (result.rephrased && result.rephrased !== source) {
        setAiSuggestion(result.rephrased);
        setAiMeta({ device: result.device, tookMs: result.took_ms });
      } else {
        setAiError("The model returned the same text — try adding a bit more detail.");
      }
    } catch (err: any) {
      setAiError(err?.message || "Could not reach the AI server.");
    } finally {
      setAiBusy(false);
    }
  };

  const acceptAiSuggestion = () => {
    if (aiSuggestion) setReview(aiSuggestion);
    setAiSuggestion(null);
    setAiMeta(null);
  };

  const rejectAiSuggestion = () => {
    setAiSuggestion(null);
    setAiMeta(null);
  };
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

  const [uploadingImage, setUploadingImage] = useState(false);

  /** Uploads the picked file to Supabase Storage and keeps the public URL. */
  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadImage(file, "trail-images", userId);
      setPathImage(res.url);
      if (res.fallback) {
        onNotify?.("Saved locally — image upload unavailable", "warn");
      }
    } catch (err: any) {
      onNotify?.(err?.message || "Could not use that image", "warn");
    } finally {
      setUploadingImage(false);
    }
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

    const createdRoute = onPostRoute({
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

    if (createdRoute && onScheduleTrail) {
      onNotify?.("Trail created — you can now schedule a post for it.", "success");
      onScheduleTrail(createdRoute);
    }

    setName("");
    setLocation("");
    setReview("");
    setPathImage(null);
    onClosePostForm();
  };

  const displayedRoutes = routes.filter((route) => {
    if (activeTab === "All") return true;
    if (activeTab === "For You") {
      if (!currentUserName) return true;
      return route.author.name.toLowerCase() === currentUserName.toLowerCase();
    }
    return true;
  });

  return (
    <div className="w-full space-y-8 max-w-3xl mx-auto pb-12">
      {/* Header — plain type on the page background, no card */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/30">
        <div className="space-y-1.5">
          <h1 className="font-headline text-4xl md:text-5xl font-black text-[var(--wb-text)] italic tracking-tight uppercase leading-none">
            Scenic Routes
          </h1>
          <p className="text-sm text-gray-500 text-accent-serif max-w-md">
            Popular walking, jogging, and outdoor routes shared by the community
          </p>
        </div>
        {!showPostForm && onOpenPostForm && (
          <button
            onClick={onOpenPostForm}
            className="shrink-0 inline-flex items-center gap-1.5 border border-black px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Trail</span>
          </button>
        )}
      </div>

      {/* Filter Tabs — text, underlined, matches the top nav's own convention */}
      <div className="flex gap-7 overflow-x-auto no-scrollbar max-w-full">
        {["All", "Walking", "Jogging", "Sprinting"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 -mb-px border-b-2 text-xs font-black uppercase tracking-wider transition-colors shrink-0 whitespace-nowrap ${
              activeTab === tab
                ? "text-black border-black"
                : "text-gray-400 border-transparent hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Post Route Form */}
      {showPostForm && (
        <div className="p-6 relative overflow-hidden border border-black/30 animate-fadeIn">
          <button
            onClick={onClosePostForm}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-transform"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          <h2 className="font-headline text-base font-extrabold uppercase tracking-wider text-[var(--wb-text)] mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-black" />
            <span>Share a New Scenic Route</span>
          </h2>
          <p className="text-[12px] text-slate-600 font-medium mb-4">
            {fromSession
              ? "Distance, elevation and time are filled in from your session — just add the details."
              : "Tell the community about a route worth walking."}
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Trail / Route Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cubbon Park Glasshouse Circuit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--wb-line)] rounded-xl px-3 py-2.5 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cubbon Park, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--wb-line)] rounded-xl px-3 py-2.5 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white/5 border border-[var(--wb-line)] rounded-xl px-3 py-2 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  readOnly={fromSession}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black ${
                    fromSession
                      ? "bg-black/5 border-black/15 cursor-not-allowed"
                      : "bg-white/5 border-[var(--wb-line)]"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Elevation (m)
                </label>
                <input
                  type="number"
                  required
                  readOnly={fromSession}
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black ${
                    fromSession
                      ? "bg-black/5 border-black/15 cursor-not-allowed"
                      : "bg-white/5 border-[var(--wb-line)]"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
                  Est. Duration (min)
                </label>
                <input
                  type="number"
                  required
                  readOnly={fromSession}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black ${
                    fromSession
                      ? "bg-black/5 border-black/15 cursor-not-allowed"
                      : "bg-white/5 border-[var(--wb-line)]"
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] text-slate-600 uppercase font-extrabold">
                  Route Atmosphere &amp; Review
                </label>
                {/* Generate with AI — polishes the description via the local model */}
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={aiBusy}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-black/40 bg-black/5 text-[var(--wb-text)] hover:bg-black/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rephrase with the local AI model"
                >
                  {aiBusy ? (
                    <Loader2 className="w-3 h-3 animate-spin text-black" />
                  ) : (
                    <Sparkles className="w-3 h-3 fill-current text-black" />
                  )}
                  <span>{aiBusy ? "Generating…" : "Generate with AI"}</span>
                </button>
              </div>
              <textarea
                required
                placeholder="Share details about the terrain, greenery, track quality, or ideal time for this route..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-[var(--wb-line)] rounded-xl px-3 py-2 text-xs text-[var(--wb-text)] focus:outline-none focus:border-black"
              />

              {aiError && (
                <p className="text-[10px] text-red-600 font-semibold mt-1.5 leading-relaxed">
                  {aiError}
                </p>
              )}

              {/* AI suggestion — accept to replace, reject to keep the original */}
              {aiSuggestion && (
                <div className="mt-2 rounded-xl border border-black/15 bg-black/[0.03] overflow-hidden animate-fadeIn">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-black/30 bg-black/5">
                    <Sparkles className="w-3 h-3 text-black fill-current" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--wb-text)]">
                      AI Suggestion
                    </span>
                    {aiMeta && (
                      <span className="ml-auto text-[9px] text-slate-500 font-mono">
                        {aiMeta.device} · {aiMeta.tookMs}ms
                      </span>
                    )}
                  </div>
                  <p className="px-3 py-2.5 text-xs text-[var(--wb-text)] leading-relaxed">
                    {aiSuggestion}
                  </p>
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      type="button"
                      onClick={acceptAiSuggestion}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-black text-white active:scale-95 transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                      <span>Use this</span>
                    </button>
                    <button
                      type="button"
                      onClick={rejectAiSuggestion}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--wb-line)] text-[var(--wb-text)] hover:bg-black/5 active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-black" />
                      <span>Keep mine</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={aiBusy}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--wb-line)] text-slate-600 hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50"
                      title="Generate another version"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-black" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Route / path photo */}
            <div>
              <label className="block text-[10px] text-slate-600 uppercase font-extrabold mb-1.5">
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
                <div className="relative rounded-xl overflow-hidden border border-[var(--wb-line)]">
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
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black/85"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-[var(--wb-line)] bg-white/5 hover:bg-white/10 transition-all active:scale-[0.99]"
                >
                  <ImageIcon className="w-6 h-6 text-black" />
                  <span className="text-[12px] font-black uppercase tracking-wider text-[var(--wb-text)]">
                    {uploadingImage ? "Uploading…" : "Upload path image"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    A map screenshot or a photo from the trail
                  </span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={uploadingImage}
              className="w-full bg-black text-white font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
              <span>{uploadingImage ? "Uploading image…" : "Post Trail to Feed"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Feed — a divided list of full-bleed articles, not a stack of cards */}
      <div className="divide-y divide-black/15">
        {displayedRoutes.map((route) => {
          const formatDuration = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return h > 0 ? `${h}:${m.toString().padStart(2, "0")}h` : `${m}m`;
          };

          return (
            <article key={route.id} className="group py-10 first:pt-0">
              {/* Image — full-bleed, sharp corners */}
              <div className="relative h-64 w-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${route.image}')` }}
                />
                <div className="absolute inset-0 scenic-gradient" />

                <div className="absolute top-4 left-4 bg-black/80 px-2.5 py-1 text-[11px] uppercase tracking-widest font-black text-white">
                  {route.category}
                </div>

                <div className="on-image absolute bottom-4 left-4 right-4">
                  <h2 className="font-headline text-2xl font-black text-white drop-shadow-lg tracking-tight uppercase italic leading-tight">
                    {route.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-white font-bold uppercase tracking-widest mt-1">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                    <span>{route.location}</span>
                  </div>
                </div>
              </div>

              {/* Specs & Review — plain composition, no boxed sub-cards */}
              <div className="pt-5 space-y-5">
                <div className="grid grid-cols-3 divide-x divide-black/20">
                  <div className="pr-4">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
                      Distance
                    </div>
                    <div className="font-headline text-xl font-black text-[var(--wb-text)]">
                      {route.distanceKm}
                      <span className="text-xs font-bold text-gray-500 ml-0.5">km</span>
                    </div>
                  </div>

                  <div className="px-4">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
                      Elev. Gain
                    </div>
                    <div className="font-headline text-xl font-black text-[var(--wb-text)]">
                      {route.elevationGainM}
                      <span className="text-xs font-bold text-gray-500 ml-0.5">m</span>
                    </div>
                  </div>

                  <div className="pl-4">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
                      TIME
                    </div>
                    <div className="font-headline text-xl font-black text-[var(--wb-text)]">
                      {formatDuration(route.estimatedTimeMin)}
                    </div>
                  </div>
                </div>

                {/* Review — a pull-quote, not a bordered testimonial box */}
                <div className="flex gap-3.5 items-start border-t border-black/15 pt-4">
                  <div
                    className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 border border-black/20"
                    style={{ backgroundImage: `url('${route.author.avatar}')` }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-xs font-black text-[var(--wb-text)]">{route.author.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold">{route.reviewTime}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed italic font-medium">
                      "{route.review}"
                    </p>
                  </div>
                </div>

                {/* Action Row — like + rate */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-black/15">
                  <button
                    onClick={() => handleLike(route.id)}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                      userLiked[route.id]
                        ? "text-[var(--wb-text)]"
                        : "text-gray-500 hover:text-[var(--wb-text)]"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 text-black ${userLiked[route.id] ? "fill-current" : ""}`} />
                    <span>{likes[route.id] || 0} Trail Likes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onScheduleTrail?.(route)}
                    className="inline-flex items-center gap-2 border border-black bg-black px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
                  >
                    <CalendarClock className="w-4 h-4 text-white" />
                    <span>Use for Post</span>
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
