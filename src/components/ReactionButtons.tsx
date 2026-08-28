import { Heart, ThumbsDown } from "lucide-react";
import type { PostReactionValue } from "../types";

interface ReactionButtonsProps {
  userReaction: PostReactionValue | null;
  interestedCount: number;
  onReact: (reaction: PostReactionValue) => void;
}

export default function ReactionButtons({ userReaction, interestedCount, onReact }: ReactionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => onReact("INTERESTED")}
        className={`inline-flex items-center gap-1.5 pb-0.5 border-b-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
          userReaction === "INTERESTED"
            ? "border-black text-black"
            : "border-transparent text-gray-500 hover:text-black"
        }`}
      >
        <Heart className={`w-4 h-4 text-black ${userReaction === "INTERESTED" ? "fill-current" : ""}`} />
        <span>Interested</span>
      </button>

      <button
        type="button"
        onClick={() => onReact("NOT_INTERESTED")}
        className={`inline-flex items-center gap-1.5 pb-0.5 border-b-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
          userReaction === "NOT_INTERESTED"
            ? "border-black text-black"
            : "border-transparent text-gray-500 hover:text-black"
        }`}
      >
        <ThumbsDown className={`w-4 h-4 text-black ${userReaction === "NOT_INTERESTED" ? "fill-current" : ""}`} />
        <span>Not Interested</span>
      </button>

      <span className="text-[11px] font-extrabold text-gray-500">
        {interestedCount} interested
      </span>
    </div>
  );
}
