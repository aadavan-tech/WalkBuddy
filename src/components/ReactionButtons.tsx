import { Heart, ThumbsDown } from "lucide-react";
import type { PostReactionValue } from "../types";

interface ReactionButtonsProps {
  userReaction: PostReactionValue | null;
  interestedCount: number;
  onReact: (reaction: PostReactionValue) => void;
}

export default function ReactionButtons({ userReaction, interestedCount, onReact }: ReactionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onReact("INTERESTED")}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
          userReaction === "INTERESTED"
            ? "border-[#00ffc8]/45 bg-[#00ffc8]/20 text-[#00ffc8]"
            : "border-white/10 bg-white/5 text-emerald-100/75 hover:text-white"
        }`}
      >
        <Heart className={`w-4 h-4 ${userReaction === "INTERESTED" ? "fill-current" : ""}`} />
        <span>Interested</span>
      </button>

      <button
        type="button"
        onClick={() => onReact("NOT_INTERESTED")}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
          userReaction === "NOT_INTERESTED"
            ? "border-[#00e5ff]/45 bg-[#00e5ff]/20 text-[#00e5ff]"
            : "border-white/10 bg-white/5 text-emerald-100/75 hover:text-white"
        }`}
      >
        <ThumbsDown className={`w-4 h-4 ${userReaction === "NOT_INTERESTED" ? "fill-current" : ""}`} />
        <span>Not Interested</span>
      </button>

      <span className="text-[11px] font-extrabold text-emerald-200/60">
        {interestedCount} interested
      </span>
    </div>
  );
}
