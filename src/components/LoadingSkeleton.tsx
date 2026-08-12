export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-[#d2a649]/20 bg-[#181f1b]/90 animate-pulse">
          <div className="h-56 bg-white/5" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-28 rounded-full bg-white/5" />
            <div className="h-6 w-3/4 rounded-full bg-white/5" />
            <div className="h-4 w-1/2 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
