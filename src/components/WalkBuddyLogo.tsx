import React from "react";

interface WalkBuddyLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textClassName?: string;
  glow?: boolean;
}

/**
 * WalkBuddy Official 3D Emblem Logo
 * Features the signature 3D cyan 'W' ribbon with speed trails on the left
 * and two synchronized athletic runners springing forward above the ribbon.
 */
export default function WalkBuddyLogo({
  className = "",
  size = 48,
  showText = false,
  textClassName = "",
  glow = true,
}: WalkBuddyLogoProps) {
  const numericSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ width: numericSize, height: numericSize }}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ filter: glow ? "var(--wb-logo-glow)" : "none" }}
        >
          <defs>
            {/* Signature Ribbon / W Trail Gradient */}
            <linearGradient id="wbRibbonMain" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--wb-logo-main-0)" />
              <stop offset="50%" stopColor="var(--wb-logo-main-45)" />
              <stop offset="100%" stopColor="var(--wb-logo-main-85)" />
            </linearGradient>

            {/* Lead Runner Gradient */}
            <linearGradient id="wbRunnerLead" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--wb-logo-runner-0)" />
              <stop offset="100%" stopColor="var(--wb-logo-runner-100)" />
            </linearGradient>

            {/* Trail Runner Gradient */}
            <linearGradient id="wbRunnerFollow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--wb-logo-accent-1)" />
              <stop offset="100%" stopColor="var(--wb-logo-accent-2)" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="wbGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#wbGlow)">
            {/* 1. CLEAN W-SHAPED MOTION TRAIL */}
            {/* Accent speed stroke */}
            <path
              d="M 18,136 Q 38,158 58,152 T 98,118"
              stroke="url(#wbRibbonMain)"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.45"
              fill="none"
            />

            {/* Primary bold W trail */}
            <path
              d="M 28,124 
                 C 42,154 62,172 82,150 
                 C 98,132 110,118 122,128 
                 C 136,140 152,156 168,132 
                 C 178,118 186,96 190,82"
              stroke="url(#wbRibbonMain)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Glossy highlight along upper ribbon curve */}
            <path
              d="M 32,122 
                 C 44,150 60,166 80,146 
                 C 96,130 108,116 122,126 
                 C 134,136 150,152 166,128 
                 C 176,114 184,94 188,80"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.55"
              fill="none"
            />

            {/* 2. TRAIL RUNNER (SMALLER, FOLLOWING BUDDY - LEFT) */}
            {/* Head */}
            <circle cx="76" cy="68" r="8" fill="url(#wbRunnerFollow)" />

            {/* Torso */}
            <path
              d="M 76,78 L 66,100"
              stroke="url(#wbRunnerFollow)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />

            {/* Arms */}
            <path
              d="M 74,82 L 58,88"
              stroke="url(#wbRunnerFollow)"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 74,82 L 86,78 L 92,86"
              stroke="url(#wbRunnerFollow)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Legs */}
            <path
              d="M 66,100 L 52,112 L 44,122"
              stroke="url(#wbRunnerFollow)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 66,100 L 80,110 L 76,126"
              stroke="url(#wbRunnerFollow)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* 3. LEAD RUNNER (LARGER, SPRINTING AHEAD - RIGHT) */}
            {/* Head */}
            <circle cx="138" cy="42" r="11" fill="url(#wbRunnerLead)" />

            {/* Torso */}
            <path
              d="M 138,55 L 124,84"
              stroke="url(#wbRunnerLead)"
              strokeWidth="9.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Arms */}
            <path
              d="M 135,62 L 115,70"
              stroke="url(#wbRunnerLead)"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 135,62 L 155,54 L 165,64"
              stroke="url(#wbRunnerLead)"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Legs */}
            <path
              d="M 124,84 L 104,98 L 94,112"
              stroke="url(#wbRunnerLead)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 124,84 L 144,98 L 138,118"
              stroke="url(#wbRunnerLead)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <span
          className={`font-headline font-black italic tracking-tighter wb-logo-text ${textClassName}`}
        >
          WalkBuddy
        </span>
      )}
    </div>
  );
}
