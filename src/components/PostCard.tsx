import { CalendarClock, MapPin, TimerReset, Mountain, Navigation, UserCircle2 } from "lucide-react";
import type { Post, Route } from "../types";
import VisibilityBadge from "./VisibilityBadge";
import ReactionButtons from "./ReactionButtons";

interface PostCardProps {
  post: Post & { creator_name?: string | null; creator_avatar?: string | null; trail?: Route | null };
  onOpenDetails: (postId: string) => void;
  onReact: (postId: string, reaction: "INTERESTED" | "NOT_INTERESTED") => void;
  userReaction: "INTERESTED" | "NOT_INTERESTED" | null;
  interestedCount: number;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function PostCard({ post, onOpenDetails, onReact, userReaction, interestedCount }: PostCardProps) {
  const route = post.trail;
  const createdBy = post.creator_name || "Loop Member";
  const createdAvatar = post.creator_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  return (
    <article>
      <div className="relative h-56 overflow-hidden">
        <img src={route?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"} alt={route?.name || post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <VisibilityBadge visibility={post.visibility} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
          <h3 className="font-headline text-2xl font-black uppercase italic text-white drop-shadow-md">{route?.name || post.title}</h3>
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>{route?.location || "Trail location pending"}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src={createdAvatar} alt={createdBy} referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover border border-black/20" />
            <div>
              <div className="font-headline text-xs font-black uppercase text-[var(--wb-text)]">{createdBy}</div>
              <div className="text-[10px] text-gray-500">{formatDate(post.created_at)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--wb-text)] border-b border-black/40 hover:border-black transition-colors"
          >
            View Post
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/15">
          <div className="pr-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Distance</div>
            <div className="font-headline text-lg font-black text-black">{route?.distanceKm ?? "—"}<span className="text-[10px] ml-1 text-gray-500 font-bold">km</span></div>
          </div>
          <div className="px-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Elevation</div>
            <div className="font-headline text-lg font-black text-black">{route?.elevationGainM ?? "—"}<span className="text-[10px] ml-1 text-gray-500 font-bold">m</span></div>
          </div>
          <div className="px-3 pt-2 sm:pt-0">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">TIME</div>
            <div className="font-headline text-lg font-black text-black">{route?.estimatedTimeMin ?? "—"}<span className="text-[10px] ml-1 text-gray-500 font-bold">min</span></div>
          </div>
          <div className="pl-3 pt-2 sm:pt-0">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Scheduled</div>
            <div className="font-headline text-xs font-black text-black">{formatDate(post.scheduled_at)}</div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-gray-700 font-medium border-t border-black/15 pt-3">
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <ReactionButtons userReaction={userReaction} interestedCount={interestedCount} onReact={(reaction) => onReact(post.id, reaction)} />
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-black transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-black" />
            <span>View Trail</span>
          </button>
        </div>
      </div>
    </article>
  );
}
