import React, { useState } from "react";
import { 
  Trophy, 
  Flame, 
  Zap, 
  ChevronRight, 
  Award, 
  Sparkles, 
  FlameKindling,
  Crown,
  HeartHandshake
} from "lucide-react";
import { AchievementBadge } from "../types";

interface WeeklyProgressProps {
  badges: AchievementBadge[];
  onBadgeToggle: (badgeId: string) => void;
  onStartSuggestedSession: () => void;
}

export default function WeeklyProgress({ 
  badges, 
  onBadgeToggle, 
  onStartSuggestedSession 
}: WeeklyProgressProps) {
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [targetKm, setTargetKm] = useState(40);
  const currentKm = 35;
  const progressPercent = Math.min(100, Math.round((currentKm / targetKm) * 100));

  // Circular progress ring constants
  const radius = 70;
  const circumference = radius * 2 * Math.PI; // 439.82
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full space-y-8 max-w-4xl mx-auto pb-12">
      {/* Weekly Progress Section Title */}
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-black text-white italic tracking-tight uppercase leading-none">
          Weekly Progress
        </h2>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Analyze active streaks, distance targets, and legendary accomplishments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Target Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#c3f400]/10 rounded-full blur-3xl group-hover:bg-[#c3f400]/20 transition-all duration-500" />
          
          {/* Target adjustment widget inside progress */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[10px] text-[#c6c6ca]">
            <span>Goal:</span>
            <input 
              type="number" 
              value={targetKm} 
              onChange={(e) => setTargetKm(Math.max(1, parseInt(e.target.value) || 40))}
              className="w-8 bg-transparent text-white font-bold text-center focus:outline-none focus:text-[#c3f400]"
            />
            <span>km</span>
          </div>

          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer circle track */}
              <circle
                className="text-white/5"
                cx="80"
                cy="80"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
              />
              {/* Inner animated progress indicator */}
              <circle
                className="text-[#c3f400] transition-all duration-1000 ease-out"
                cx="80"
                cy="80"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-3xl font-black text-[#c3f400]">{progressPercent}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Complete</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="font-headline text-2xl font-black text-white italic">
              {currentKm} / {targetKm} km
            </div>
            <div className="text-xs text-gray-400 font-medium mt-1">
              Active distance covered this week
            </div>
          </div>
        </div>

        {/* Streak Visualization Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-[#191c1e] to-black">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-[#c3f400] uppercase font-bold tracking-widest block mb-1">
                Current active streak
              </span>
              <div className="font-headline text-3xl font-black text-white italic uppercase tracking-tight">
                12 Days
              </div>
            </div>
            <div className="w-14 h-14 bg-[#c3f400]/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(195,244,0,0.1)] group-hover:scale-110 transition-transform">
              <Flame className="w-7 h-7 text-[#c3f400] fill-current" />
            </div>
          </div>

          <div className="mt-10">
            {/* 7 blocks representing the active states */}
            <div className="flex justify-between gap-2.5">
              {[true, true, true, true, false, false, false].map((active, i) => (
                <div
                  key={i}
                  className={`flex-1 h-12 rounded-lg transition-all ${
                    active
                      ? "bg-[#c3f400] shadow-[0_0_15px_rgba(195,244,0,0.3)] animate-pulse-slow"
                      : "bg-[#323537]/30 border border-white/5"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 px-1 text-[10px] text-[#c6c6ca] font-extrabold tracking-wider">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements & Badges Grid */}
      <div>
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-headline text-xl font-bold text-white tracking-tight">
            Achievements &amp; Badges
          </h2>
          <span className="text-xs text-[#c3f400] font-bold">3 Unlocked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badges.map((badge) => {
            // Pick a gradient based on badge level or type
            const isLatest = badge.id === "badge-3";
            const gradientClass =
              badge.type === "streak"
                ? "from-yellow-400 to-orange-600"
                : badge.type === "silver"
                ? "from-slate-300 to-slate-500"
                : "from-yellow-200 via-yellow-500 to-amber-700";

            const shadowColor =
              badge.type === "streak"
                ? "shadow-orange-500/15"
                : badge.type === "silver"
                ? "shadow-slate-500/15"
                : "shadow-yellow-500/15";

            return (
              <div
                key={badge.id}
                onClick={() => {
                  onBadgeToggle(badge.id);
                  setSelectedBadge(selectedBadge?.id === badge.id ? null : badge);
                }}
                className="glass-panel p-5 rounded-2xl text-center group cursor-pointer hover:bg-white/5 hover:border-[#c3f400]/30 transition-all shadow-xl relative"
              >
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {/* Glowing background circle */}
                  <div className="absolute inset-0 bg-[#c3f400]/15 rounded-full blur-xl group-hover:scale-135 transition-transform duration-500" />
                  
                  {/* Badge content */}
                  <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} rounded-full border-4 border-white/10 shadow-2xl`}>
                    {badge.type === "streak" ? (
                      <Flame className="w-10 h-10 text-white fill-current" />
                    ) : badge.type === "silver" ? (
                      <Award className="w-10 h-10 text-slate-900" />
                    ) : (
                      <Crown className="w-10 h-10 text-amber-950" />
                    )}
                  </div>

                  {isLatest && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#c3f400] text-black text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase animate-bounce-slow shadow-lg">
                      LATEST
                    </div>
                  )}
                </div>

                <div className="font-headline text-xs font-black tracking-wider text-white uppercase group-hover:text-[#c3f400] transition-colors">
                  {badge.title}
                </div>
                <div className="text-[11px] text-[#c6c6ca] mt-1.5 font-medium">
                  {badge.description}
                </div>

                {/* Flip info drawer */}
                {selectedBadge?.id === badge.id && (
                  <div className="absolute inset-0 bg-black/95 rounded-2xl p-4 flex flex-col justify-center items-center text-xs text-white z-20">
                    <Trophy className="w-6 h-6 text-[#c3f400] mb-2" />
                    <p className="font-bold uppercase tracking-wider text-[10px] text-[#c3f400]">Milestone unlocked!</p>
                    <p className="text-gray-300 mt-1 text-center">You have shown remarkable dedication to your daily fitness target.</p>
                    <button className="text-[10px] text-gray-500 hover:text-white mt-3 underline uppercase font-bold">Tap to flip back</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Push Beyond Limits Highlight CTA Card */}
      <section className="relative h-60 w-full rounded-2xl overflow-hidden glass-panel border-[#c3f400]/25 group">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15 grayscale transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/90 to-transparent" />
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#3cddc7]/15 text-[#3cddc7] text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase mb-4">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Epic Milestone nearby</span>
            </div>
            <h3 className="font-headline text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">
              PUSH BEYOND LIMITS
            </h3>
            <p className="text-xs text-gray-400 max-w-xs md:max-w-md leading-relaxed mt-2.5">
              You're only 5km away from hitting your highest monthly elevation gain. Complete one energetic trail run to unlock the Golden Ascent Badge!
            </p>
          </div>
          <button
            onClick={onStartSuggestedSession}
            className="bg-[#c3f400] hover:bg-[#abd600] text-black font-headline text-[11px] uppercase font-black tracking-wider px-5 py-2.5 rounded-full self-start active:scale-95 transition-transform shadow-lg shadow-black/40"
          >
            Start Suggested Session
          </button>
        </div>
      </section>
    </div>
  );
}
