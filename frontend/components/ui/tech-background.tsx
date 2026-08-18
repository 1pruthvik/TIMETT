"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/components/theme/theme-provider";

export function TechBackground() {
  const { theme } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const reqRef = useRef<number | null>(null);

  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setMousePos({ x: currentX, y: currentY });
      reqRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    reqRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const isDark = theme === "dark";

  // Parallax layer offsets
  const layer1X = mousePos.x * 20;
  const layer1Y = mousePos.y * 20 - scrollY * 0.12;

  const layer2X = mousePos.x * -30;
  const layer2Y = mousePos.y * -30 - scrollY * 0.2;

  const layer3X = mousePos.x * 35;
  const layer3Y = mousePos.y * 35 - scrollY * 0.08;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Imperial Violet & Purple Nebula (Top-Left) */}
      <div
        className={`absolute -top-[22%] -left-[12%] h-[95vh] w-[95vh] rounded-full blur-[140px] transition-all duration-1000 ${
          isDark
            ? "bg-gradient-to-br from-[#581C87]/45 via-[#7C3AED]/25 to-transparent"
            : "bg-gradient-to-br from-[#7C3AED]/40 via-[#8B5CF6]/25 to-transparent"
        }`}
        style={{
          transform: `translate3d(${layer2X}px, ${layer2Y}px, 0)`,
        }}
      />

      {/* 2. Deep Royal Amethyst / Indigo Nebula (Top-Right) */}
      <div
        className={`absolute -top-[18%] -right-[12%] h-[90vh] w-[90vh] rounded-full blur-[140px] transition-all duration-1000 ${
          isDark
            ? "bg-gradient-to-bl from-[#7E22CE]/35 via-[#6366F1]/20 to-transparent"
            : "bg-gradient-to-bl from-[#6D28D9]/35 via-[#4F46E5]/20 to-transparent"
        }`}
        style={{
          transform: `translate3d(${layer3X}px, ${layer3Y}px, 0)`,
        }}
      />

      {/* 3. Bottom Deep Indigo Void Nebula */}
      <div
        className={`absolute -bottom-[28%] left-[20%] h-[85vh] w-[85vh] rounded-full blur-[150px] transition-all duration-1000 ${
          isDark
            ? "bg-gradient-to-t from-[#3730A3]/25 via-[#6B21A8]/15 to-transparent"
            : "bg-gradient-to-t from-[#4338CA]/30 via-[#581C87]/18 to-transparent"
        }`}
        style={{
          transform: `translate3d(${layer1X * -0.6}px, ${layer1Y * -0.6}px, 0)`,
        }}
      />
    </div>
  );
}
