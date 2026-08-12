import { Lock, Globe2 } from "lucide-react";
import type { PostVisibility } from "../types";

interface VisibilityBadgeProps {
  visibility: PostVisibility;
}

export default function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const isPublic = visibility === "PUBLIC";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
        isPublic
          ? "border-[#d2a649]/40 bg-[#d2a649]/10 text-[#d2a649]"
          : "border-[#f0d58c]/40 bg-[#f0d58c]/10 text-[#f0d58c]"
      }`}
    >
      {isPublic ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      <span>{visibility}</span>
    </span>
  );
}
