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
  const createdBy = post.creator_name || "WalkBuddy Member";
  const createdAvatar = post.creator_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  return (
    <article className="overflow-hidden rounded-3xl border border-[var(--wb-line)] dark:border-[#d2a649]/20 bg-[var(--wb-surface)] dark:bg-[#0c130f]/90 shadow-xl backdrop-blur-xl">
      <div className="relative h-56 overflow-hidden">
        <img src={route?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"} alt={route?.name || post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <VisibilityBadge visibility={post.visibility} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
          <div className="font-headline text-2xl font-black uppercase italic text-white drop-shadow-md">{route?.name || post.title}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#f0d58c]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{route?.location || "Trail location pending"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src={createdAvatar} alt={createdBy} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border border-[#b58974]/40 dark:border-[#d2a649]/40" />
            <div>
              <div className="font-headline text-xs font-black uppercase text-[var(--wb-text)] dark:text-white">{createdBy}</div>
              <div className="text-[10px] text-slate-600 dark:text-amber-100/60">{formatDate(post.created_at)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="rounded-full border border-[#b58974]/30 bg-[#b58974]/10 dark:border-[#d2a649]/30 dark:bg-[#d2a649]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#b58974] dark:text-[#d2a649]"
          >
            View Post
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-xl border border-[#b58974]/25 dark:border-white/5 bg-[#ece2cf] dark:bg-black/30 p-2.5 shadow-xs">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#8c5e4a] dark:text-amber-100/60 font-black">Distance</div>
            <div className="font-headline text-lg font-black text-[#b58974] dark:text-[#d2a649]">{route?.distanceKm ?? "—"}<span className="text-[10px] ml-1 text-[#8c5e4a]/80 dark:text-amber-100/70 font-bold">km</span></div>
          </div>
          <div className="rounded-xl border border-[#b58974]/25 dark:border-white/5 bg-[#ece2cf] dark:bg-black/30 p-2.5 shadow-xs">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#8c5e4a] dark:text-amber-100/60 font-black">Elevation</div>
            <div className="font-headline text-lg font-black text-[#b58974] dark:text-[#f0d58c]">{route?.elevationGainM ?? "—"}<span className="text-[10px] ml-1 text-[#8c5e4a]/80 dark:text-amber-100/70 font-bold">m</span></div>
          </div>
          <div className="rounded-xl border border-[#b58974]/25 dark:border-white/5 bg-[#ece2cf] dark:bg-black/30 p-2.5 shadow-xs">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#8c5e4a] dark:text-amber-100/60 font-black">TIME</div>
            <div className="font-headline text-lg font-black text-[#2c2519] dark:text-white">{route?.estimatedTimeMin ?? "—"}<span className="text-[10px] ml-1 text-[#8c5e4a]/80 dark:text-amber-100/70 font-bold">min</span></div>
          </div>
          <div className="rounded-xl border border-[#b58974]/25 dark:border-white/5 bg-[#ece2cf] dark:bg-black/30 p-2.5 shadow-xs">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#8c5e4a] dark:text-amber-100/60 font-black">Scheduled</div>
            <div className="font-headline text-xs font-black text-[#b58974] dark:text-[#d2a649]">{formatDate(post.scheduled_at)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#b58974]/25 dark:border-white/5 bg-[#ece2cf] dark:bg-black/30 p-3.5 text-xs leading-relaxed text-[#3d2f21] dark:text-amber-100/85 font-medium shadow-xs">
          {post.description}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReactionButtons userReaction={userReaction} interestedCount={interestedCount} onReact={(reaction) => onReact(post.id, reaction)} />
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--wb-line)] dark:border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-amber-100/80 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View Trail</span>
          </button>
        </div>
      </div>
    </article>
  );
}
