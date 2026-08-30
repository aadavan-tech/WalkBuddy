import React from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ChevronLeft } from "lucide-react";
import LoopLogo from "./LoopLogo";

/**
 * Placeholder page for the Fitness section.
 * Shows a "coming soon" message and a way to navigate back to the landing page.
 */
export default function FitnessComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--wb-bg)] text-[var(--wb-text)] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--wb-text) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8 text-center">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-0 left-0 flex items-center gap-1.5 text-xs font-bold text-[var(--wb-text-soft)] hover:text-[var(--wb-text)] transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-[var(--wb-card)] border border-[var(--wb-line)] flex items-center justify-center">
          <Dumbbell className="w-10 h-10 text-[var(--wb-text)]" strokeWidth={1.5} />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--wb-text)]">
            Coming Soon
          </h1>
          <p className="text-sm text-[var(--wb-text-soft)] leading-relaxed max-w-xs mx-auto">
            We're working hard on the Fitness experience. Stay tuned for
            workouts, training plans, and more.
          </p>
        </div>

        {/* Back to landing */}
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-6 py-3 rounded-xl bg-[var(--wb-text)] text-[var(--wb-surface)] font-headline text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
        >
          Back to Loop
        </button>

        {/* Brand footer */}
        <div className="flex items-center gap-2 opacity-40">
          <LoopLogo size={20} />
          <span className="text-[10px] font-bold tracking-wider uppercase">Loop</span>
        </div>
      </div>
    </div>
  );
}
