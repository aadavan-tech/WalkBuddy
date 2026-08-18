import React from "react";

interface LoopLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textClassName?: string;
  glow?: boolean;
}

/**
 * Loop mark: two overlapping rings forming a vertical figure-eight — a loop
 * within a loop, standing in for both a trail loop and a circle of buddies.
 * Solid ink, no accent colour — the mark carries the brand on shape alone.
 */
export default function LoopLogo({
  className = "",
  size = 48,
  showText = false,
  textClassName = "",
  glow = false,
}: LoopLogoProps) {
  const numericSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: numericSize, height: numericSize }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ filter: glow ? "drop-shadow(0 2px 8px rgba(33, 25, 15, 0.35))" : "none" }}
        >
          <circle cx="50" cy="34" r="19" stroke="#21190f" strokeWidth="10" fill="none" />
          <circle cx="50" cy="66" r="19" stroke="#21190f" strokeWidth="10" fill="none" />
        </svg>
      </div>

      {showText && (
        <span className={`font-logo italic font-semibold tracking-tight text-[var(--wb-text)] ${textClassName}`}>
          Loop
        </span>
      )}
    </div>
  );
}
