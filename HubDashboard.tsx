import React, { useState } from "react";
import { 
  Footprints, 
  MapPin, 
  Flame, 
  Sparkles, 
  Compass, 
  Heart, 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  Calendar, 
  Gauge, 
  Clock,
  LogOut,
  Dumbbell
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
  const [distance, setDistance] = useState("4.2");
  const [steps, setSteps] = useState("6100");
  const [calories, setCalories] = useState("280");
  const [duration, setDuration] = useState("35");
  const [pace, setPace] = useState("8:20");
  const [heartRate, setHeartRate] = useState("115");
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
    
    // Reset Form & Close
    setShowAddLog(false);
    setNotes("");
  };

  // Compute stats totals based on history or defaults
  const totalSteps = logs.reduce((sum, log) => sum + log.steps, 12482);
  const totalDistance = parseFloat(logs.reduce((sum, log) => sum + log.distanceKm, 8.4).toFixed(1));
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 642);

  return (
    <div className="w-full space-y-8">
      {/* Dynamic Header Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Steps Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#c3f400]/30 hover:shadow-lg hover:shadow-black/25 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-[#c3f400]/15 flex items-center justify-center">
              <Footprints className="w-5.5 h-5.5 text-[#c3f400]" />
            </div>
            <span className="text-[10px] text-[#c6c6ca] uppercase font-extrabold tracking-wider">Steps</span>
          </div>
          <div>
            <div className="font-headline text-3xl font-extrabold text-white tracking-tight">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#c3f400] font-bold mt-1">
              +12% vs Yesterday
            </div>
          </div>
        </div>

        {/* Distance Tile */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#3cddc7]/30 hover:shadow-lg hover:shadow-black/25 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-[#3cddc7]/15 flex items-center justify-center">
              <Compass className="w-5.5 h-5.5 text-[#3cddc7]" />
            </div>
            <span className="text-[10px] text-[#c6c6ca] uppercase font-extrabold tracking-wider">Distance</span>
          </div>
          <div>
            <div className="font-headline text-3xl font-extrabold text-white tracking-tight">
              {totalDistance} <span className="text-base font-normal text-[#c6c6ca]">km</span>
            </div>
            <div className="text-[11px] text-[#c6c6ca] font-bold mt-1">
              Goal: 10.0km
            </div>
          </div>
        </div>

        {/* Calories Tile */}
        <div className="col-span-2 md:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between h-40 group hover:border-[#ffb4ab]/30 hover:shadow-lg hover:shadow-black/25 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-[#ffb4ab]/15 flex items-center justify-center">
              <Flame className="w-5.5 h-5.5 text-[#ffb4ab]" />
            </div>
            <span className="text-[10px] text-[#c6c6ca] uppercase font-extrabold tracking-wider">Calories</span>
          </div>
          <div>
            <div className="font-headline text-3xl font-extrabold text-white tracking-tight">
              {totalCalories} <span className="text-base font-normal text-[#c6c6ca]">kcal</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-[#3cddc7] to-[#c3f400] h-full w-[70%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Log Form overlay */}

      {/* Expandable Manual Log Form overlay */}
      {showAddLog && (
        <div className="glass-panel p-6 rounded-2xl border-[#3cddc7]/30 bg-black/90">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#3cddc7]" />
              <h3 className="font-headline text-base font-bold text-white uppercase tracking-wider">
                Log a New Session
              </h3>
            </div>
            <button
              onClick={() => setShowAddLog(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitLog} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                >
                  <option value="Walking">Walking</option>
                  <option value="Jogging">Jogging</option>
                  <option value="Sprinting">Sprinting</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Steps Count
                </label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Pace (/km)
                </label>
                <input
                  type="text"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#c6c6ca] uppercase font-bold mb-1.5">
                  Notes / Mood
                </label>
                <input
                  type="text"
                  placeholder="Super fresh, high energy!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3cddc7]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#3cddc7] hover:bg-[#00bda6] text-black font-headline font-bold text-xs py-2.5 rounded-xl transition-all uppercase"
            >
              Confirm Log
            </button>
          </form>
        </div>
      )}

      {/* Fitness Trends Section */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-lg font-bold text-white tracking-tight">Trends</h3>
          <span className="text-xs text-[#c3f400] font-bold">Updated Live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Average Pace */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#c3f400]/10 flex items-center justify-center shrink-0">
              <Gauge className="w-6 h-6 text-[#c3f400]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-[#c6c6ca] uppercase tracking-widest font-bold">Avg. Pace</div>
              <div className="font-headline text-xl font-bold text-white">5'24" /km</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Speeding up</span>
            </div>
          </div>

          {/* Average Heart Rate */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#ffb4ab]/10 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-[#ffb4ab]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-[#c6c6ca] uppercase tracking-widest font-bold">Avg. Heart Rate</div>
              <div className="font-headline text-xl font-bold text-white">142 bpm</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 font-bold px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Optimal aerobic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Feed Timeline */}
      <div>
        <h3 className="font-headline text-lg font-bold text-white tracking-tight mb-4">
          Session Activity Logs
        </h3>
        {logs.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-sm text-gray-500">
            No logged walks yet. Log a workout or start an AI guided session above!
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    log.type === "Walking" 
                      ? "bg-[#c3f400]/15 text-[#c3f400]" 
                      : log.type === "Jogging"
                      ? "bg-[#3cddc7]/15 text-[#3cddc7]"
                      : "bg-[#ffb4ab]/15 text-[#ffb4ab]"
                  }`}>
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-sm font-extrabold text-white">
                        {log.type} Workout
                      </span>
                      <span className="text-[10px] bg-white/5 text-[#c6c6ca] px-2 py-0.5 rounded-full font-mono">
                        {log.date}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-4 md:gap-8 text-left max-w-lg w-full md:w-auto">
                  <div>
                    <div className="text-[9px] text-[#c6c6ca] uppercase font-bold">Dist</div>
                    <div className="text-xs font-bold text-white">{log.distanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#c6c6ca] uppercase font-bold">Steps</div>
                    <div className="text-xs font-bold text-white">{log.steps.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#c6c6ca] uppercase font-bold">Time</div>
                    <div className="text-xs font-bold text-white">{log.durationMin}m</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#c6c6ca] uppercase font-bold">Calories</div>
                    <div className="text-xs font-bold text-white">{log.calories} kcal</div>
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
