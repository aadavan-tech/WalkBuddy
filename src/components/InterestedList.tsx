import { Users } from "lucide-react";

interface InterestedListProps {
  interestedCount: number;
  users: string[];
}

export default function InterestedList({ interestedCount, users }: InterestedListProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#00ffc8]">
        <Users className="w-3.5 h-3.5" />
        <span>Interested Users</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-emerald-100/80">
        {users.length > 0 ? (
          users.slice(0, 5).map((name) => (
            <span key={name} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {name}
            </span>
          ))
        ) : (
          <span className="italic text-emerald-200/50">No one is interested yet — be the first.</span>
        )}
        {interestedCount > users.length && (
          <span className="rounded-full border border-[#00ffc8]/30 bg-[#00ffc8]/10 px-2.5 py-1 text-[#00ffc8]">
            +{interestedCount - users.length} more
          </span>
        )}
      </div>
    </div>
  );
}
