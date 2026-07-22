import React, { useState } from "react";
import { MapPin, Star, Plus, Eye, CheckCircle2, Navigation, Compass } from "lucide-react";
import { Route } from "../types";

interface MapSectionProps {
  routes: Route[];
  selectedCategory: "Walking" | "Jogging" | "Sprinting";
  onCategoryChange: (category: "Walking" | "Jogging" | "Sprinting") => void;
  onSelectRoute: (route: Route) => void;
  onAddRouteClick: () => void;
}

export default function MapSection({
  routes,
  selectedCategory,
  onCategoryChange,
  onSelectRoute,
  onAddRouteClick,
}: MapSectionProps) {
  const [activePin, setActivePin] = useState<Route | null>(null);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Map limits or coordinates mapping
  // Let's map the routes dynamically to visual coordinate offsets on our 100% grayscale map
  const filteredRoutes = routes.filter((r) => r.category === selectedCategory);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Limit translation slightly so map doesn't fly off screen
    setMapOffset({
      x: Math.max(-150, Math.min(150, newX)),
      y: Math.max(-100, Math.min(100, newY)),
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden bg-[#101415] select-none border-b border-white/5">
      {/* Draggable Map Layer */}
      <div
        id="map-canvas-container"
        className={`absolute inset-0 w-full h-full transition-transform duration-200 ease-out cursor-grab ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        style={{
          transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(1.1)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {/* Grayscale Map Background Image */}
        <div
          className="absolute inset-0 w-full h-full grayscale opacity-45 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCY7VXaFwBoYGXDonbxLzzr3KvVO9ZoV0rRSk9I_UCAjWDF6WJAEm6xYA8ctCQV22j3kG6Y9R5PH_XzGj_62ozsAe1q0lzmQ2wMmdbACu9W-Iq84I7P5ubeeALkvMnmpwWmQ5oM6dpjpn0CMyNs0MtLmP-fo8IZUik70MLPXHiq0AqlcpdrylJwNdssDKETGMwLoi6hyt_wRQvSj_pbU3wxOrwNaJdfXDb01CsLw4Fj3dGhi69T603CZLDrGNDKByJRHOrsmsr8O_dy')`,
          }}
        />

        {/* Dynamic Route SVG Overlay paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
          {filteredRoutes.map((route, i) => {
            // Draw dummy path connecting coordinates
            const startX = route.lat * 8.5;
            const startY = route.lng * 8.5;
            const endX = startX + 60;
            const endY = startY - 40;
            return (
              <path
                key={route.id}
                d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${(startY + endY) / 2 - 20} ${endX} ${endY}`}
                fill="none"
                stroke={selectedCategory === "Walking" ? "#c3f400" : selectedCategory === "Jogging" ? "#3cddc7" : "#ffb4ab"}
                strokeWidth={activePin?.id === route.id ? "4" : "2"}
                strokeDasharray="6,4"
              />
            );
          })}
        </svg>

        {/* Dynamic Map Pin Overlays */}
        {filteredRoutes.map((route) => {
          // Calculate screen coordinates dynamically based on mock lat/lng properties
          // We put them within standard viewport range
          const leftPercent = `${route.lat}%`;
          const topPercent = `${route.lng}%`;

          const isActive = activePin?.id === route.id;

          return (
            <div
              key={route.id}
              className="absolute cursor-pointer transition-all duration-300"
              style={{
                left: leftPercent,
                top: topPercent,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActivePin(route);
              }}
            >
              {/* Pulsing ring underneath */}
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  selectedCategory === "Walking"
                    ? "bg-[#c3f400] text-black pulse-animation-marker"
                    : selectedCategory === "Jogging"
                    ? "bg-[#3cddc7] text-black"
                    : "bg-[#ffb4ab] text-black"
                } ${isActive ? "scale-125 ring-4 ring-white/20" : "hover:scale-110"}`}
              >
                <div className="w-2 h-2 rounded-full bg-black/40" />
              </div>

              {/* Tag Indicator */}
              {isActive && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#121417]/95 border border-white/10 p-3 rounded-lg shadow-2xl w-52 z-50 pointer-events-auto text-left">
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <span className="font-headline text-[13px] font-bold text-white leading-tight truncate">
                      {route.name}
                    </span>
                    <div className="flex items-center text-yellow-400 gap-0.5 shrink-0 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{route.rating}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#c6c6ca] font-medium mb-2 uppercase tracking-wider">
                    {route.location}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2 mb-2.5">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Distance</div>
                      <div className="text-xs font-semibold text-[#c3f400]">{route.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Elev.</div>
                      <div className="text-xs font-semibold text-[#3cddc7]">{route.elevationGainM} m</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRoute(route);
                    }}
                    className="w-full text-center bg-[#c3f400] text-black font-headline font-semibold text-xs py-1.5 rounded-md hover:bg-[#abd600] active:scale-95 transition-all flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Start Session
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Header Category Toggle - Absolute Top Centered */}
      <div className="absolute top-4 left-0 w-full flex justify-center px-4 pointer-events-none z-10">
        <div className="glass-panel rounded-full p-1 flex gap-1 pointer-events-auto shadow-2xl">
          <button
            onClick={() => onCategoryChange("Walking")}
            className={`px-4 md:px-6 py-1.5 rounded-full font-headline text-[11px] md:text-xs tracking-wider uppercase font-bold transition-all ${
              selectedCategory === "Walking"
                ? "bg-[#c3f400] text-black shadow-lg"
                : "text-[#c6c6ca] hover:text-white"
            }`}
          >
            Walking
          </button>
          <button
            onClick={() => onCategoryChange("Jogging")}
            className={`px-4 md:px-6 py-1.5 rounded-full font-headline text-[11px] md:text-xs tracking-wider uppercase font-bold transition-all ${
              selectedCategory === "Jogging"
                ? "bg-[#3cddc7] text-black shadow-lg"
                : "text-[#c6c6ca] hover:text-white"
            }`}
          >
            Jogging
          </button>
          <button
            onClick={() => onCategoryChange("Sprinting")}
            className={`px-4 md:px-6 py-1.5 rounded-full font-headline text-[11px] md:text-xs tracking-wider uppercase font-bold transition-all ${
              selectedCategory === "Sprinting"
                ? "bg-[#ffb4ab] text-black shadow-lg"
                : "text-[#c6c6ca] hover:text-white"
            }`}
          >
            Sprinting
          </button>
        </div>
      </div>

      {/* Interactive Helper Overlay Info */}
      <div className="absolute bottom-4 left-4 bg-[#101415]/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-[#c6c6ca]">
        <Compass className="w-4 h-4 text-[#c3f400] animate-spin-slow" />
        <span>Drag map to pan. Tap pins to preview paths.</span>
      </div>
    </div>
  );
}
