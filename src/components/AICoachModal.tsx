import React, { useState } from "react";
import { Sparkles, X, Clock, Flame, Heart, Play, Activity, ListChecks, Trees } from "lucide-react";
import { AIPersonalPlan } from "../types";

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommitWorkout: (plan: AIPersonalPlan) => void;
}

const encouragingMessages = [
  "Connecting with Gemini performance AI...",
  "Analyzing cardiovascular pacing & stamina targets...",
  "Designing custom interval pacing stages...",
  "Formatting mental mindfulness & aerobic burn goals...",
  "Ready to launch your custom walking workout!"
];

export default function AICoachModal({ isOpen, onClose, onCommitWorkout }: AICoachModalProps) {
  const [activityType, setActivityType] = useState("Walking");
  const [energyLevel, setEnergyLevel] = useState("Moderate");
  const [availableTime, setAvailableTime] = useState("30");
  const [focusGoal, setFocusGoal] = useState("Cardio fitness, stamina & active posture");

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [plan, setPlan] = useState<AIPersonalPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    setLoading(true);
    setPlan(null);
    setError(null);

    let step = 0;
    setLoadingStep(0);
    const interval = setInterval(() => {
      step = (step + 1) % encouragingMessages.length;
      setLoadingStep(step);
    }, 1800);

    try {
      const response = await fetch("/api/gemini/plan-walk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityType,
          energyLevel,
          availableTime,
          focusGoal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact server AI endpoint");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setPlan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during planning.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#041a14] border border-[#00ffc8]/30 rounded-2xl shadow-[0_10px_60px_rgba(0,255,200,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#00ffc8]/20 bg-[#06241b]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00ffc8] fill-current" />
            <h3 className="font-headline text-base font-extrabold uppercase tracking-wider text-white">
              WalkBuddy Performance AI Coach
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200/60 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {!plan && !loading && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#00ffc8]/10 border border-[#00ffc8]/30 text-xs text-emerald-100/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-[#00ffc8] shrink-0 mt-0.5" />
                <span>
                  Consult the WalkBuddy AI coach! Powered by Gemini, we will generate a custom walking plan with interval pacing, target heart rate zones, and active posture tips.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Activity Type */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-bold mb-1.5">
                    Activity Intensity
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Walking", "Jogging", "Sprinting"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActivityType(type)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          activityType === type
                            ? "bg-[#00ffc8] text-black border-[#00ffc8] shadow-[0_0_15px_rgba(0,255,200,0.4)]"
                            : "bg-white/5 text-emerald-100/60 border-white/5 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-bold mb-1.5">
                    Workout Time
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {["15", "30", "45", "60", "90"].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAvailableTime(time)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          availableTime === time
                            ? "bg-[#00e5ff] text-black border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                            : "bg-white/5 text-emerald-100/60 border-white/5 hover:text-white"
                        }`}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-bold mb-1.5">
                    Current Energy Levels
                  </label>
                  <select
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                  >
                    <option value="Low (Recovering or tired)">Low (Recovering or tired)</option>
                    <option value="Moderate (Active ready)">Moderate (Active ready)</option>
                    <option value="High (Athletic mood)">High (Athletic mood)</option>
                    <option value="Elite (Firefly beast mode)">Elite (Firefly beast mode)</option>
                  </select>
                </div>

                {/* Focus Goal */}
                <div>
                  <label className="block text-[10px] text-emerald-200/80 uppercase font-bold mb-1.5">
                    Mindfulness Focus Goal
                  </label>
                  <input
                    type="text"
                    value={focusGoal}
                    onChange={(e) => setFocusGoal(e.target.value)}
                    placeholder="e.g. Firefly breathing, night vision, cardio burn"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffc8]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGeneratePlan}
                className="w-full bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(0,255,200,0.3)] active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Generate AI Forest Plan</span>
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-t-[#00ffc8] border-[#00ffc8]/20 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#00e5ff]" />
              </div>
              <div className="space-y-1.5">
                <p className="font-headline text-sm font-bold text-white uppercase tracking-wider">
                  Generating Gemini Forest Session...
                </p>
                <p className="text-xs text-emerald-200/80 max-w-sm">
                  {encouragingMessages[loadingStep]}
                </p>
              </div>
            </div>
          )}

          {/* Generated Plan */}
          {plan && !loading && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#06241b] to-black border border-[#00ffc8]/30 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-[#00ffc8]/15 border border-[#00ffc8]/30 px-3 py-1 rounded-full text-[10px] font-bold text-[#00ffc8]">
                  Gemini Tailored
                </div>
                
                <h4 className="font-headline text-lg font-black text-[#00ffc8] uppercase tracking-tight italic">
                  {plan.title}
                </h4>

                <p className="text-xs text-emerald-100/90 mt-2 italic leading-relaxed">
                  "{plan.motivationalQuote}"
                </p>

                <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-4 text-center">
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Warmup</div>
                    <div className="text-sm font-bold text-white">{plan.warmupMinutes} min</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Est. Burn</div>
                    <div className="text-sm font-bold text-[#adff2f]">{plan.estimatedCalories} kcal</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-200/60 uppercase font-bold">Cooldown</div>
                    <div className="text-sm font-bold text-[#00e5ff]">{plan.cooldownMinutes} min</div>
                  </div>
                </div>
              </div>

              {/* Mindfulness Tip */}
              <div className="p-4 rounded-xl bg-[#00ffc8]/10 border border-[#00ffc8]/30 flex gap-3 items-start">
                <Heart className="w-5 h-5 text-[#00ffc8] shrink-0 fill-current mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#00ffc8] uppercase font-black tracking-widest block mb-1">
                    Bioluminescent Forest Mindfulness
                  </span>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {plan.mindfulnessTip}
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h5 className="font-headline text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-[#00ffc8]" />
                  <span>Interactive Workout Stages</span>
                </h5>
                <div className="space-y-2.5">
                  {plan.mainWorkout.map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-black/40 p-3.5 rounded-xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-[#00ffc8]/15 text-[#00ffc8] font-mono text-xs flex items-center justify-center shrink-0 border border-[#00ffc8]/30">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interval Pacing Table */}
              <div className="space-y-3">
                <h5 className="font-headline text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#00e5ff]" />
                  <span>Interval Pacing Table</span>
                </h5>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#06241b]/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-emerald-200/70 uppercase text-[9px] font-extrabold tracking-wider">
                        <th className="py-2.5 px-3">Stage Phase</th>
                        <th className="py-2.5 px-3">Target Pace</th>
                        <th className="py-2.5 px-3 text-right">Intensity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {plan.intervalPacing.map((pacing, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-semibold text-white">{pacing.stage}</td>
                          <td className="py-2.5 px-3 text-[#00ffc8] font-mono">{pacing.pace}</td>
                          <td className="py-2.5 px-3 text-[#00e5ff] text-right font-bold">{pacing.intensity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPlan(null)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-emerald-100 font-headline font-bold text-xs rounded-xl uppercase transition-all text-center"
                >
                  Adjust Parameters
                </button>
                <button
                  type="button"
                  onClick={() => onCommitWorkout(plan)}
                  className="w-full py-3 bg-gradient-to-r from-[#00ffc8] to-[#00e5ff] text-black font-headline font-black text-xs rounded-xl uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(0,255,200,0.3)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Commit Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
