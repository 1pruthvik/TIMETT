"use client";

import React from "react";

interface KaciLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  glow?: boolean;
  colorVariant?: "gradient" | "white" | "current";
}

export function KaciLogo({
  size = 24,
  className = "",
  glow = true,
  colorVariant = "gradient",
  ...props
}: KaciLogoProps) {
  const strokeColor =
    colorVariant === "white"
      ? "#FFFFFF"
      : colorVariant === "current"
      ? "currentColor"
      : "url(#kaci-brand-gradient)";

  const eyeColor =
    colorVariant === "white"
      ? "#FFFFFF"
      : colorVariant === "current"
      ? "currentColor"
      : "url(#kaci-brand-gradient)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${glow ? "drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" : ""} ${className}`}
      {...props}
    >
      <defs>
        {/* Modern Vibrant Purple -> Violet -> Cyan Gradient */}
        <linearGradient id="kaci-brand-gradient" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="45%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* 1. Antenna: Top Sphere & Stem */}
      <circle cx="24" cy="7.5" r="2.2" fill={strokeColor} />
      <path
        d="M24 9.7V12.5"
        stroke={strokeColor}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* 2. Top Dome (Head) */}
      <path
        d="M13.5 20.5C13.5 14.8 18 12.5 24 12.5C30 12.5 34.5 14.8 34.5 20.5"
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* 3. Horizontal Orbital Visor Ring with Rounded Capsule Caps */}
      <path
        d="M34.5 20.5C38.2 20.5 41 22.3 41 24.5C41 26.7 38.2 28.5 34.5 28.5H13.5C9.8 28.5 7 26.7 7 24.5C7 22.3 9.8 20.5 13.5 20.5H34.5Z"
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Two Glowing Mascot Eye Spheres */}
      <circle cx="19" cy="24.5" r="2.4" fill={eyeColor} />
      <circle cx="29" cy="24.5" r="2.4" fill={eyeColor} />

      {/* 5. Bottom Chin Arc */}
      <path
        d="M14.2 28.5C14.2 34 18.5 38.5 24 38.5C29.5 38.5 33.8 34 33.8 28.5"
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
