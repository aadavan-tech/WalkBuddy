import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock3, MapPinned, X, Eye, Shield, Compass, ImagePlus, Upload, Check } from "lucide-react";
import type { PostVisibility, Route } from "../types";
import { uploadImage } from "../lib/storage";
import DatePicker from "./DatePicker";

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
    trailId?: string;
    trailDraft?: Omit<Route, "id">;
  }) => void;
}

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const toHourMinuteValue = (value: Date) => {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")}`;
};
const toMeridiemValue = (value: Date): "AM" | "PM" => (value.getHours() >= 12 ? "PM" : "AM");

const parseScheduledTime = (hourMinute: string, meridiem: "AM" | "PM") => {
  const [hourRaw, minuteRaw] = hourMinute.trim().split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  let hours = hour % 12;
  if (meridiem === "PM") hours += 12;
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-[var(--wb-line)] bg-[#f8f1e3] px-3 py-2 text-xs text-[var(--wb-text)] outline-none focus:border-black";
const labelClass = "block text-[10px] font-black uppercase tracking-[0.24em] text-gray-600";

export default function PostModal({ isOpen, route, routes = [], userId, onClose, onPublish }: PostModalProps) {
  const [trailMode, setTrailMode] = useState<"existing" | "custom">("existing");
  const [selectedTrailId, setSelectedTrailId] = useState(route?.id ?? routes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => toDateInputValue(new Date()));
  const [scheduledHourMinute, setScheduledHourMinute] = useState(() => toHourMinuteValue(new Date()));
  const [scheduledMeridiem, setScheduledMeridiem] = useState<"AM" | "PM">(() => toMeridiemValue(new Date()));
  const [visibility, setVisibility] = useState<PostVisibility | null>(null);
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
    const normalizedTime = parseScheduledTime(scheduledHourMinute, scheduledMeridiem);
    if (!normalizedTime) return null;
    const asDate = new Date(`${scheduledDate}T${normalizedTime}`);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }, [scheduledDate, scheduledHourMinute, scheduledMeridiem]);

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

    if (!title.trim() || !scheduledDate || !scheduledHourMinute) {
      setError("Title, date, and time are all required.");
      return;
    }

    if (!visibility) {
      setError("Choose Public or Private before publishing this post.");
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
        trailId: selectedRoute.id,
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
          review: trailReview.trim() || "Custom trail shared by the Loop community.",
          reviewTime: "Just now",
          lat: 50 + Math.random() * 20,
          lng: 40 + Math.random() * 20,
        },
      });
    }

    setTitle("");
    setDescription("");
    setError(null);
    setVisibility(null);
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden border border-black/30 bg-[var(--wb-surface)] shadow-2xl text-[var(--wb-text)]">
        <div className="flex items-center justify-between border-b border-black/20 px-5 py-4">
          <div>
            <h2 className="font-headline text-lg font-black uppercase tracking-[0.22em] text-black">Create Post</h2>
            <div className="text-[11px] text-gray-500">Schedule a future run using an existing trail or a custom trail.</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-black transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:grid-cols-[1.05fr_1fr]">
          <div className="space-y-4 border-t border-black/20 pt-4 md:border-t-0 md:border-r md:pr-4 md:pt-0">
            <div className="font-headline text-sm font-black uppercase tracking-[0.2em] text-black">Trail Snapshot</div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--wb-line)] bg-black/5 p-1">
              {(["existing", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrailMode(mode)}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${
                    trailMode === mode
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:bg-black/5"
                  }`}
                >
                  {mode === "existing" ? "Existing Trail" : "Custom Trail"}
                </button>
              ))}
            </div>

            {trailMode === "existing" ? (
              <div className="space-y-3">
                <label className={labelClass}>
                  Select Feed Trail
                  <select
                    value={selectedTrailId}
                    onChange={(e) => setSelectedTrailId(e.target.value)}
                    className={fieldClass}
                  >
                    {optionRoutes.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                {selectedRoute ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-[var(--wb-line)]">
                      <img src={selectedRoute.image} alt={selectedRoute.name} referrerPolicy="no-referrer" className="h-44 w-full object-cover" />
                    </div>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex items-center gap-2"> <Compass className="w-3.5 h-3.5 text-black" /> <span className="font-bold text-[var(--wb-text)]">{selectedRoute.name}</span></div>
                      <div className="flex items-center gap-2"> <MapPinned className="w-3.5 h-3.5 text-black" /> <span>{selectedRoute.location}</span></div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                        <div className="rounded-xl border border-[var(--wb-line)] bg-black/5 p-2"><div className="text-[9px] text-gray-500 uppercase">Distance</div><div className="font-headline text-lg font-bold text-black">{selectedRoute.distanceKm}km</div></div>
                        <div className="rounded-xl border border-[var(--wb-line)] bg-black/5 p-2"><div className="text-[9px] text-gray-500 uppercase">Elevation</div><div className="font-headline text-lg font-bold text-black">{selectedRoute.elevationGainM}m</div></div>
                        <div className="rounded-xl border border-[var(--wb-line)] bg-black/5 p-2"><div className="text-[9px] text-gray-500 uppercase">TIME</div><div className="font-headline text-lg font-bold text-[var(--wb-text)]">{selectedRoute.estimatedTimeMin}m</div></div>
                        <div className="rounded-xl border border-[var(--wb-line)] bg-black/5 p-2"><div className="text-[9px] text-gray-500 uppercase">Category</div><div className="font-headline text-lg font-bold text-black">{selectedRoute.category}</div></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--wb-line)] bg-black/5 p-4 text-xs text-gray-500">No trail selected.</div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>
                    Trail Name
                    <input value={trailName} onChange={(e) => setTrailName(e.target.value)} className={fieldClass} />
                  </label>
                  <label className={labelClass}>
                    Location
                    <input value={trailLocation} onChange={(e) => setTrailLocation(e.target.value)} className={fieldClass} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className={labelClass}>
                    Category
                    <select value={trailCategory} onChange={(e) => setTrailCategory(e.target.value as Route["category"])} className={fieldClass}>
                      <option value="Walking">Walking</option>
                      <option value="Jogging">Jogging</option>
                      <option value="Sprinting">Sprinting</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Distance (km)
                    <input value={trailDistanceKm} onChange={(e) => setTrailDistanceKm(e.target.value)} className={fieldClass} />
                  </label>
                  <label className={labelClass}>
                    Elevation (m)
                    <input value={trailElevationGainM} onChange={(e) => setTrailElevationGainM(e.target.value)} className={fieldClass} />
                  </label>
                  <label className={labelClass}>
                    Time (min)
                    <input value={trailEstimatedTimeMin} onChange={(e) => setTrailEstimatedTimeMin(e.target.value)} className={fieldClass} />
                  </label>
                </div>
                <label className={labelClass}>
                  Review
                  <textarea value={trailReview} onChange={(e) => setTrailReview(e.target.value)} rows={3} className={fieldClass} />
                </label>
                <div className="rounded-2xl border border-dashed border-[var(--wb-line)] bg-black/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-600">Trail Images</span>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-black border border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                      <Upload className="w-3.5 h-3.5 text-white" />
                      Upload
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleCustomImageUpload(e.target.files); e.target.value = ""; }} />
                  <div className="text-[10px] text-gray-500">Upload at least 5 images from your device to publish this custom trail.</div>
                  {customImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {customImages.map((url, index) => (
                        <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border border-[var(--wb-line)]">
                          <img src={url} alt={`Custom trail preview ${index + 1}`} referrerPolicy="no-referrer" className="h-20 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadingImages && <div className="mt-2 text-[10px] font-bold text-black">Uploading trail photos…</div>}
                  {customImages.length > 0 && customImages.length < 5 && (
                    <div className="mt-2 text-[10px] font-bold text-gray-600">Need {5 - customImages.length} more image{5 - customImages.length === 1 ? "" : "s"} to publish.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className={labelClass}>
              Run Title
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
            </label>

            <label className={labelClass}>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={fieldClass} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelClass}>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-black" /> Scheduled Date</span>
                <DatePicker value={scheduledDate} onChange={setScheduledDate} className="mt-1" />
              </div>
              <div className={labelClass}>
                <span className="flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-black" /> Scheduled Time</span>
                <div className="mt-1 flex gap-1.5">
                  <input
                    required
                    type="text"
                    value={scheduledHourMinute}
                    onChange={(e) => setScheduledHourMinute(e.target.value)}
                    className={`${fieldClass} mt-0 flex-1 min-w-0`}
                    placeholder="1:30"
                  />
                  <div className="flex shrink-0 rounded-xl border border-[var(--wb-line)] bg-[#f8f1e3] p-1 gap-1">
                    {(["AM", "PM"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setScheduledMeridiem(option)}
                        aria-pressed={scheduledMeridiem === option}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide transition-colors ${
                          scheduledMeridiem === option
                            ? "bg-black text-white"
                            : "text-gray-500 hover:text-black"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-gray-600">
                <span>Visibility</span>
                <span className="text-black">*</span>
                <span className="normal-case tracking-normal font-bold text-gray-400">(required — no default)</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["PUBLIC", "PRIVATE"] as PostVisibility[]).map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs text-[var(--wb-text)] transition-all ${
                      visibility === option
                        ? "border-black bg-black/10"
                        : "border-[var(--wb-line)] bg-black/5"
                    }`}
                  >
                    <input type="radio" name="visibility" checked={visibility === option} onChange={() => setVisibility(option)} />
                    <span className="inline-flex items-center gap-1.5">
                      {option === "PUBLIC" ? <Eye className="w-3.5 h-3.5 text-black" /> : <Shield className="w-3.5 h-3.5 text-black" />}
                      {option}
                    </span>
                  </label>
                ))}
              </div>
              {!visibility && (
                <div className="mt-1.5 text-[10px] font-bold text-gray-600">Select Public or Private to enable publishing.</div>
              )}
            </div>

            {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-700">{error}</div>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!visibility}
                className="flex-1 rounded-xl bg-black text-white hover:opacity-90 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
              >
                Publish
              </button>
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[var(--wb-line)] bg-[#f8f1e3] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--wb-text)] hover:bg-black/5 transition-all">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
