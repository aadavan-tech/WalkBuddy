import { Users } from "lucide-react";

interface InterestedListProps {
  interestedCount: number;
  users: string[];
}

export default function InterestedList({ interestedCount, users }: InterestedListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-black mb-2">
        <Users className="w-3.5 h-3.5 text-black" />
        <span>Interested Users</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-gray-700">
        {users.length > 0 ? (
          users.slice(0, 5).map((name) => (
            <span key={name} className="border-b border-black/20">
              {name}
            </span>
          ))
        ) : (
          <span className="italic text-gray-500">No one is interested yet — be the first.</span>
        )}
        {interestedCount > users.length && (
          <span className="text-black font-bold">
            +{interestedCount - users.length} more
          </span>
        )}
      </div>
    </div>
  );
}
