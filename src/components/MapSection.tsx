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

/** CartoDB basemaps — swapped with the app theme. */
const TILE_URL: Record<"dark" | "light", string> = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
};

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapTheme, setMapTheme] = useState<"dark" | "light">("dark");

  const currentCategoryFilter = selectedCategory || (activeTab === "All" ? undefined : activeTab);

  const filteredRoutes = currentCategoryFilter
    ? routes.filter((r) => r.category === currentCategoryFilter)
    : routes;

  const filteredPings = currentCategoryFilter
    ? userPings.filter((p) => p.category === currentCategoryFilter)
    : userPings;

  const getCategoryColor = (category: string) => {
    const isLight = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      switch (category) {
        case "Walking": return "#c59138"; // Amber Gold
        case "Jogging": return "#d35400"; // Burnt Orange
        case "Sprinting": return "#c0392b"; // Crimson Rose
        default: return "#c59138";
      }
    }
    switch (category) {
      case "Walking": return "#d2a649"; // Amber Gold
      case "Jogging": return "#e67e22"; // Burnt Orange
      case "Sprinting": return "#e74c3c"; // Crimson Rose
      default: return "#d2a649";
    }
  };

  // Swap the basemap whenever the app theme flips.
  useEffect(() => {
    const applyTheme = () => {
      const t = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      setMapTheme(t);
      const layer = tileLayerRef.current;
      if (layer) layer.setUrl(TILE_URL[t]);
    };
    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

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

    // Base tiles are swapped when the app theme changes (see effect below).
    const tiles = L.tileLayer(TILE_URL[document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"], {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    tileLayerRef.current = tiles;

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
              background: rgba(24, 31, 27, 0.95);
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
              background: #181f1b;
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
    <div className="relative w-full bg-[var(--wb-card)] dark:bg-[#121614] overflow-hidden border-b border-[var(--wb-line)] shadow-2xl select-none flex flex-col">
      {/* Live Map Header Banner & Top 30 Indian Cities Selector */}
      <div className="dark-panel w-full bg-gradient-to-r from-[#b58974] via-[#a2745f] to-[#b58974] dark:from-[#d2a649] dark:via-[#c59138] dark:to-[#d2a649] border-b border-[#8c5e4a] dark:border-[#a87a2a] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-30 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-black opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white dark:bg-black"></span>
          </div>
          <span className="font-headline font-black text-sm uppercase tracking-wider text-white dark:text-black flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-white dark:text-black stroke-[2.5]" />
            <span>Live Map</span>
          </span>
          <span className="text-[10px] text-white/90 dark:text-black/90 font-mono font-bold hidden sm:inline-block">
            | Active GPS Radar
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Top 30 Indian Cities Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/25 dark:bg-black/15 border border-white/30 dark:border-black/30 px-2.5 py-1.5 rounded-xl shadow-inner">
            <Building2 className="w-3.5 h-3.5 text-white dark:text-black shrink-0" />
            <span className="text-[10px] text-white dark:text-black font-extrabold uppercase hidden xs:inline">City:</span>
            <select
              value={selectedCity.name}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="select-white-arrow bg-transparent text-xs font-headline font-black text-white dark:text-black focus:outline-none cursor-pointer pr-1 appearance-none"
            >
              {INDIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#fbf6ec] text-[#2c2519] dark:bg-[#121614] dark:text-white">
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
            className="bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 text-white dark:text-black border border-white/35 dark:border-black/35 px-3 py-1.5 rounded-xl text-xs font-headline font-black flex items-center gap-1.5 transition-all active:scale-95"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-white dark:text-black" : "text-white dark:text-black"}`} />
            <span>{isLocating ? "Detecting GPS..." : "Use My Location"}</span>
          </button>
        </div>
      </div>

      {/* Map Container Wrapper */}
      <div className="relative w-full h-[60vh] md:h-[68vh]">
        {/* Top Controls Bar Over Map */}
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[500] flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 dark:bg-[#181f1b]/95 backdrop-blur-xl border border-slate-300 dark:border-[#d2a649]/30 p-1 sm:p-1.5 rounded-2xl shadow-lg max-w-full overflow-x-auto no-scrollbar shrink-0">
            {(["All", "Walking", "Jogging", "Sprinting"] as const).map((cat) => {
              const isActive = activeTab === cat;
              let badgeColor = "#d2a649";
              if (cat === "Jogging") badgeColor = "#f0d58c";
              if (cat === "Sprinting") badgeColor = "#b58974";

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleTabClick(cat)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-headline text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? "bg-[#d2a649] text-black shadow-[0_0_15px_rgba(210,166,73,0.4)] font-extrabold"
                      : "text-slate-900 dark:text-amber-200/80 font-extrabold hover:text-black dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full inline-block shrink-0"
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
              className={`font-headline text-xs font-black px-4 py-2 rounded-2xl flex items-center gap-1.5 transition-all uppercase tracking-wider shadow-lg ${
                isPinningMode
                  ? "bg-amber-400 text-black border-2 border-black"
                  : "bg-[#d2a649] text-black border border-[#d2a649]/50 hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(210,166,73,0.35)]"
              }`}
            >
              <Radio className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="text-black font-extrabold">{isPinningMode ? "Click Map to Drop Pin" : "📍 Ping My Spot"}</span>
            </button>

            {onAddRouteClick && (
              <button
                type="button"
                onClick={onAddRouteClick}
                className="hidden sm:flex bg-[#d2a649] text-black font-headline text-xs font-black px-3.5 py-2 rounded-2xl items-center gap-1.5 shadow-[0_0_20px_rgba(210,166,73,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
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
          className="p-2.5 rounded-xl bg-[#f0d58c] text-black border border-[#c59138]/30 hover:bg-[#d2a649] dark:bg-[#181f1b]/95 dark:border-white/10 dark:text-[#d2a649] dark:hover:bg-[#d2a649] dark:hover:text-black transition-all shadow-xl active:scale-90"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-[#f0d58c] text-black border border-[#c59138]/30 hover:bg-[#d2a649] dark:bg-[#181f1b]/95 dark:border-white/10 dark:text-[#d2a649] dark:hover:bg-[#d2a649] dark:hover:text-black transition-all shadow-xl active:scale-90"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetMap}
          className="p-2.5 rounded-xl bg-[#f0d58c] text-black border border-[#c59138]/30 hover:bg-[#d2a649] dark:bg-[#181f1b]/95 dark:border-white/10 dark:text-[#d2a649] dark:hover:bg-[#d2a649] dark:hover:text-black transition-all shadow-xl active:scale-90"
          title="Recenter City Map"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Map Target Element */}
      <div id="bangalore-leaflet-map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Compass Rose Info Indicator */}
      <div className="absolute bottom-4 left-4 z-[500] pointer-events-none hidden sm:flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase bg-[#f0d58c] text-slate-900 border border-[#c59138]/40 dark:bg-[#181f1b]/90 dark:text-amber-100/70 dark:border-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl">
        <Compass className="w-5 h-5 text-black dark:text-[#d2a649] animate-spin-slow shrink-0" />
        <div>
          <div className="font-black text-black dark:text-[#d2a649]">{selectedCity.name} Map ({selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E)</div>
          <div className="font-bold text-slate-800 dark:text-amber-100/70">Active Pins: {filteredRoutes.length} Trails • {filteredPings.length} Live Meetups</div>
        </div>
      </div>

      {/* SELECTED ROUTE DETAILS OVERLAY CARD */}
      {selectedRoute && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-[600] glass-panel-glow p-4 rounded-2xl shadow-2xl w-auto md:w-96 border-[#d2a649]/40 animate-fadeIn pointer-events-auto">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedRoute(null)}
            className="absolute top-3 right-3 text-amber-100/60 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-between items-start mb-2 pr-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5 flex items-center gap-1.5" style={{ color: getCategoryColor(selectedRoute.category) }}>
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: getCategoryColor(selectedRoute.category) }} />
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

          <div className="text-xs text-amber-100/80 mb-3 flex items-center gap-1.5 font-semibold truncate">
            <span>📍 {selectedRoute.location}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl border border-white/10 mb-3 text-center">
            <div>
              <div className="text-[9px] text-amber-100/70 uppercase font-black">Distance</div>
              <div className="text-xs font-extrabold text-[#d2a649]">{selectedRoute.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[9px] text-amber-100/70 uppercase font-black">Elev. Gain</div>
              <div className="text-xs font-extrabold text-[#f0d58c]">{selectedRoute.elevationGainM} m</div>
            </div>
            <div>
              <div className="text-[9px] text-amber-100/70 uppercase font-black">TIME</div>
              <div className="text-xs font-extrabold text-[#e5c378]">{selectedRoute.estimatedTimeMin} min</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectRoute(selectedRoute)}
            className="w-full text-center bg-gradient-to-r from-[#d2a649] to-[#f0d58c] text-black font-headline font-black text-xs py-2.5 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wider"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Start Activity Session</span>
          </button>
        </div>
      )}

      {/* SELECTED LIVE MEETUP PING OVERLAY CARD */}
      {selectedPing && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-[600] glass-panel-glow p-4 rounded-2xl shadow-2xl w-auto md:w-96 border-amber-400/40 animate-fadeIn pointer-events-auto">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedPing(null)}
            className="absolute top-3 right-3 text-amber-100/60 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
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
              <p className="text-[11px] text-amber-100/70 truncate">By {selectedPing.authorName}</p>
            </div>
          </div>

          <p className="text-xs text-amber-100 bg-black/40 p-2.5 rounded-xl border border-white/10 mb-3 italic">
            "{selectedPing.note}"
          </p>

          <div className="flex items-center justify-between text-xs text-amber-100/80 mb-3 font-semibold px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#d2a649]" />
              <span>{selectedPing.timeSlot}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#f0d58c]" />
              <span>{selectedPing.currentJoiners} / {selectedPing.maxJoiners} Joined</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onJoinPing) onJoinPing(selectedPing.id);
              alert(`🎉 You joined ${selectedPing.authorName}'s meetup!`);
            }}
            className="w-full text-center bg-gradient-to-r from-amber-400 to-amber-200 text-black font-headline font-black text-xs py-2.5 rounded-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wider"
          >
            <Users className="w-4 h-4 fill-current" />
            <span>Join {selectedCity.name} Walkers</span>
          </button>
        </div>
      )}

      {/* DROP LIVE MEETUP PING MODAL */}
      {showPingModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181f1b] border border-[#d2a649]/40 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-300" />
                <h3 className="font-headline text-base font-extrabold uppercase tracking-wider text-white">
                  Drop {selectedCity.name} Meetup Ping
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPingModal(false)}
                className="p-1 rounded-xl bg-white/5 text-amber-100/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPing} className="space-y-3">
              <div>
                <label className="block text-[10px] text-amber-100/80 uppercase font-black mb-1">
                  Meetup Title / Spot Name
                </label>
                <input
                  type="text"
                  required
                  value={pingTitle}
                  onChange={(e) => setPingTitle(e.target.value)}
                  placeholder="e.g. Morning Walk at Main Park Gate 2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d2a649]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-100/80 uppercase font-black mb-1">
                  Activity Type
                </label>
                <select
                  value={pingCategory}
                  onChange={(e) => setPingCategory(e.target.value as any)}
                  className="w-full bg-[#121614] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d2a649]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-amber-100/80 uppercase font-black mb-1">
                  Start Time / Slot
                </label>
                <input
                  type="text"
                  value={pingTimeSlot}
                  onChange={(e) => setPingTimeSlot(e.target.value)}
                  placeholder="e.g. Today @ 6:00 PM"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d2a649]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-100/80 uppercase font-black mb-1">
                  Meetup Note / Message
                </label>
                <textarea
                  rows={2}
                  value={pingNote}
                  onChange={(e) => setPingNote(e.target.value)}
                  placeholder="e.g. Pace is comfortable. Open for anyone in the area!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d2a649]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-amber-200 text-black font-headline font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg hover:opacity-95 transition-all mt-2"
              >
                Publish Live Meetup Ping
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
