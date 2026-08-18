export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-black/30 bg-[#f8f1e3] animate-pulse">
          <div className="h-56 bg-black/5" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-28 rounded-full bg-black/5" />
            <div className="h-6 w-3/4 rounded-full bg-black/5" />
            <div className="h-4 w-1/2 rounded-full bg-black/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
