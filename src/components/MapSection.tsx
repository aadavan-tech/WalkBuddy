import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Star, Navigation, Compass, Plus, ZoomIn, ZoomOut, RefreshCw, X, Radio, Users, Clock, Check, MessageSquare, MapPin, Building2, LocateFixed } from "lucide-react";
import { Route, UserPing, DEFAULT_AVATARS } from "../types";

export interface IndianCity {
  name: string;
  lat: number;
  lng: number;
  state: string;
}

export const INDIAN_CITIES: IndianCity[] = [
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, state: "Delhi" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, state: "West Bengal" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, state: "Punjab/Haryana" },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, state: "Kerala" },
  { name: "Goa (Panaji)", lat: 15.4989, lng: 73.8278, state: "Goa" },
  { name: "Surat", lat: 21.1702, lng: 72.8311, state: "Gujarat" },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
  { name: "Indore", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, state: "Tamil Nadu" },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  { name: "Patna", lat: 25.5941, lng: 85.1376, state: "Bihar" },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812, state: "Gujarat" },
  { name: "Ludhiana", lat: 30.9010, lng: 75.8573, state: "Punjab" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
  { name: "Nashik", lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
  { name: "Rajkot", lat: 22.3039, lng: 70.8022, state: "Gujarat" },
  { name: "Varanasi", lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, state: "Karnataka" },
  { name: "Dehradun", lat: 30.3165, lng: 78.0322, state: "Uttarakhand" },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362, state: "Assam" },
  { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, state: "Kerala" },
];

