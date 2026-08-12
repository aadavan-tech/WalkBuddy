import { CalendarClock } from "lucide-react";

interface EmptyPostsProps {
  onCreatePost: () => void;
}

export default function EmptyPosts({ onCreatePost }: EmptyPostsProps) {
  return (
    <div className="rounded-[28px] border border-[var(--wb-line)] dark:border-[#d2a649]/20 bg-[var(--wb-surface)] dark:bg-[#0c130f]/90 p-8 text-center shadow-xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b58974]/30 dark:border-[#d2a649]/30 bg-[#b58974]/10 dark:bg-[#d2a649]/10 text-[#b58974] dark:text-[#d2a649]">
        <CalendarClock className="h-6 w-6" />
      </div>
      <div className="font-headline text-xl font-black uppercase italic text-[var(--wb-text)] dark:text-white">No community runs yet</div>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-600 dark:text-amber-100/70">
        Schedule a trail from the Feed and publish it here so your community can react and plan together.
      </p>
      <button
        type="button"
        onClick={onCreatePost}
        className="mt-5 rounded-full bg-[#b58974] dark:bg-[#d2a649] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.24em] text-white dark:text-black shadow-md"
      >
        + Create Post
      </button>
    </div>
  );
}
