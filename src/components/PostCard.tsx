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
    <article className="overflow-hidden rounded-3xl border border-[#00ffc8]/20 bg-[#041a14]/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="relative h-56 overflow-hidden">
        <img src={route?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"} alt={route?.name || post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020b08] via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <VisibilityBadge visibility={post.visibility} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
          <div className="font-headline text-2xl font-black uppercase italic text-white">{route?.name || post.title}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#00ffc8]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{route?.location || "Trail location pending"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src={createdAvatar} alt={createdBy} className="h-10 w-10 rounded-full object-cover border border-[#00ffc8]/40" />
            <div>
              <div className="font-headline text-xs font-black uppercase text-white">{createdBy}</div>
              <div className="text-[10px] text-emerald-200/60">{formatDate(post.created_at)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="rounded-full border border-[#00ffc8]/30 bg-[#00ffc8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#00ffc8]"
          >
            View Post
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-200/60">Distance</div>
            <div className="font-headline text-lg font-black text-[#00e5ff]">{route?.distanceKm ?? "—"}<span className="text-[10px] ml-1 text-cyan-100/70">km</span></div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-200/60">Elevation</div>
            <div className="font-headline text-lg font-black text-[#adff2f]">{route?.elevationGainM ?? "—"}<span className="text-[10px] ml-1 text-lime-100/70">m</span></div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-200/60">Time</div>
            <div className="font-headline text-lg font-black text-white">{route?.estimatedTimeMin ?? "—"}<span className="text-[10px] ml-1 text-emerald-100/70">min</span></div>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-200/60">Scheduled</div>
            <div className="font-headline text-sm font-black text-[#00ffc8]">{formatDate(post.scheduled_at)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5 text-xs leading-relaxed text-emerald-100/85">
          {post.description}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReactionButtons userReaction={userReaction} interestedCount={interestedCount} onReact={(reaction) => onReact(post.id, reaction)} />
          <button
            type="button"
            onClick={() => onOpenDetails(post.id)}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View Trail</span>
          </button>
        </div>
      </div>
    </article>
  );
}
