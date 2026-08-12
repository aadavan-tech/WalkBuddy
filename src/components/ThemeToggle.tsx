import React from "react";
import { Sun, Moon } from "lucide-react";
import type { Theme } from "../lib/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  /** Adds a "Light"/"Dark" text label next to the icon. */
  showLabel?: boolean;
}

/**
 * Sliding light/dark switch. Used in the dashboard header and the onboarding
 * header so the theme can be changed from any screen.
 */
export default function ThemeToggle({ theme, onToggle, showLabel = false }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="group flex items-center gap-2 h-10 px-1.5 rounded-xl bg-[var(--wb-card)] dark:bg-[#181f1b] hover:bg-[#d2a649]/10 border border-[var(--wb-line)] dark:border-[#d2a649]/30 active:scale-95 transition-all"
    >
      {/* Track */}
      <span className="relative w-[52px] h-7 rounded-full bg-black/10 dark:bg-black/50 border border-[var(--wb-line)] dark:border-white/10 flex items-center shrink-0">
        {/* Knob */}
        <span
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ease-out shadow-sm ${
            isDark
              ? "translate-x-0.5 bg-[#d2a649] text-black"
              : "translate-x-[23px] bg-[#b58974] text-white"
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </span>
        {/* Rail hints */}
        <Sun
          className={`w-3 h-3 absolute right-1.5 transition-opacity ${
            isDark ? "opacity-50 text-amber-200" : "opacity-0"
          }`}
        />
        <Moon
          className={`w-3 h-3 absolute left-1.5 transition-opacity ${
            isDark ? "opacity-0" : "opacity-50 text-slate-700"
          }`}
        />
      </span>

      {showLabel && (
        <span className="text-[11px] font-black uppercase tracking-wider text-[var(--wb-text)] dark:text-amber-100 pr-1.5">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
