import { ArrowLeft, CalendarClock, Clock3, Eye, MapPin, Mountain, Navigation, Users } from "lucide-react";
import type { Post, Route } from "../types";
import InterestedList from "./InterestedList";
import ReactionButtons from "./ReactionButtons";
import VisibilityBadge from "./VisibilityBadge";

interface PostDetailsViewProps {
  post: (Post & { creator_name?: string | null; creator_avatar?: string | null; trail?: Route | null }) | null;
  interestedCount: number;
  userReaction: "INTERESTED" | "NOT_INTERESTED" | null;
  onBack: () => void;
  onReact: (reaction: "INTERESTED" | "NOT_INTERESTED") => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function PostDetailsView({ post, interestedCount, userReaction, onBack, onReact }: PostDetailsViewProps) {
  if (!post) return null;

  const trail = post.trail;

  return (
    <div className="space-y-5 rounded-[28px] border border-[#d2a649]/20 bg-[#181f1b]/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] md:p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100/80"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Posts</span>
      </button>

      <div className="overflow-hidden rounded-[28px] border border-[#d2a649]/20">
        <div className="relative h-72">
          <img src={trail?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"} alt={trail?.name || post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121614] via-transparent to-transparent" />
          <div className="absolute left-4 top-4"> <VisibilityBadge visibility={post.visibility} /> </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-headline text-3xl font-black uppercase italic text-white">{trail?.name || post.title}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#d2a649]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{trail?.location || "Trail location pending"}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#d2a649]">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Run Details</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-amber-100/85">
              <div className="flex items-center justify-between"><span>Creator</span><span className="font-bold text-white">{post.creator_name || "WalkBuddy Member"}</span></div>
              <div className="flex items-center justify-between"><span>Scheduled</span><span className="font-bold text-white">{formatDate(post.scheduled_at)}</span></div>
              <div className="flex items-center justify-between"><span>Visibility</span><span className="font-bold text-white">{post.visibility}</span></div>
              <div className="flex items-center justify-between"><span>Distance</span><span className="font-bold text-white">{trail?.distanceKm ?? "—"} km</span></div>
              <div className="flex items-center justify-between"><span>Elevation</span><span className="font-bold text-white">{trail?.elevationGainM ?? "—"} m</span></div>
              <div className="flex items-center justify-between"><span>TIME</span><span className="font-bold text-white">{trail?.estimatedTimeMin ?? "—"} min</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#f0d58c]">
              <Users className="w-3.5 h-3.5" />
              <span>Community Plan</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-amber-100/80">{post.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ReactionButtons userReaction={userReaction} interestedCount={interestedCount} onReact={onReact} />
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100/80">
                <Navigation className="w-3.5 h-3.5" />
                <span>View Route</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#d2a649]">Interactive Map</div>
          <div className="rounded-2xl border border-[#d2a649]/20 bg-cover bg-center p-3" style={{ backgroundImage: `url('${trail?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"}')` }}>
            <div className="rounded-2xl border border-white/10 bg-[#121614]/70 p-4 text-xs text-amber-100/85">
              <div className="flex items-center gap-2 text-[#d2a649] font-black uppercase tracking-[0.2em]"><MapPin className="w-3.5 h-3.5" /> <span>{trail?.location || "Map preview"}</span></div>
              <div className="mt-2">This route is reused from the existing trail catalog so the post stays lightweight and references the original path instead of duplicating it.</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <InterestedList interestedCount={interestedCount} users={[]} />
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-amber-100/80">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f0d58c]">Future placeholders</div>
            <div className="mt-2 space-y-2"><div>Comments</div><div>Start Group Run</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
