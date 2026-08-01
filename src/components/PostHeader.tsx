interface PostHeaderProps {
  title: string;
  subtitle: string;
  onCreatePost: () => void;
}

export default function PostHeader({ title, subtitle, onCreatePost }: PostHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#00ffc8]/20 bg-[#041a14]/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-headline text-3xl font-black uppercase italic tracking-tight text-white">{title}</div>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200/65">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onCreatePost}
        className="rounded-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-black shadow-[0_0_20px_rgba(0,255,200,0.3)]"
      >
        + Create Post
      </button>
    </div>
  );
}
