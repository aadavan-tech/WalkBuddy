import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock3, MapPinned, X, Eye, Shield, Compass, ImagePlus, Upload, Check } from "lucide-react";
import type { PostVisibility, Route } from "../types";
import { uploadImage } from "../lib/storage";

interface PostModalProps {
  isOpen: boolean;
  route: Route | null;
  routes?: Route[];
  userId?: string;
  onClose: () => void;
  onPublish: (payload: {
    title: string;
    description: string;
    scheduled_at: string;
    visibility: PostVisibility;
    trailDraft?: Omit<Route, "id">;
  }) => void;
}

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const toTimeInputValue = (value: Date) => {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const meridiem = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
};

const parseScheduledTime = (value: string) => {
  const [rawTime, meridiem] = value.trim().split(/\s+/);
  if (!rawTime || !meridiem) return null;
  const [hourRaw, minuteRaw] = rawTime.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  let hours = hour % 12;
  if (meridiem.toUpperCase() === "PM") hours += 12;
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export default function PostModal({ isOpen, route, routes = [], userId, onClose, onPublish }: PostModalProps) {
  const [trailMode, setTrailMode] = useState<"existing" | "custom">("existing");
  const [selectedTrailId, setSelectedTrailId] = useState(route?.id ?? routes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => toDateInputValue(new Date()));
  const [scheduledTime, setScheduledTime] = useState(() => toTimeInputValue(new Date()));
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [trailName, setTrailName] = useState("");
  const [trailLocation, setTrailLocation] = useState("");
  const [trailCategory, setTrailCategory] = useState<Route["category"]>("Walking");
  const [trailDistanceKm, setTrailDistanceKm] = useState("5.8");
  const [trailElevationGainM, setTrailElevationGainM] = useState("180");
  const [trailEstimatedTimeMin, setTrailEstimatedTimeMin] = useState("50");
  const [trailReview, setTrailReview] = useState("");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dateTime = useMemo(() => {
    const normalizedTime = parseScheduledTime(scheduledTime);
    if (!normalizedTime) return null;
    const asDate = new Date(`${scheduledDate}T${normalizedTime}`);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }, [scheduledDate, scheduledTime]);

  const optionRoutes = routes.length ? routes : route ? [route] : [];
  const selectedRoute = optionRoutes.find((item) => item.id === selectedTrailId) ?? route;

  useEffect(() => {
    if (route?.id) {
      setSelectedTrailId(route.id);
    }
  }, [route?.id]);

  if (!isOpen) return null;

  const handleCustomImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const pending = Array.from(files);
    if (pending.length < 5) {
      setError("Please upload at least 5 trail images before publishing a custom trail.");
      return;
    }

    setUploadingImages(true);
    setError(null);
    try {
      const uploadResults = await Promise.all(
        pending.map((file) => uploadImage(file, "trail-images", userId))
      );
      const nextUrls = uploadResults.map((result) => result.url);
      setCustomImages((prev) => [...prev, ...nextUrls].slice(0, 8));
    } catch (err: any) {
      setError(err?.message || "Could not upload those trail images.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !scheduledDate || !scheduledTime || !visibility) {
      setError("Title, date, time, and visibility are all required.");
      return;
    }

    if (!dateTime || dateTime.getTime() <= Date.now() - 1000 * 60) {
      setError("The scheduled date cannot be in the past.");
      return;
    }

    if (trailMode === "existing") {
      if (!selectedRoute) {
        setError("Choose a trail before scheduling a post.");
        return;
      }

      onPublish({
        title: title.trim(),
        description: description.trim() || "Community run scheduled for this trail.",
        scheduled_at: dateTime.toISOString(),
        visibility,
      });
    } else {
      if (!trailName.trim() || !trailLocation.trim()) {
        setError("Please enter both a trail name and location for the custom trail.");
        return;
      }
      if (customImages.length < 5) {
        setError("Please upload at least 5 images before publishing a custom trail.");
        return;
      }

      const firstImage = customImages[0];
      onPublish({
        title: title.trim(),
        description: description.trim() || "Community run scheduled for this trail.",
        scheduled_at: dateTime.toISOString(),
        visibility,
        trailDraft: {
          name: trailName.trim(),
          location: trailLocation.trim(),
          category: trailCategory,
          distanceKm: Number.parseFloat(trailDistanceKm) || 5,
          elevationGainM: Number.parseInt(trailElevationGainM, 10) || 100,
          estimatedTimeMin: Number.parseInt(trailEstimatedTimeMin, 10) || 40,
          rating: 4.9,
          image: firstImage,
          images: customImages,
          author: {
            name: "Trail Explorer",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          },
          review: trailReview.trim() || "Custom trail shared by the WalkBuddy community.",
          reviewTime: "Just now",
          lat: 50 + Math.random() * 20,
          lng: 40 + Math.random() * 20,
        },
      });
    }

    setTitle("");
    setDescription("");
    setError(null);
    setTrailMode("existing");
    setSelectedTrailId(route?.id ?? routes[0]?.id ?? "");
    setTrailName("");
    setTrailLocation("");
    setTrailCategory("Walking");
    setTrailDistanceKm("5.8");
    setTrailElevationGainM("180");
    setTrailEstimatedTimeMin("50");
    setTrailReview("");
    setCustomImages([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#00ffc8]/30 bg-[#041a14]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="font-headline text-lg font-black uppercase tracking-[0.22em] text-[#00ffc8]">Create Post</div>
            <div className="text-[11px] text-emerald-200/70">Schedule a future run using an existing trail or a custom trail.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-emerald-100/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:grid-cols-[1.05fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="font-headline text-sm font-black uppercase tracking-[0.2em] text-[#00e5ff]">Trail Snapshot</div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              {(["existing", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrailMode(mode)}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                    trailMode === mode
                      ? "bg-[#00ffc8] text-black"
                      : "text-emerald-200/75 hover:bg-white/5"
                  }`}
                >
                  {mode === "existing" ? "Existing Trail" : "Custom Trail"}
                </button>
              ))}
            </div>

            {trailMode === "existing" ? (
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                  Select Feed Trail
                  <select
                    value={selectedTrailId}
                    onChange={(e) => setSelectedTrailId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]"
                  >
                    {optionRoutes.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                {selectedRoute ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-[#00ffc8]/20">
                      <img src={selectedRoute.image} alt={selectedRoute.name} className="h-44 w-full object-cover" />
                    </div>
                    <div className="space-y-1 text-xs text-emerald-100/85">
                      <div className="flex items-center gap-2"> <Compass className="w-3.5 h-3.5 text-[#00ffc8]" /> <span className="font-bold text-white">{selectedRoute.name}</span></div>
                      <div className="flex items-center gap-2"> <MapPinned className="w-3.5 h-3.5 text-[#00e5ff]" /> <span>{selectedRoute.location}</span></div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                        <div className="rounded-xl border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-emerald-200/60 uppercase">Distance</div><div className="font-headline text-lg text-[#00e5ff]">{selectedRoute.distanceKm}km</div></div>
                        <div className="rounded-xl border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-emerald-200/60 uppercase">Elevation</div><div className="font-headline text-lg text-[#adff2f]">{selectedRoute.elevationGainM}m</div></div>
                        <div className="rounded-xl border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-emerald-200/60 uppercase">Est. Time</div><div className="font-headline text-lg text-white">{selectedRoute.estimatedTimeMin}m</div></div>
                        <div className="rounded-xl border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-emerald-200/60 uppercase">Category</div><div className="font-headline text-lg text-[#00ffc8]">{selectedRoute.category}</div></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-xs text-emerald-200/70">No trail selected.</div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-emerald-100/85">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Trail Name
                    <input value={trailName} onChange={(e) => setTrailName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                  </label>
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Location
                    <input value={trailLocation} onChange={(e) => setTrailLocation(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Category
                    <select value={trailCategory} onChange={(e) => setTrailCategory(e.target.value as Route["category"])} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]">
                      <option value="Walking">Walking</option>
                      <option value="Jogging">Jogging</option>
                      <option value="Sprinting">Sprinting</option>
                    </select>
                  </label>
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Distance (km)
                    <input value={trailDistanceKm} onChange={(e) => setTrailDistanceKm(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                  </label>
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Elevation (m)
                    <input value={trailElevationGainM} onChange={(e) => setTrailElevationGainM(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                  </label>
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                    Est. Time (min)
                    <input value={trailEstimatedTimeMin} onChange={(e) => setTrailEstimatedTimeMin(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                  </label>
                </div>
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                  Review
                  <textarea value={trailReview} onChange={(e) => setTrailReview(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
                </label>
                <div className="rounded-2xl border border-dashed border-[#00ffc8]/30 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">Trail Images</span>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#00ffc8]/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#00ffc8]">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleCustomImageUpload(e.target.files); e.target.value = ""; }} />
                  <div className="text-[10px] text-emerald-200/70">Upload at least 5 images from your device to publish this custom trail.</div>
                  {customImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {customImages.map((url, index) => (
                        <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border border-[#00ffc8]/20">
                          <img src={url} alt={`Custom trail preview ${index + 1}`} className="h-20 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadingImages && <div className="mt-2 text-[10px] font-bold text-[#00e5ff]">Uploading trail photos…</div>}
                  {customImages.length > 0 && customImages.length < 5 && (
                    <div className="mt-2 text-[10px] font-bold text-amber-300">Need {5 - customImages.length} more image{5 - customImages.length === 1 ? "" : "s"} to publish.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
              Run Title
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
            </label>

            <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#00ffc8]" /> Scheduled Date</span>
                <input required type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" />
              </label>
              <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                <span className="flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-[#00e5ff]" /> Scheduled Time</span>
                <input required type="text" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#00ffc8]" placeholder="1:30 PM" />
              </label>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">Visibility</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["PUBLIC", "PRIVATE"] as PostVisibility[]).map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white">
                    <input type="radio" name="visibility" checked={visibility === option} onChange={() => setVisibility(option)} />
                    <span className="inline-flex items-center gap-1.5">
                      {option === "PUBLIC" ? <Eye className="w-3.5 h-3.5 text-[#00ffc8]" /> : <Shield className="w-3.5 h-3.5 text-[#00e5ff]" />}
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-100">{error}</div>}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] text-black">Publish</button>
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-100">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

