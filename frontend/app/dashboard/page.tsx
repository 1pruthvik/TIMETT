"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Clock,
  DoorOpen,
  Layers3,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { TimettLogo } from "@/components/ui/timett-logo";
import { api, friendlyApiError, institutionId } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── Types ── */
type Counts = {
  faculty: number;
  subjects: number;
  rooms: number;
  departments: number;
  timeSlots: number;
  timetables: number;
  academicYears: number;
  academicYear: string;
  semester: string;
};

const initial: Counts = {
  faculty: 0,
  subjects: 0,
  rooms: 0,
  departments: 0,
  timeSlots: 0,
  timetables: 0,
  academicYears: 0,
  academicYear: "Academic year",
  semester: "Semester",
};

/* ── Time-aware greeting ── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Dashboard Page ── */
export default function DashboardPage() {
  const router = useRouter();
  const [counts, setCounts] = useState(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [activeSection, setActiveSection] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setError("");
    const id = institutionId();
    try {
      const [
        faculty,
        subjects,
        rooms,
        departments,
        timeSlots,
        timetables,
        years,
        semesters,
      ] = await Promise.all([
        api<unknown[]>(`/faculty/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/subjects/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/rooms/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/departments/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/time-slots/`).catch(() => []),
        api<unknown[]>("/timetables/").catch(() => []),
        api<{ name: string }[]>(`/academic-years/?institution_id=${id}`).catch(() => []),
        api<{ name: string }[]>(`/semesters/`).catch(() => []),
      ]);

      setCounts({
        faculty: faculty.length,
        subjects: subjects.length,
        rooms: rooms.length,
        departments: departments.length,
        timeSlots: timeSlots.length,
        timetables: timetables.length,
        academicYears: years.length,
        academicYear: years[0]?.name || "2026 - 2027",
        semester: semesters[0]?.name || "Semester 3 (Odd)",
      });
    } catch (reason) {
      setError(friendlyApiError(reason));
    }
  };

  useEffect(() => {
    load();
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.name) setUserName(user.name.split(" ")[0]);
    } catch {}
  }, []);

  // Track active section during scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop;
      const height = container.clientHeight;
      const index = Math.round(scrollPos / height);
      setActiveSection(index);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = document.getElementById(`dash-card-${index}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleGenerateTimetable = async () => {
    setGenerating(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const res = await fetch(
        `${API_BASE}/generator/generate?institution_id=${userInstId}`,
        {
          method: "POST",
        }
      );

      if (res.ok) {
        const result = await res.json();
        if (result.status === "error" || result.status === "infeasible") {
          setError(
            result.message ||
              "Optimization constraint infeasible. Please review offerings & availability."
          );
        } else {
          router.push("/timetable");
        }
      } else {
        setError("Solver returned an error or timeout.");
      }
    } catch {
      setError("Error executing CP-SAT generator.");
    } finally {
      setGenerating(false);
    }
  };

  /* ── 8 Resource & Control Flash Cards in Order (Timetable Studio is directly on starting screen) ── */
  const flashCards = [
    {
      num: "01",
      total: "08",
      category: "Institutional Structure",
      title: "Academic Terms",
      icon: CalendarRange,
      href: "/academic-terms",
      stat: `${counts.academicYears} Academic Years Configured`,
      btnText: "Open Academic Terms",
    },
    {
      num: "02",
      total: "08",
      category: "Academic Hierarchy",
      title: "Departments",
      icon: Building2,
      href: "/departments",
      stat: `${counts.departments} Registered Departments`,
      btnText: "Open Departments",
    },
    {
      num: "03",
      total: "08",
      category: "Physical Infrastructure",
      title: "Rooms & Labs",
      icon: DoorOpen,
      href: "/rooms",
      stat: `${counts.rooms} Physical Facilities`,
      btnText: "Open Rooms & Labs",
    },
    {
      num: "04",
      total: "08",
      category: "Curriculum Inventory",
      title: "Subjects",
      icon: BookOpen,
      href: "/subjects",
      stat: `${counts.subjects} Course Subjects`,
      btnText: "Open Subjects",
    },
    {
      num: "05",
      total: "08",
      category: "Teaching Staff",
      title: "Faculty Instructors",
      icon: Users,
      href: "/faculty",
      stat: `${counts.faculty} Registered Instructors`,
      btnText: "Open Faculty",
    },
    {
      num: "06",
      total: "08",
      category: "Temporal Framework",
      title: "Time Slots",
      icon: Clock,
      href: "/time-slots",
      stat: `${counts.timeSlots} Active Slots Matrix`,
      btnText: "Open Time Slots",
    },
    {
      num: "07",
      total: "08",
      category: "Autonomous Intelligence",
      title: "Kaci",
      icon: Sparkles,
      href: "/constraints",
      stat: "Discrete CP-SAT Optimization Solver Active",
      btnText: "Open Kaci",
    },
    {
      num: "08",
      total: "08",
      category: "Release Archive",
      title: "Versions",
      icon: Layers3,
      href: "/versions",
      stat: "Current Version: v1.0 • Initial Production Release",
      btnText: "Open Versions",
    },
  ];

  return (
    <AppShell>
      {/* ── Vertical Navigation Dots (Right Edge) ── */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-3">
        <button
          onClick={() => scrollToSection(0)}
          title="Timetable Studio & Welcome"
          className={cn(
            "size-2.5 rounded-full transition-all duration-300 cursor-pointer",
            activeSection === 0
              ? "bg-[#0070F3] scale-150 shadow-[0_0_10px_#0070F3]"
              : "bg-white/20 hover:bg-white/50"
          )}
        />
        {flashCards.map((card, i) => (
          <button
            key={card.href}
            onClick={() => scrollToSection(i + 1)}
            title={card.title}
            className={cn(
              "size-2.5 rounded-full transition-all duration-300 cursor-pointer",
              activeSection === i + 1
                ? "bg-[#0070F3] scale-150 shadow-[0_0_10px_#0070F3]"
                : "bg-white/20 hover:bg-white/50"
            )}
          />
        ))}
      </div>

      {/* ── Fullscreen Scroll Snap Container ── */}
      <div
        ref={containerRef}
        className="h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* ═══════════════════════════════════════════════════
            SCREEN 0: WELCOME & TIMETABLE STUDIO (Full Height)
        ═══════════════════════════════════════════════════ */}
        <section
          id="dash-card-0"
          className="h-screen min-h-screen w-full flex flex-col justify-between items-center text-center px-6 sm:px-12 lg:px-20 py-10 relative snap-start snap-always"
        >
          {/* Top Brand Tag */}
          <div className="flex items-center gap-2.5 tt-animate-fade">
            <TimettLogo className="size-8 drop-shadow-[0_0_12px_rgba(0,112,243,0.7)]" />
            <span className="font-heading text-base font-black tracking-tight text-white">
              TIMETT
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              • Intelligent Scheduler
            </span>
          </div>

          {/* Center Welcome & Timetable Studio Launch */}
          <div className="max-w-4xl w-full space-y-8 tt-animate-fade">
            <div className="space-y-3">
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
                {getGreeting()},
              </h1>
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold italic tracking-tight">
                <span className="tt-gradient-text">{userName}.</span>
              </h1>
            </div>

            {error && (
              <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Timetable Studio Launch Action */}
            <div className="flex items-center justify-center pt-4">
              <Link href="/timetable">
                <Button className="h-14 rounded-2xl tt-gradient-btn px-10 text-base font-bold gap-3 cursor-pointer shadow-xl hover:scale-105 transition-all">
                  <CalendarDays className="size-5" />
                  Open Timetable Studio
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Bottom Scroll Down Indicator */}
          <button
            onClick={() => scrollToSection(1)}
            className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors cursor-pointer group pb-2"
            aria-label="Scroll to first module"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">
              Scroll down to explore
            </span>
            <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] group-hover:border-primary/40 group-hover:bg-primary/10 transition-all animate-bounce">
              <ChevronDown className="size-4 text-white/60 group-hover:text-primary transition-colors" />
            </div>
          </button>
        </section>

        {/* ═══════════════════════════════════════════════════
            SCREENS 1 TO 8: SPREAD FLASH CARDS (No borders, No descriptions)
        ═══════════════════════════════════════════════════ */}
        {flashCards.map((card, index) => {
          const Icon = card.icon;
          const isLast = index === flashCards.length - 1;

          return (
            <section
              key={card.href}
              id={`dash-card-${index + 1}`}
              className="h-screen min-h-screen w-full flex flex-col justify-between items-center px-6 sm:px-12 lg:px-24 py-12 relative snap-start snap-always"
            >
              {/* Top Meta Header */}
              <div className="w-full max-w-6xl flex items-center justify-between pt-2">
                <span className="text-sm font-mono font-bold tracking-widest text-muted-foreground/70">
                  {card.num} / {card.total}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8]">
                  {card.category}
                </span>
              </div>

              {/* Central Spread Flash Card (Border removed, spread wide across screen) */}
              <div className="w-full max-w-6xl py-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Icon className="size-10 sm:size-12 text-[#38BDF8] stroke-[1.75]" />
                    <h2 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg font-mono font-medium text-white/50 pl-1">
                    {card.stat}
                  </p>
                </div>

                <div className="shrink-0">
                  <Link href={card.href}>
                    <Button className="tt-gradient-btn h-14 rounded-2xl px-8 text-sm sm:text-base font-bold gap-3 cursor-pointer shadow-xl hover:scale-105 transition-all">
                      {card.btnText}
                      <ArrowRight className="size-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bottom Nav Hint */}
              <div className="pb-2">
                {!isLast ? (
                  <button
                    onClick={() => scrollToSection(index + 2)}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Next module
                    <ChevronDown className="size-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => scrollToSection(0)}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Back to top
                    <ChevronDown className="size-4 rotate-180" />
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
