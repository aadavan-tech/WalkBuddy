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
      className="group flex items-center gap-2 h-10 px-1.5 rounded-xl bg-[#041d16] hover:bg-[#062c21] border border-[#00ffc8]/30 active:scale-95 transition-all"
    >
      {/* Track */}
      <span className="relative w-[52px] h-7 rounded-full bg-black/40 border border-white/10 flex items-center shrink-0">
        {/* Knob */}
        <span
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ease-out ${
            isDark
              ? "translate-x-0.5 bg-[#00e5ff] text-black"
              : "translate-x-[23px] bg-[#f5b301] text-black"
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
            isDark ? "opacity-40 text-emerald-200" : "opacity-0"
          }`}
        />
        <Moon
          className={`w-3 h-3 absolute left-1.5 transition-opacity ${
            isDark ? "opacity-0" : "opacity-40 text-emerald-200"
          }`}
        />
      </span>

      {showLabel && (
        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 pr-1.5">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
