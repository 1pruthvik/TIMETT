import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  label?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  label,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "tt-floating-glass group relative overflow-hidden rounded-2xl p-5",
        "transition-all duration-300 hover:-translate-y-1.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="tt-eyebrow text-muted-foreground">
            {title}
          </p>
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {loading ? (
              <div className="h-8 w-16 rounded-md bg-muted/60 animate-pulse" />
            ) : (
              value
            )}
          </div>
          {label && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-foreground px-2 py-0.5 text-[10px] font-semibold border border-border">
                <span className="size-1.5 rounded-full bg-[#0066FF] dark:bg-[#38BDF8] shadow-[0_0_6px_#38BDF8] animate-pulse" />
                {label}
              </span>
            </div>
          )}
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-foreground border border-border transition-all duration-300 group-hover:scale-110">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
