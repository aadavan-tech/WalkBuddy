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
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-gray-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-black" />
        <span>Back to Posts</span>
      </button>

      <div className="relative h-72">
        <img src={trail?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"} alt={trail?.name || post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        <div className="absolute left-4 top-4"> <VisibilityBadge visibility={post.visibility} /> </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-headline text-3xl font-black uppercase italic text-white drop-shadow-md">{trail?.name || post.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-white/90">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>{trail?.location || "Trail location pending"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:divide-x md:divide-black/20">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-black mb-3">
            <CalendarClock className="w-3.5 h-3.5 text-black" />
            <span>Run Details</span>
          </div>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-center justify-between"><span>Creator</span><span className="font-bold text-[var(--wb-text)]">{post.creator_name || "Loop Member"}</span></div>
            <div className="flex items-center justify-between"><span>Scheduled</span><span className="font-bold text-[var(--wb-text)]">{formatDate(post.scheduled_at)}</span></div>
            <div className="flex items-center justify-between"><span>Visibility</span><span className="font-bold text-[var(--wb-text)]">{post.visibility}</span></div>
            <div className="flex items-center justify-between"><span>Distance</span><span className="font-bold text-[var(--wb-text)]">{trail?.distanceKm ?? "—"} km</span></div>
            <div className="flex items-center justify-between"><span>Elevation</span><span className="font-bold text-[var(--wb-text)]">{trail?.elevationGainM ?? "—"} m</span></div>
            <div className="flex items-center justify-between"><span>TIME</span><span className="font-bold text-[var(--wb-text)]">{trail?.estimatedTimeMin ?? "—"} min</span></div>
          </div>
        </div>

        <div className="md:pl-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-black mb-3">
            <Users className="w-3.5 h-3.5 text-black" />
            <span>Community Plan</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-700">{post.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ReactionButtons userReaction={userReaction} interestedCount={interestedCount} onReact={onReact} />
            <button type="button" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-gray-600 hover:text-black transition-colors">
              <Navigation className="w-3.5 h-3.5 text-black" />
              <span>View Route</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] pt-2 border-t border-black/20">
        <div className="pt-6">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-black">Interactive Map</div>
          <div className="bg-cover bg-center p-3" style={{ backgroundImage: `url('${trail?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"}')` }}>
            <div className="bg-black/70 p-4 text-xs text-white/90">
              <div className="flex items-center gap-2 text-white font-black uppercase tracking-[0.2em]"><MapPin className="w-3.5 h-3.5 text-white" /> <span>{trail?.location || "Map preview"}</span></div>
              <div className="mt-2">This route is reused from the existing trail catalog so the post stays lightweight and references the original path instead of duplicating it.</div>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-5">
          <InterestedList interestedCount={interestedCount} users={[]} />
          <div className="text-xs text-gray-700">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-black mb-2">Future placeholders</div>
            <div className="space-y-1"><div>Comments</div><div>Start Group Run</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
