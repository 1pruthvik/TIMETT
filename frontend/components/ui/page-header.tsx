import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between tt-animate-in", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon className="size-5 text-muted-foreground stroke-[1.75]" />
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-[#64748B]">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
