"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  DoorOpen,
  GraduationCap,
  ClipboardList,
  Sparkles,
  Layers3,
  Settings,
  Search,
  CalendarRange,
  Building2,
  Clock,
  User,
  X,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  desc?: string;
}

const COMMANDS: CommandItem[] = [
  { label: "Dashboard", desc: "Overview, stats & quick actions", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
  { label: "Master Timetable", desc: "Interactive period matrix & conflict checker", href: "/timetable", icon: CalendarDays, group: "Navigation" },
  { label: "AI Generations", desc: "Historical solver generation runs", href: "/generations", icon: Sparkles, group: "Navigation" },
  { label: "Faculty Directory", desc: "Professors, workloads & preferences", href: "/faculty", icon: Users, group: "Academic" },
  { label: "Subjects & Courses", desc: "Curriculum, credit hours & types", href: "/subjects", icon: BookOpen, group: "Academic" },
  { label: "Rooms & Labs", desc: "Capacities, equipment & room types", href: "/rooms", icon: DoorOpen, group: "Academic" },
  { label: "Student Sections", desc: "Batches, student counts & departments", href: "/sections", icon: GraduationCap, group: "Academic" },
  { label: "Optimization Constraints", desc: "Add, toggle or remove CP-SAT rules", href: "/settings", icon: ClipboardList, group: "Optimization" },
  { label: "Timetable Versions", desc: "Compare & publish timetable revisions", href: "/versions", icon: Layers3, group: "Academic" },
  { label: "Academic Terms", desc: "Semesters, sessions & active term", href: "/academic-terms", icon: CalendarRange, group: "Setup" },
  { label: "Departments", desc: "Academic units & disciplines", href: "/departments", icon: Building2, group: "Setup" },
  { label: "Time Slots", desc: "Daily periods & bell schedules", href: "/time-slots", icon: Clock, group: "Setup" },
  { label: "Studio Settings", desc: "Theme, solver config & constraints", href: "/settings", icon: Settings, group: "System" },
  { label: "Account & Profile", desc: "User credentials & organization", href: "/account", icon: User, group: "System" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // CMD/CTRL + K shortcut & Global Event Trigger
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q) ||
        (cmd.desc && cmd.desc.toLowerCase().includes(q))
    );
  }, [query]);

  // Reset activeIndex when filtered changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      handleSelect(filtered[activeIndex].href);
    }
  };

  if (!open) return null;

  // Group items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      {/* Dynamic Frosted Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300" />

      {/* Glass Command Palette Card */}
      <div
        className={cn(
          "relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
          "tt-floating-glass border",
          // Light Mode Glass
          "bg-white/85 text-slate-900 border-white/70 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25),inset_0_1.5px_1px_rgba(255,255,255,1)]",
          // Dark Mode Glass
          "dark:bg-[#070710]/75 dark:text-slate-100 dark:border-white/[0.14] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95),inset_0_1.5px_1px_rgba(255,255,255,0.2)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Specular Purple Glass Gradient Ridge */}
        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-[#3B0764] via-[#7C3AED] to-[#A855F7] dark:from-[#6D28D9] dark:via-[#8B5CF6] dark:to-[#C084FC]" />

        {/* Search Input Box */}
        <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#4C1D95]/10 dark:bg-[#8B5CF6]/15 text-[#4C1D95] dark:text-[#A78BFA] border border-[#4C1D95]/20 dark:border-[#8B5CF6]/30">
            <Search className="size-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, faculty, rooms, constraints..."
            className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none tracking-tight"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="shrink-0 rounded-lg border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">No matches found</p>
              <p className="text-xs">Try searching for &quot;timetable&quot;, &quot;faculty&quot;, or &quot;constraints&quot;</p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="space-y-1">
                <p className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-[#4C1D95] dark:text-[#A78BFA]">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = globalIndex++;
                  const isSelected = idx === activeIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.href + item.label}
                      onClick={() => handleSelect(item.href)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "bg-[#4C1D95]/12 dark:bg-[#8B5CF6]/18 border border-[#4C1D95]/30 dark:border-[#8B5CF6]/40 shadow-sm"
                          : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            isSelected
                              ? "bg-[#4C1D95] dark:bg-[#8B5CF6] text-white border-[#4C1D95] dark:border-[#8B5CF6] shadow-[0_0_12px_rgba(76,29,149,0.5)] dark:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                              : "bg-muted/40 text-muted-foreground border-border"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-xs font-bold leading-none truncate",
                              isSelected ? "text-[#4C1D95] dark:text-[#F8F8FA]" : "text-foreground"
                            )}
                          >
                            {item.label}
                          </p>
                          {item.desc && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <ArrowRight className="size-3.5 shrink-0 text-[#4C1D95] dark:text-[#A78BFA] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Specular Glass Footer */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-4 py-2.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[9px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
              Open
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#4C1D95] dark:text-[#A78BFA]">
            TIMETT Fast Finder
          </span>
        </div>
      </div>
    </div>
  );
}
