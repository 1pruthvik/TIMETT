import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleAlert, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReadinessStatus = "ready" | "warning" | "blocked";

export interface ReadinessItem {
  label: string;
  detail: string;
  status: ReadinessStatus;
  href: string;
}

const styles = {
  ready: { icon: CheckCircle2, label: "Ready", className: "text-emerald-400 bg-emerald-400/8 border-emerald-400/15" },
  warning: { icon: AlertTriangle, label: "Needs attention", className: "text-amber-300 bg-amber-300/8 border-amber-300/15" },
  blocked: { icon: CircleAlert, label: "Blocked", className: "text-rose-300 bg-rose-300/8 border-rose-300/15" },
};

export function SchedulingReadiness({ items }: { items: ReadinessItem[] }) {
  const resolved = items.filter((item) => item.status === "ready").length;
  const percentage = Math.round((resolved / Math.max(items.length, 1)) * 100);

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[#101018]/72 p-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,.9)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Scheduling readiness</p>
          <p className="mt-1 text-xs text-zinc-500">A live checklist for your next solver run.</p>
        </div>
        <span className="font-mono text-sm font-semibold text-[#e7a5ad]">{percentage}%</span>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-label={`${percentage}% ready`}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#a42b3a] to-[#d26b57] transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-5 divide-y divide-white/[0.06]">
        {items.map((item) => {
          const config = styles[item.status];
          const Icon = config.icon;
          return (
            <Link key={item.label} href={item.href} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg border", config.className)}><Icon className="size-3.5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-zinc-200">{item.label}</span><span className="block truncate text-[11px] text-zinc-500">{item.detail}</span></span>
              <span className={cn("hidden text-[10px] font-medium sm:block", config.className.split(" ")[0])}>{config.label}</span>
              <ArrowUpRight className="size-3.5 text-zinc-600 transition group-hover:text-[#e7a5ad]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