interface MapSectionProps {
  routes: Route[];
  userPings?: UserPing[];
  selectedCategory?: "Walking" | "Jogging" | "Sprinting";
  onCategoryChange?: (category: "Walking" | "Jogging" | "Sprinting") => void;
  onSelectRoute: (route: Route) => void;
  onAddRouteClick?: () => void;
  onAddUserPing?: (ping: Omit<UserPing, "id" | "createdAt" | "joinedUserNames" | "currentJoiners">) => void;
  onJoinPing?: (pingId: string) => void;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export default function MapSection({
  routes,
  userPings = [],
  selectedCategory,
  onCategoryChange,
  onSelectRoute,
  onAddRouteClick,
  onAddUserPing,
  onJoinPing,
  currentUserName = "Alex Chen",
  currentUserAvatar = DEFAULT_AVATARS[0].url,
}: MapSectionProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Walking" | "Jogging" | "Sprinting">("All");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedPing, setSelectedPing] = useState<UserPing | null>(null);

  // Selected Indian City
  const [selectedCity, setSelectedCity] = useState<IndianCity>(INDIAN_CITIES[0]);
  const [isLocating, setIsLocating] = useState(false);

  // Ping creation state
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [showPingModal, setShowPingModal] = useState(false);

  // Ping Form Fields
  const [pingTitle, setPingTitle] = useState("");
  const [pingLocationName, setPingLocationName] = useState("");
  const [pingCategory, setPingCategory] = useState<"Walking" | "Jogging" | "Sprinting">("Walking");
  const [pingNote, setPingNote] = useState("");
  const [pingTimeSlot, setPingTimeSlot] = useState("In 20 mins");
  const [pingMaxJoiners, setPingMaxJoiners] = useState(6);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const currentCategoryFilter = selectedCategory || (activeTab === "All" ? undefined : activeTab);

  const filteredRoutes = currentCategoryFilter
    ? routes.filter((r) => r.category === currentCategoryFilter)
    : routes;

  const filteredPings = currentCategoryFilter
    ? userPings.filter((p) => p.category === currentCategoryFilter)
    : userPings;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Walking":
        return "#00ffc8"; // Neon Emerald
      case "Jogging":
        return "#00e5ff"; // Vibrant Cyan
      case "Sprinting":
        return "#adff2f"; // Electric Lime
      default:
        return "#00ffc8";
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const map = L.map(mapContainerRef.current, {
      center: [selectedCity.lat, selectedCity.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Map Tiles (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map click for ping dropping mode
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setClickedLatLng({ lat, lng });
      setPingLocationName(`${selectedCity.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      setShowPingModal(true);
      setIsPinningMode(false);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle City Change
  const handleCitySelect = (cityName: string) => {
    const city = INDIAN_CITIES.find((c) => c.name === cityName);
    if (!city) return;
    setSelectedCity(city);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 13, {
        duration: 1.5,
      });
    }
  };

  // Handle GPS Detect Location
  const handleDetectMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setClickedLatLng({ lat: latitude, lng: longitude });
        setPingLocationName(`My GPS Position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, {
            duration: 1.8,
          });
        }
        
        setShowPingModal(true);
      },
      (error) => {
        setIsLocating(false);
        alert(`Location permission error: ${error.message}. You can select any city from the list or click anywhere on the map!`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Update Leaflet Markers when routes or pings change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Add Route Markers
    filteredRoutes.forEach((route) => {
      const color = getCategoryColor(route.category);

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 18px; 
              height: 18px; 
              background-color: ${color}; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 0 15px ${color};
              cursor: pointer;
            "></div>
            <div style="
              position: absolute;
              bottom: -22px;
              white-space: nowrap;
              background: rgba(4, 24, 18, 0.9);
              border: 1px solid ${color};
              color: white;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 6px;
              pointer-events: none;
              box-shadow: 0 2px 8px rgba(0,0,0,0.8);
            ">
              ${route.name.split(" ")[0]}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([route.lat, route.lng], { icon: customIcon });

      marker.on("click", () => {
        setSelectedPing(null);
        setSelectedRoute(route);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([route.lat, route.lng]);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });

    // 2. Add Live User Meetup Ping Markers
    filteredPings.forEach((ping) => {
      const color = getCategoryColor(ping.category);

      const pingIcon = L.divIcon({
        className: "custom-leaflet-ping-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: ${color};
              opacity: 0.25;
            "></div>
            <div style="
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              border: 2px solid ${color}; 
              box-shadow: 0 0 18px ${color};
              overflow: hidden;
              background: #041812;
              cursor: pointer;
              z-index: 10;
            ">
              <img src="${ping.authorAvatar}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="
              position: absolute;
              top: -20px;
              white-space: nowrap;
              background: ${color};
              color: black;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 1px 6px;
              border-radius: 999px;
              box-shadow: 0 0 10px ${color};
            ">
              LIVE PING
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([ping.lat, ping.lng], { icon: pingIcon });

      marker.on("click", () => {
        setSelectedRoute(null);
        setSelectedPing(ping);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([ping.lat, ping.lng]);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [filteredRoutes, filteredPings]);

  const handleTabClick = (tab: "All" | "Walking" | "Jogging" | "Sprinting") => {
    setActiveTab(tab);
    if (onCategoryChange && tab !== "All") {
      onCategoryChange(tab);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedCity.lat, selectedCity.lng], 13);
    }
  };

  const handleDropCenterPing = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    setClickedLatLng({ lat: center.lat, lng: center.lng });
    setPingLocationName(`${selectedCity.name} Center (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`);
    setShowPingModal(true);
    setIsPinningMode(false);
  };

  const handleSubmitPing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickedLatLng || !pingTitle) return;

    if (onAddUserPing) {
      onAddUserPing({
        title: pingTitle,
        locationName: pingLocationName || `${selectedCity.name} Area`,
        lat: clickedLatLng.lat,
        lng: clickedLatLng.lng,
        category: pingCategory,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
        note: pingNote || `Joining outdoor workout session in ${selectedCity.name}! Come along.`,
        timeSlot: pingTimeSlot,
        maxJoiners: Number(pingMaxJoiners) || 6,
      });
    }

    setShowPingModal(false);
    setPingTitle("");
    setPingNote("");
    alert(`📍 Live Meetup Ping Dropped in ${selectedCity.name}! Others can now view and join you.`);
  };

  return (
    <div className="relative w-full bg-[#020b08] overflow-hidden border-b border-[#00ffc8]/25 shadow-2xl select-none flex flex-col">
      {/* Live Map Header Banner & Top 30 Indian Cities Selector */}
      <div className="w-full bg-[#041510] border-b border-[#00ffc8]/30 px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffc8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ffc8]"></span>
          </div>
          <span className="font-headline font-black text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#00ffc8]" />
            <span>Live Map</span>
          </span>
          <span className="text-[10px] text-emerald-200/70 font-mono hidden sm:inline-block">
            | Active GPS Radar
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Top 30 Indian Cities Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#020b08] border border-[#00ffc8]/40 px-2.5 py-1.5 rounded-xl shadow-inner">
            <Building2 className="w-3.5 h-3.5 text-[#00ffc8] shrink-0" />
            <span className="text-[10px] text-emerald-200/80 font-bold uppercase hidden xs:inline">City:</span>
            <select
              value={selectedCity.name}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="bg-transparent text-xs font-headline font-black text-white focus:outline-none cursor-pointer pr-1"
            >
              {INDIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#041812] text-white">
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          {/* Use My Location GPS Button */}
          <button
            type="button"
            onClick={handleDetectMyLocation}
            disabled={isLocating}
            className="bg-[#00ffc8]/15 hover:bg-[#00ffc8]/25 text-[#00ffc8] border border-[#00ffc8]/40 px-3 py-1.5 rounded-xl text-xs font-headline font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,255,200,0.2)]"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-amber-300" : "text-[#00ffc8]"}`} />
            <span>{isLocating ? "Detecting GPS..." : "Use My Location"}</span>
          </button>
        </div>
      </div>

      {/* Map Container Wrapper */}
      <div className="relative w-full h-[60vh] md:h-[68vh]">
        {/* Top Controls Bar Over Map */}
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[500] flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#041812]/95 backdrop-blur-xl border border-[#00ffc8]/30 p-1 sm:p-1.5 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] max-w-full overflow-x-auto no-scrollbar shrink-0">
            {(["All", "Walking", "Jogging", "Sprinting"] as const).map((cat) => {
              const isActive = activeTab === cat;
              let badgeColor = "#00ffc8";
              if (cat === "Jogging") badgeColor = "#00e5ff";
              if (cat === "Sprinting") badgeColor = "#adff2f";

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleTabClick(cat)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-headline text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? "bg-white/15 text-white border border-white/20 shadow-[0_0_15px_rgba(0,255,200,0.3)]"
                      : "text-emerald-200/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span
                    className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full inline-block shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: badgeColor }}
                  />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Ping My Spot & Post Route */}
          <div className="flex items-center gap-2">
            {/* Ping My Spot Button */}
            <button
              type="button"
              onClick={() => setIsPinningMode(!isPinningMode)}
              className={`font-headline text-xs font-black px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition-all uppercase tracking-wider shadow-lg ${
                isPinningMode
                  ? "bg-amber-400 text-black border-2 border-white"
                  : "bg-[#041812]/90 hover:bg-[#06281e] text-[#00ffc8] border border-[#00ffc8]/40 shadow-[0_0_15px_rgba(0,255,200,0.2)]"
              }`}
            >
              <Radio className="w-4 h-4 text-amber-300" />
              <span>{isPinningMode ? "Click Map to Drop Pin" : "📍 Ping My Spot"}</span>
            </button>

            {onAddRouteClick && (
              <button
                type="button"
                onClick={onAddRouteClick}
                className="hidden sm:flex bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline text-xs font-black px-3.5 py-2 rounded-2xl items-center gap-1.5 shadow-[0_0_20px_rgba(0,255,200,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post Trail</span>
              </button>
            )}
          </div>
        </div>

        {/* Pinning Mode Banner Overlay */}
        {isPinningMode && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-amber-400 text-black px-4 py-2 rounded-2xl font-headline font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-3">
            <span>📍 Click anywhere on {selectedCity.name} Map OR</span>
            <button
              type="button"
              onClick={handleDropCenterPing}
              className="bg-black text-white px-3 py-1 rounded-xl hover:bg-zinc-800 transition-colors text-[10px]"
            >
              Drop At Map Center
            </button>
            <button
              type="button"
              onClick={() => setIsPinningMode(false)}
              className="p-1 hover:bg-black/20 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      {/* Map Zoom Controls (Top Right, cleanly positioned below top bar) */}
      <div className="absolute top-20 right-4 z-[500] flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-[#041812]/95 border border-[#00ffc8]/30 text-[#00ffc8] hover:bg-[#00ffc8] hover:text-black transition-all shadow-xl active:scale-90"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-[#041812]/95 border border-[#00ffc8]/30 text-[#00ffc8] hover:bg-[#00ffc8] hover:text-black transition-all shadow-xl active:scale-90"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetMap}
          className="p-2.5 rounded-xl bg-[#041812]/95 border border-[#00ffc8]/30 text-[#00ffc8] hover:bg-[#00ffc8] hover:text-black transition-all shadow-xl active:scale-90"
          title="Recenter Bangalore City"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Map Target Element */}
      <div id="bangalore-leaflet-map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Compass Rose Info Indicator */}
      <div className="absolute bottom-4 left-4 z-[500] pointer-events-none hidden sm:flex items-center gap-2 text-emerald-200/60 text-[10px] font-mono tracking-widest uppercase bg-[#041812]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <Compass className="w-5 h-5 text-[#00ffc8] animate-spin-slow" />
        <div>
          <div className="font-extrabold text-[#00ffc8]">Bengaluru City Map (12.9716°N, 77.5946°E)</div>
          <div>Active Pins: {filteredRoutes.length} Trails • {filteredPings.length} Live Meetups</div>
        </div>
      </div>

      {/* SELECTED ROUTE DETAILS OVERLAY CARD (Appears ONLY when a route pin is explicitly clicked) */}
      {selectedRoute && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-[600] glass-panel-glow p-4 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] w-auto md:w-96 border-[#00ffc8]/40 animate-fadeIn pointer-events-auto">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedRoute(null)}
            className="absolute top-3 right-3 text-emerald-200/60 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-between items-start mb-2 pr-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5 flex items-center gap-1.5" style={{ color: getCategoryColor(selectedRoute.category) }}>
                <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor(selectedRoute.category) }} />
                <span>{selectedRoute.category} Trail</span>
              </span>
              <h3 className="font-headline text-base md:text-lg font-extrabold text-white leading-tight">
                {selectedRoute.name}
              </h3>
            </div>
            <div className="flex items-center text-amber-300 gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{selectedRoute.rating}</span>
            </div>
          </div>

          <div className="text-xs text-emerald-100/80 mb-3 flex items-center gap-1.5 font-semibold truncate">
            <span>📍 {selectedRoute.location}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#020b08]/80 p-2 rounded-xl border border-white/10 mb-3 text-center">
            <div>
              <div className="text-[9px] text-emerald-200/70 uppercase font-black">Distance</div>
              <div className="text-xs font-extrabold text-[#00ffc8]">{selectedRoute.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-200/70 uppercase font-black">Elev. Gain</div>
              <div className="text-xs font-extrabold text-[#00e5ff]">{selectedRoute.elevationGainM} m</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-200/70 uppercase font-black">Est. Time</div>
              <div className="text-xs font-extrabold text-[#adff2f]">{selectedRoute.estimatedTimeMin} min</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectRoute(selectedRoute)}
            className="w-full text-center bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-2.5 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,200,0.4)] uppercase tracking-wider"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Start Activity Session</span>
          </button>
        </div>
      )}

      {/* SELECTED LIVE MEETUP PING OVERLAY CARD */}
      {selectedPing && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-[600] glass-panel-glow p-4 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] w-auto md:w-96 border-amber-400/40 animate-fadeIn pointer-events-auto">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedPing(null)}
            className="absolute top-3 right-3 text-emerald-200/60 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={selectedPing.authorAvatar}
              alt={selectedPing.authorName}
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
            />
            <div className="overflow-hidden">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                LIVE MEETUP PING
              </span>
              <h3 className="font-headline text-base font-extrabold text-white truncate mt-0.5">
                {selectedPing.title}
              </h3>
              <p className="text-[11px] text-emerald-200/70 truncate">By {selectedPing.authorName}</p>
            </div>
          </div>

          <p className="text-xs text-emerald-100 bg-[#020b08]/80 p-2.5 rounded-xl border border-white/10 mb-3 italic">
            "{selectedPing.note}"
          </p>

          <div className="flex items-center justify-between text-xs text-emerald-200/80 mb-3 font-semibold px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#00ffc8]" />
              <span>{selectedPing.timeSlot}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>{selectedPing.currentJoiners} / {selectedPing.maxJoiners} Joined</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onJoinPing) onJoinPing(selectedPing.id);
              alert(`🎉 You joined ${selectedPing.authorName}'s meetup!`);
            }}
            className="w-full text-center bg-gradient-to-r from-amber-400 to-amber-200 text-black font-headline font-black text-xs py-2.5 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(251,191,36,0.4)] uppercase tracking-wider"
          >
            <Users className="w-4 h-4 fill-current" />
            <span>Join Bangalore Walkers</span>
          </button>
        </div>
      )}

      {/* DROP LIVE MEETUP PING MODAL */}
      {showPingModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#04120e] border border-[#00ffc8]/40 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(0,255,200,0.2)]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-300" />
                <h3 className="font-headline text-base font-extrabold uppercase tracking-wider text-white">
                  Drop Bangalore Meetup Ping
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPingModal(false)}
                className="p-1 rounded-xl bg-white/5 text-emerald-200/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPing} className="space-y-3">
              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                  Meetup Title / Spot Name
                </label>
                <input
                  type="text"
                  required
                  value={pingTitle}
                  onChange={(e) => setPingTitle(e.target.value)}
                  placeholder="e.g. Morning Walk at Cubbon Park Gate 2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                  Activity Type
                </label>
                <select
                  value={pingCategory}
                  onChange={(e) => setPingCategory(e.target.value as any)}
                  className="w-full bg-[#041812] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                  Start Time / Slot
                </label>
                <input
                  type="text"
                  value={pingTimeSlot}
                  onChange={(e) => setPingTimeSlot(e.target.value)}
                  placeholder="e.g. Today @ 6:00 PM"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1">
                  Meetup Note / Message
                </label>
                <textarea
                  rows={2}
                  value={pingNote}
                  onChange={(e) => setPingNote(e.target.value)}
                  placeholder="e.g. Pace is around 6:30 min/km. Open for anyone in the area!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-amber-200 text-black font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-[0_4px_25px_rgba(251,191,36,0.4)] hover:opacity-95 transition-all mt-2"
              >
                Publish Live Bangalore Ping
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
