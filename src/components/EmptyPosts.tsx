import { CalendarClock } from "lucide-react";

interface EmptyPostsProps {
  onCreatePost: () => void;
}

export default function EmptyPosts({ onCreatePost }: EmptyPostsProps) {
  return (
    <div className="py-14 text-center border-t border-black/20">
      <CalendarClock className="h-6 w-6 text-black mx-auto mb-3" />
      <div className="font-headline text-xl font-black uppercase italic text-[var(--wb-text)]">No community runs yet</div>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500">
        Schedule a trail from the Feed and publish it here so your community can react and plan together.
      </p>
      <button
        type="button"
        onClick={onCreatePost}
        className="mt-5 inline-flex items-center gap-1.5 border border-black px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
      >
        + Create Post
      </button>
    </div>
  );
}
