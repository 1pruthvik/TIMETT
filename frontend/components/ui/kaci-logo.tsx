"use client";

import React from "react";

interface KaciLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  glow?: boolean;
}

export function KaciLogo({
  size = 24,
  className = "",
  glow = false,
  ...props
}: KaciLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${glow ? "drop-shadow-[0_0_12px_rgba(168,85,247,0.65)]" : ""} ${className}`}
      {...props}
    >
      <defs>
        {/* Outer Radiant Gradient */}
        <linearGradient id="kaci-outer-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="45%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Inner Core Cyber Glow */}
        <linearGradient id="kaci-core-grad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Accent Sparkle Gradient */}
        <linearGradient id="kaci-spark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Glass reflection filter */}
        <radialGradient id="kaci-specular" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Hex-Octagonal Energy Shield */}
      <rect
        x="5"
        y="5"
        width="38"
        height="38"
        rx="12"
        fill="url(#kaci-outer-grad)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />

      {/* Cybernetic Geometric Circuit Lattice */}
      <circle cx="24" cy="24" r="14" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="3 2" />

      {/* Central Holographic 'K' Neural Node */}
      <path
        d="M17 14V34M17 24H21L29 14M22 24L31 34"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cybernetic Intelligence Spark Dots */}
      <circle cx="31" cy="14" r="2.2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="31" cy="34" r="2.2" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="17" cy="14" r="2" fill="#34D399" />
      <circle cx="17" cy="34" r="2" fill="#38BDF8" />

      {/* Dynamic AI Quantum Sparkle Star */}
      <path
        d="M37 9L38 12L41 13L38 14L37 17L36 14L33 13L36 12L37 9Z"
        fill="url(#kaci-spark-grad)"
      />

      {/* Top Glass Specular Shine */}
      <rect
        x="6"
        y="6"
        width="36"
        height="20"
        rx="10"
        fill="url(#kaci-specular)"
        opacity="0.6"
      />
    </svg>
  );
}
