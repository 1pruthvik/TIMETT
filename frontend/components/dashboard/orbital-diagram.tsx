"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/theme-provider";

interface OrbitNode {
  id: string;
  label: string;
  href: string;
  radius: number; // orbital radius in px
  speed: number;  // angular speed in rad/s
  angle: number;  // initial angle in radians
  initialAngle: number;
}

const NODES_CONFIG: OrbitNode[] = [
  { id: "constraints", label: "Constraints", href: "/constraints", radius: 75, speed: 0.22, angle: 0.2, initialAngle: 0.2 },
  { id: "schedule", label: "Schedule", href: "/timetable", radius: 120, speed: 0.16, angle: 3.4, initialAngle: 3.4 },
  { id: "generate", label: "Generate", href: "/generations", radius: 165, speed: 0.12, angle: 5.2, initialAngle: 5.2 },
  { id: "resources", label: "Resources", href: "/faculty", radius: 210, speed: 0.09, angle: 1.1, initialAngle: 1.1 },
  { id: "versions", label: "Versions", href: "/versions", radius: 255, speed: 0.07, angle: 4.5, initialAngle: 4.5 },
];

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  speed: number;
}

export function OrbitalDiagram() {
  const router = useRouter();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Nodes state for position calculations
  const nodesRef = useRef<OrbitNode[]>(
    NODES_CONFIG.map((n) => ({ ...n }))
  );
  const [nodePositions, setNodePositions] = useState<
    { id: string; label: string; href: string; x: number; y: number }[]
  >([]);

  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Generate background stars
    const width = 580;
    const height = 580;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const stars: Star[] = Array.from({ length: 65 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 270;
      const isGold = Math.random() > 0.6;
      const isRed = Math.random() > 0.7;
      let color = "#FFFFFF";
      if (isGold) color = isDark ? "#F59E0B" : "#D97706";
      else if (isRed) color = isDark ? "#EF4444" : "#DC2626";

      return {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        size: Math.random() * 2 + 0.8,
        color,
        alpha: Math.random() * 0.7 + 0.3,
        speed: (Math.random() - 0.5) * 0.005,
      };
    });

    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // ── 1. Draw Starfield ──
      stars.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 0.95 || star.alpha < 0.15) star.speed = -star.speed;

        ctx.save();
        ctx.globalAlpha = star.alpha * (isDark ? 0.85 : 0.5);
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.size * 3;
        ctx.shadowColor = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── 2. Draw Central Glow / Nebula ──
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        140
      );
      if (isDark) {
        glowGrad.addColorStop(0, "rgba(197, 59, 76, 0.28)");
        glowGrad.addColorStop(0.5, "rgba(159, 29, 46, 0.12)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(159, 29, 46, 0.15)");
        glowGrad.addColorStop(0.5, "rgba(197, 59, 76, 0.06)");
        glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
      ctx.fill();

      // ── 3. Draw Orbit Rings ──
      nodesRef.current.forEach((node) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Accent orbit glow line
        ctx.beginPath();
        ctx.arc(centerX, centerY, node.radius, node.angle - 0.4, node.angle + 0.4);
        ctx.strokeStyle = isDark
          ? "rgba(245, 158, 11, 0.25)"
          : "rgba(159, 29, 46, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // ── 4. Update Node Positions ──
      const newPos: { id: string; label: string; href: string; x: number; y: number }[] = [];

      nodesRef.current.forEach((node) => {
        // Pause movement if hovered
        if (hoveredNode !== node.id) {
          node.angle += node.speed * delta;
        }

        const x = centerX + Math.cos(node.angle) * node.radius;
        const y = centerY + Math.sin(node.angle) * node.radius;

        newPos.push({
          id: node.id,
          label: node.label,
          href: node.href,
          x,
          y,
        });

        // Draw small planet glowing dot on orbit track
        ctx.save();
        ctx.fillStyle = isDark ? "#F59E0B" : "#9F1D2E";
        ctx.shadowBlur = 8;
        ctx.shadowColor = isDark ? "#F59E0B" : "#9F1D2E";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      setNodePositions(newPos);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark, hoveredNode]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-[580px] overflow-hidden select-none"
    >
      {/* Canvas for Orbit Rings & Stars */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full pointer-events-none"
        style={{ width: "580px", height: "580px" }}
      />

      {/* Central Sun Disk with T Logo */}
      <div className="absolute z-10 flex size-20 items-center justify-center rounded-full bg-black dark:bg-[#07070C] border border-[#F59E0B]/40 shadow-[0_0_35px_rgba(197,59,76,0.35)] transition-transform duration-300 hover:scale-105">
        <span className="font-heading text-3xl font-bold italic text-[#F59E0B] tracking-tight">
          T
        </span>
      </div>

      {/* Orbiting Interactive Planet Pills */}
      {nodePositions.map((node) => {
        const isHovered = hoveredNode === node.id;
        return (
          <button
            key={node.id}
            onClick={() => router.push(node.href)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className={`absolute z-20 flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-150 cursor-pointer ${
              isDark
                ? "border-white/15 bg-black/75 text-foreground hover:border-[#F59E0B] hover:bg-black/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "border-black/10 bg-white/85 text-foreground hover:border-[#9F1D2E] hover:bg-white hover:shadow-[0_0_20px_rgba(159,29,46,0.2)]"
            } ${isHovered ? "scale-110 z-30" : "scale-100"}`}
            style={{
              transform: `translate(${node.x - 290}px, ${node.y - 290}px) translate(-50%, -50%) ${
                isHovered ? "scale(1.1)" : "scale(1)"
              }`,
            }}
          >
            <span className="size-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
            {node.label}
          </button>
        );
      })}
    </div>
  );
}
