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
          ? "border-[#00ffc8]/40 bg-[#00ffc8]/10 text-[#00ffc8]"
          : "border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff]"
      }`}
    >
      {isPublic ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      <span>{visibility}</span>
    </span>
  );
}
