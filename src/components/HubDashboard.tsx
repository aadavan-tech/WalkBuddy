import React, { useState } from "react";
import { 
  Footprints, 
  Compass, 
  Flame, 
  Sparkles, 
  Heart, 
  TrendingUp, 
  Plus, 
  Gauge, 
  Clock,
  Dumbbell,
  Trees,
  Zap
} from "lucide-react";
import { ActivityLog } from "../types";

interface HubDashboardProps {
  logs: ActivityLog[];
  onAddLog: (log: Omit<ActivityLog, "id" | "date">) => void;
  onOpenAICoach: () => void;
}

export default function HubDashboard({ logs, onAddLog, onOpenAICoach }: HubDashboardProps) {
  const [showAddLog, setShowAddLog] = useState(false);
  
  // Form State
  const [type, setType] = useState("Walking");
  const [distance, setDistance] = useState("4.8");
  const [steps, setSteps] = useState("6800");
  const [calories, setCalories] = useState("310");
  const [duration, setDuration] = useState("42");
  const [pace, setPace] = useState("8:15");
  const [heartRate, setHeartRate] = useState("112");
  const [notes, setNotes] = useState("");

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog({
      type,
      distanceKm: parseFloat(distance) || 0,
      steps: parseInt(steps) || 0,
      calories: parseInt(calories) || 0,
      durationMin: parseInt(duration) || 0,
      paceMinPerKm: pace || "7:30",
      heartRateBpm: parseInt(heartRate) || 120,
      notes: notes || undefined,
    });
    
    setShowAddLog(false);
    setNotes("");
  };

  const totalSteps = logs.reduce((sum, log) => sum + log.steps, 14200);
  const totalDistance = parseFloat(logs.reduce((sum, log) => sum + log.distanceKm, 12.8).toFixed(1));
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 780);

  return (
    <div className="w-full space-y-8">
      {/* Header Metrics Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Steps Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#00ffc8]/50 hover:shadow-[0_0_25px_rgba(0,255,200,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffc8]/10 rounded-full blur-2xl group-hover:bg-[#00ffc8]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#00ffc8]/15 flex items-center justify-center border border-[#00ffc8]/30">
              <Footprints className="w-5.5 h-5.5 text-[#00ffc8]" />
            </div>
            <span className="text-[10px] text-emerald-200/80 uppercase font-black tracking-wider">Total Steps</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#00ffc8] font-bold mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>+14% vs Last Session</span>
            </div>
          </div>
        </div>

        {/* Distance Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#00e5ff]/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 rounded-full blur-2xl group-hover:bg-[#00e5ff]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/15 flex items-center justify-center border border-[#00e5ff]/30">
              <Compass className="w-5.5 h-5.5 text-[#00e5ff]" />
            </div>
            <span className="text-[10px] text-cyan-200/80 uppercase font-black tracking-wider">Distance Covered</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalDistance} <span className="text-base font-medium text-cyan-200/70">km</span>
            </div>
            <div className="text-[11px] text-cyan-200/90 font-bold mt-1">
              Weekly Goal: 15.0km
            </div>
          </div>
        </div>

        {/* Calories Tile */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#adff2f]/50 hover:shadow-[0_0_25px_rgba(173,255,47,0.2)] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#adff2f]/10 rounded-full blur-2xl group-hover:bg-[#adff2f]/20 transition-all" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#adff2f]/15 flex items-center justify-center border border-[#adff2f]/30">
              <Flame className="w-5.5 h-5.5 text-[#adff2f]" />
            </div>
            <span className="text-[10px] text-lime-200/80 uppercase font-black tracking-wider">Calories Burned</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline text-3xl font-black text-white tracking-tight">
              {totalCalories} <span className="text-base font-medium text-lime-200/70">kcal</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-[#00ffc8] via-[#00e5ff] to-[#adff2f] h-full w-[78%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Workout Logger Toggle */}
      <div className="flex justify-between items-center bg-[#041a14]/60 p-4 rounded-2xl border border-[#00ffc8]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ffc8]/15 flex items-center justify-center border border-[#00ffc8]/30">
            <Footprints className="w-5 h-5 text-[#00ffc8]" />
          </div>
          <div>
            <h3 className="font-headline text-sm font-extrabold text-white uppercase tracking-wide">
              Activity Log
            </h3>
            <p className="text-xs text-emerald-200/70 font-medium">Record a walking, jogging, or sprinting session</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddLog(!showAddLog)}
          className="bg-[#00ffc8] hover:bg-[#00e5ff] text-black font-headline font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,255,200,0.25)]"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddLog ? "Close Form" : "Log Session"}</span>
        </button>
      </div>

      {/* Manual Form Box */}
      {showAddLog && (
        <div className="glass-panel-glow p-6 rounded-2xl border-[#00ffc8]/40 bg-[#041a14]/95 animate-fadeIn">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#00ffc8]" />
              <h3 className="font-headline text-base font-extrabold text-white uppercase tracking-wider">
                Log Workout Session
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmitLog} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Activity Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Steps Count
                </label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Avg. Pace (/km)
                </label>
                <input
                  type="text"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-200/80 uppercase font-black mb-1.5">
                  Session Notes
                </label>
                <input
                  type="text"
                  placeholder="Great pace, scenic route, smooth pavement!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3 rounded-xl transition-all uppercase tracking-wider shadow-[0_4px_20px_rgba(0,255,200,0.3)]"
            >
              Confirm &amp; Log Workout
            </button>
          </form>
        </div>
      )}

      {/* Fitness Trends Section */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-lg font-extrabold text-white tracking-tight">Fitness Metrics</h3>
          <span className="text-xs text-[#00ffc8] font-black uppercase tracking-wider">Live Sync</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Average Pace */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00ffc8]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00ffc8]/15 flex items-center justify-center shrink-0 border border-[#00ffc8]/30">
              <Gauge className="w-6 h-6 text-[#00ffc8]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-black">Avg. Pace</div>
              <div className="font-headline text-xl font-black text-white">6'12" /km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00ffc8]/15 text-[#00ffc8] font-bold px-3 py-1 rounded-full border border-[#00ffc8]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Optimal Rhythm</span>
            </div>
          </div>

          {/* Average Heart Rate */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-[#00e5ff]/30 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 flex items-center justify-center shrink-0 border border-[#00e5ff]/30">
              <Heart className="w-6 h-6 text-[#00e5ff]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-cyan-200/80 uppercase tracking-widest font-black">Heart Rate Aerobic Zone</div>
              <div className="font-headline text-xl font-black text-white">128 bpm</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-[#00e5ff]/15 text-[#00e5ff] font-bold px-3 py-1 rounded-full border border-[#00e5ff]/25">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Fat Burning Zone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Timeline */}
      <div id="session-activity-logs" className="scroll-mt-24">
        <h3 className="font-headline text-lg font-extrabold text-white tracking-tight mb-4">
          Session Activity Logs
        </h3>
        {logs.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-sm text-emerald-200/60 font-medium">
            No activities recorded yet. Log a workout or start a route session above!
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="glass-panel p-4.5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-all border-[#00ffc8]/15"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    log.type === "Walking" 
                      ? "bg-[#00ffc8]/15 text-[#00ffc8] border-[#00ffc8]/30" 
                      : log.type === "Jogging"
                      ? "bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30"
                      : "bg-[#adff2f]/15 text-[#adff2f] border-[#adff2f]/30"
                  }`}>
                    <Footprints className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-sm font-extrabold text-white">
                        {log.type} Trail Workout
                      </span>
                      <span className="text-[10px] bg-white/10 text-emerald-200/90 px-2.5 py-0.5 rounded-full font-mono">
                        {log.date}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-emerald-200/80 mt-1 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-4 md:gap-8 text-left max-w-lg w-full md:w-auto bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Distance</div>
                    <div className="text-xs font-black text-[#00ffc8]">{log.distanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Steps</div>
                    <div className="text-xs font-black text-white">{log.steps.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Time</div>
                    <div className="text-xs font-black text-[#00e5ff]">{log.durationMin}m</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Calories</div>
                    <div className="text-xs font-black text-[#adff2f]">{log.calories} kcal</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
