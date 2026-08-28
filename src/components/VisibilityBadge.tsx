import { Lock, Globe2 } from "lucide-react";
import type { PostVisibility } from "../types";

interface VisibilityBadgeProps {
  visibility: PostVisibility;
}

export default function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const isPublic = visibility === "PUBLIC";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
        isPublic
          ? "bg-black text-white"
          : "bg-[#f8f1e3] text-black border border-black/40"
      }`}
    >
      {isPublic ? <Globe2 className="w-3 h-3 text-white" /> : <Lock className="w-3 h-3 text-black" />}
      <span>{visibility}</span>
    </span>
  );
}
