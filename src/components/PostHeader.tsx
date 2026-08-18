import React from "react";

interface PostHeaderProps {
  title: string;
  subtitle: string;
  onCreatePost: () => void;
}

export default function PostHeader({ title, subtitle, onCreatePost }: PostHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 pb-6 border-b border-black/30 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        <h1 className="font-headline text-4xl md:text-5xl font-black uppercase italic tracking-tight text-[var(--wb-text)] leading-none">{title}</h1>
        <p className="text-sm text-gray-500 text-accent-serif">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onCreatePost}
        className="shrink-0 inline-flex items-center gap-1.5 border border-black px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
      >
        + Create Post
      </button>
    </div>
  );
}
