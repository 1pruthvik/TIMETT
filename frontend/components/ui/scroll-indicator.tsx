"use client";

import { useEffect, useState } from "react";

export function ScrollIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(scrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="at-scroll-indicator"
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div className="at-scroll-track">
        <div
          className="at-scroll-fill"
          style={{ height: `${progress * 100}%` }}
        />
        <div
          className="at-scroll-handle"
          style={{ bottom: `${progress * 100}%` }}
        />
      </div>

      {/* Top/Bottom indicators */}
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            progress < 0.05
              ? "bg-[#7c4dff] shadow-[0_0_10px_rgba(124,77,255,0.9)]"
              : "bg-white/15"
          }`}
        />
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            progress > 0.95
              ? "bg-[#e040fb] shadow-[0_0_10px_rgba(224,64,251,0.9)]"
              : "bg-white/15"
          }`}
        />
      </div>
    </div>
  );
}