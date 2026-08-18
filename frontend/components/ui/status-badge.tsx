import * as React from "react";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "error" | "info" | "running" | "default";

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  running: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  default: "bg-white/[0.04] text-[#94A3B8] border-white/[0.06]",
};

const dotColors: Record<StatusVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-sky-400",
  running: "bg-cyan-400",
  default: "bg-[#64748B]",
};

export function StatusBadge({
  variant = "default",
  children,
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        variantStyles[variant],
        className
      )}
    >
      <span className="relative flex size-1.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-75",
              dotColors[variant]
            )}
          />
        )}
        <span
          className={cn("relative inline-flex size-1.5 rounded-full", dotColors[variant])}
        />
      </span>
      {children}
    </span>
  );
}
