import React, { useState } from "react";
import { 
  Trophy, 
  Flame, 
  Award, 
  Sparkles, 
  Crown,
  Trees,
  Zap
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
  const [targetKm, setTargetKm] = useState(45);
  const currentKm = 38.5;
  const progressPercent = Math.min(100, Math.round((currentKm / targetKm) * 100));

  const radius = 70;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full space-y-8 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-black text-white italic tracking-tight uppercase leading-none">
          Weekly Progress
        </h2>
        <p className="text-xs text-emerald-200/80 uppercase tracking-widest font-black">
          Track active streak days, distance targets, and fitness milestones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Ring Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border-[#00ffc8]/25">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#00ffc8]/15 rounded-full blur-3xl group-hover:bg-[#00ffc8]/25 transition-all duration-500" />
          
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 border border-[#00ffc8]/30 rounded-full px-3 py-1 text-[10px] text-emerald-100">
            <span>Weekly Target:</span>
            <input 
              type="number" 
              value={targetKm} 
              onChange={(e) => setTargetKm(Math.max(1, parseInt(e.target.value) || 45))}
              className="w-8 bg-transparent text-[#00ffc8] font-black text-center focus:outline-none"
            />
            <span>km</span>
          </div>

          <div className="relative w-44 h-44 my-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-white/10"
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                className="text-[#00ffc8] transition-all duration-1000 ease-out"
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 10px #00ffc8)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-3xl font-black text-[#00ffc8]">{progressPercent}%</span>
              <span className="text-[10px] text-emerald-200/70 uppercase tracking-widest font-black">Completed</span>
            </div>
          </div>

          <div className="text-center">
            <div className="font-headline text-2xl font-black text-white italic">
              {currentKm} / {targetKm} km
            </div>
            <div className="text-xs text-emerald-200/80 font-medium mt-1">
              Active distance covered across all workouts this week
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-[#041a14] to-black border-[#00ffc8]/25">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-[#00ffc8] uppercase font-black tracking-widest block mb-1">
                Active Workout Streak
              </span>
              <div className="font-headline text-3xl font-black text-white italic uppercase tracking-tight">
                14 Days Active
              </div>
            </div>
            <div className="w-14 h-14 bg-[#00ffc8]/15 rounded-full flex items-center justify-center border border-[#00ffc8]/30 shadow-[0_0_20px_rgba(0,255,200,0.2)] group-hover:scale-110 transition-transform">
              <Flame className="w-7 h-7 text-[#00ffc8] fill-current" />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between gap-2.5">
              {[true, true, true, true, true, false, false].map((active, i) => (
                <div
                  key={i}
                  className={`flex-1 h-12 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-t from-[#00ffc8] to-[#00e5ff] shadow-[0_0_15px_rgba(0,255,200,0.4)]"
                      : "bg-white/5 border border-white/5"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 px-1 text-[10px] text-emerald-200/80 font-black tracking-wider">
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

      {/* Badges Grid */}
      <div>
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-headline text-xl font-extrabold text-white tracking-tight">
            Milestones &amp; Badges
          </h2>
          <span className="text-xs text-[#00ffc8] font-black">3 Unlocked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const isLatest = badge.id === "badge-3";
            const gradientClass =
              badge.type === "streak"
                ? "from-[#00ffc8] to-[#00e5ff]"
                : badge.type === "silver"
                ? "from-slate-200 to-teal-400"
                : "from-amber-200 via-amber-400 to-emerald-500";

            return (
              <div
                key={badge.id}
                onClick={() => {
                  onBadgeToggle(badge.id);
                  setSelectedBadge(selectedBadge?.id === badge.id ? null : badge);
                }}
                className="glass-panel p-5 rounded-2xl text-center group cursor-pointer hover:bg-white/5 hover:border-[#00ffc8]/50 transition-all shadow-xl relative"
              >
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-[#00ffc8]/20 rounded-full blur-xl group-hover:scale-135 transition-transform duration-500" />
                  
                  <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${gradientClass} rounded-full border-4 border-white/20 shadow-2xl`}>
                    {badge.type === "streak" ? (
                      <Flame className="w-10 h-10 text-black fill-current" />
                    ) : badge.type === "silver" ? (
                      <Award className="w-10 h-10 text-slate-900" />
                    ) : (
                      <Crown className="w-10 h-10 text-black" />
                    )}
                  </div>

                  {isLatest && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#00ffc8] text-black text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-lg">
                      LATEST
                    </div>
                  )}
                </div>

                <div className="font-headline text-xs font-black tracking-wider text-white uppercase group-hover:text-[#00ffc8] transition-colors">
                  {badge.title}
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-1.5 font-medium">
                  {badge.description}
                </div>

                {selectedBadge?.id === badge.id && (
                  <div className="absolute inset-0 bg-[#041a14]/95 rounded-2xl p-4 flex flex-col justify-center items-center text-xs text-white z-20 border border-[#00ffc8]/40">
                    <Trophy className="w-6 h-6 text-[#00ffc8] mb-2" />
                    <p className="font-bold uppercase tracking-wider text-[10px] text-[#00ffc8]">Milestone Unlocked!</p>
                    <p className="text-emerald-100/80 mt-1 text-center">You have shown remarkable consistency across your workout routes.</p>
                    <button className="text-[10px] text-emerald-200/60 hover:text-white mt-3 underline uppercase font-bold">Tap to flip back</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Session CTA */}
      <section className="relative h-60 w-full rounded-2xl overflow-hidden glass-panel border-[#00ffc8]/30 group">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-8767610419ea?auto=format&fit=crop&w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041a14] via-[#041a14]/90 to-transparent" />
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#00ffc8]/20 text-[#00ffc8] border border-[#00ffc8]/30 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-3">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Recommended Route Walk</span>
            </div>
            <h3 className="font-headline text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">
              LAKESIDE SUNSET LOOP
            </h3>
            <p className="text-xs text-emerald-100/80 max-w-xs md:max-w-md leading-relaxed mt-2.5">
              Experience the scenic 5.2km loop along lakeside tree avenues with flat paving. Complete 5.2km to earn your Gold Explorer Badge!
            </p>
          </div>
          <button
            onClick={onStartSuggestedSession}
            className="bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline text-[11px] uppercase font-black tracking-wider px-6 py-2.5 rounded-full self-start active:scale-95 transition-transform shadow-[0_4px_20px_rgba(0,255,200,0.3)]"
          >
            Start Suggested Session
          </button>
        </div>
      </section>
    </div>
  );
}
