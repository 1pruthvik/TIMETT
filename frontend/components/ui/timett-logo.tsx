import React from "react";

export function TimettLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Top bar front gradient */}
        <linearGradient id="t-top-front" x1="4" y1="4" x2="44" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0070F3" />
          <stop offset="100%" stopColor="#0052FF" />
        </linearGradient>

        {/* Stem front facet */}
        <linearGradient id="t-stem-front" x1="16" y1="16" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0070F3" />
          <stop offset="50%" stopColor="#0052FF" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* 3D Isometric fold shadow */}
        <linearGradient id="t-fold-shadow" x1="28" y1="10" x2="16" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#003bb5" />
          <stop offset="100%" stopColor="#0B1B4F" />
        </linearGradient>

        {/* Specular cyan edge shine */}
        <linearGradient id="t-specular" x1="6" y1="4" x2="20" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0070F3" stopOpacity="0.1" />
        </linearGradient>

        {/* Drop glow filter */}
        <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0070F3" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#cyan-glow)">
        {/* Left top wing */}
        <path
          d="M 6 8 L 24 16 L 24 24 L 6 16 Z"
          fill="url(#t-top-front)"
        />

        {/* Right top wing */}
        <path
          d="M 24 16 L 42 8 L 42 16 L 24 24 Z"
          fill="url(#t-top-front)"
        />

        {/* Top horizontal plate */}
        <path
          d="M 6 8 L 24 4 L 42 8 L 24 16 Z"
          fill="#38BDF8"
        />

        {/* Center stem left facet */}
        <path
          d="M 18 20 L 24 23 L 24 44 L 18 40 Z"
          fill="url(#t-specular)"
        />

        {/* Center stem right facet (3D depth) */}
        <path
          d="M 24 23 L 30 20 L 30 40 L 24 44 Z"
          fill="url(#t-fold-shadow)"
        />

        {/* Center stem front bevel */}
        <path
          d="M 20 22 L 28 22 L 28 41 L 20 41 Z"
          fill="url(#t-stem-front)"
        />
      </g>
    </svg>
  );
}
