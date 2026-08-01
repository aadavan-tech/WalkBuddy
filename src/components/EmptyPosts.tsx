import { CalendarClock } from "lucide-react";

interface EmptyPostsProps {
  onCreatePost: () => void;
}

export default function EmptyPosts({ onCreatePost }: EmptyPostsProps) {
  return (
    <div className="rounded-[28px] border border-[#00ffc8]/20 bg-[#041a14]/90 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00ffc8]/30 bg-[#00ffc8]/10 text-[#00ffc8]">
        <CalendarClock className="h-6 w-6" />
      </div>
      <div className="font-headline text-xl font-black uppercase italic text-white">No community runs yet</div>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-emerald-100/70">
        Schedule a trail from the Feed and publish it here so your community can react and plan together.
      </p>
      <button
        type="button"
        onClick={onCreatePost}
        className="mt-5 rounded-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-black"
      >
        + Create Post
      </button>
    </div>
  );
}
