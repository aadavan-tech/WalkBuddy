import React from "react";
import { useNavigate } from "react-router-dom";
import { Footprints, Dumbbell } from "lucide-react";
import LoopLogo from "./LoopLogo";

/**
 * Landing page — the app entry point. Presents two options:
 * "Running" (routes to /running → AuthGate → WalkBuddy) and
 * "Fitness" (routes to /fitness → coming-soon placeholder).
 *
 * Public — no auth required to view this page.
 */
export default function LandingSelect() {
  const navigate = useNavigate();

  const options = [
    {
      id: "running",
      label: "Running",
      description: "Track routes, find buddies, and log your outdoor sessions.",
      icon: Footprints,
      route: "/running",
    },
    {
      id: "fitness",
      label: "Fitness",
      description: "Workouts, training plans, and strength tracking.",
      icon: Dumbbell,
      route: "/fitness",
    },
  ];

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

      <div className="relative z-10 w-full max-w-md space-y-10 flex flex-col items-center">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <LoopLogo size={64} glow />
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--wb-text)]">
            Welcome to Loop
          </h1>
          <p className="text-sm text-[var(--wb-text-soft)] text-center max-w-xs leading-relaxed">
            Choose how you'd like to get started today.
          </p>
        </div>

        {/* Selection cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => navigate(opt.route)}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border border-[var(--wb-line)] bg-[var(--wb-card)] hover:bg-[var(--wb-surface-alt)] transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--wb-surface)] border border-[var(--wb-line)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Icon className="w-7 h-7 text-[var(--wb-text)]" strokeWidth={2} />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="font-headline text-lg font-extrabold uppercase tracking-wider text-[var(--wb-text)]">
                    {opt.label}
                  </h2>
                  <p className="text-xs text-[var(--wb-text-soft)] leading-relaxed max-w-[200px]">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-[var(--wb-text-soft)]/60 text-center">
          Loop — Outdoor fitness, together.
        </p>
      </div>
    </div>
  );
}
