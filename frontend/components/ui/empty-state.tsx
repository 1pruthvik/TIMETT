import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-16 text-center tt-animate-in", className)}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#475569] mb-4">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
