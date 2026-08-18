import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("py-16 text-center", className)}>
      <div className="relative mx-auto size-8 mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#38BDF8] animate-spin" />
      </div>
      <p className="text-sm text-[#64748B]">{text}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 flex-1 rounded bg-white/[0.04] tt-shimmer"
              style={{ animationDelay: `${(i * cols + j) * 100}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
