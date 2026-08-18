import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: string;
}

export function GlassPanel({
  className,
  children,
  hover = true,
  glow,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "tt-floating-glass relative rounded-2xl",
        hover && "hover:-translate-y-1 hover:scale-[1.003]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
